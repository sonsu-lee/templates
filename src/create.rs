use std::fs::{self, File, OpenOptions};
use std::io::{self, Write};
use std::path::{Component, Path, PathBuf};

use crate::error::Failure;
use crate::templates::Template;

pub struct EmbeddedFile {
    pub template: Template,
    pub path: &'static str,
    pub contents: &'static [u8],
}

include!(concat!(env!("OUT_DIR"), "/embedded.rs"));

pub fn create(destination: &Path, template: Template) -> Result<PathBuf, Failure> {
    materialize(
        destination,
        FILES.iter().filter(|file| file.template == template),
        |file, contents| file.write_all(contents),
    )
}

fn materialize<'a>(
    destination: &Path,
    files: impl Iterator<Item = &'a EmbeddedFile>,
    mut write: impl FnMut(&mut File, &[u8]) -> io::Result<()>,
) -> Result<PathBuf, Failure> {
    let parent = destination
        .parent()
        .filter(|path| !path.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."));
    let parent = parent.canonicalize().map_err(|error| {
        Failure::io(format!(
            "Unable to access destination parent {}: {error}",
            parent.display()
        ))
    })?;
    if !parent.is_dir() {
        return Err(Failure::io(format!(
            "Destination parent is not a directory: {}",
            parent.display()
        )));
    }
    let name = destination
        .file_name()
        .ok_or_else(|| Failure::input("Destination must name a new directory"))?;
    let destination = parent.join(name);
    match fs::symlink_metadata(&destination) {
        Ok(_) => {
            return Err(Failure::io(format!(
                "Destination already exists: {}",
                destination.display()
            )));
        }
        Err(error) if error.kind() == io::ErrorKind::NotFound => {}
        Err(error) => {
            return Err(Failure::io(format!(
                "Unable to inspect destination {}: {error}",
                destination.display()
            )));
        }
    }

    // Only a successful, exclusive directory creation gives us cleanup responsibility.
    fs::create_dir(&destination).map_err(|error| {
        if error.kind() == io::ErrorKind::AlreadyExists {
            Failure::io(format!(
                "Destination already exists: {}",
                destination.display()
            ))
        } else {
            Failure::io(format!(
                "Unable to create destination {}: {error}",
                destination.display()
            ))
        }
    })?;

    let result = (|| -> io::Result<()> {
        for entry in files {
            let relative = Path::new(entry.path);
            if relative.as_os_str().is_empty()
                || !relative
                    .components()
                    .all(|part| matches!(part, Component::Normal(_)))
            {
                return Err(io::Error::other(format!(
                    "Invalid embedded path: {}",
                    entry.path
                )));
            }
            let path = destination.join(relative);
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)?;
            }
            let mut file = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&path)
                .map_err(|error| {
                    io::Error::new(error.kind(), format!("{}: {error}", path.display()))
                })?;
            write(&mut file, entry.contents).map_err(|error| {
                io::Error::new(error.kind(), format!("{}: {error}", path.display()))
            })?;
        }
        Ok(())
    })();

    if let Err(error) = result {
        let cleanup = fs::remove_dir_all(&destination);
        return Err(Failure::io(match cleanup {
            Ok(()) => format!(
                "Unable to copy template: {error}; removed incomplete destination {}",
                destination.display()
            ),
            Err(cleanup) => format!(
                "Unable to copy template: {error}; cleanup failed: {cleanup}; incomplete destination remains at {}",
                destination.display()
            ),
        }));
    }
    Ok(destination)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn partial_write_failure_removes_only_our_destination() {
        let temp = tempfile::tempdir().unwrap();
        let destination = temp.path().join("new");
        fs::write(temp.path().join("sibling"), b"keep").unwrap();
        let mut calls = 0;
        let error = materialize(
            &destination,
            FILES
                .iter()
                .filter(|file| file.template == Template::Fullstack),
            |file, contents| {
                calls += 1;
                if calls == 3 {
                    file.write_all(&contents[..contents.len().min(3)])?;
                    Err(io::Error::other("injected disk write failure"))
                } else {
                    file.write_all(contents)
                }
            },
        )
        .unwrap_err();
        assert_eq!(calls, 3);
        assert!(error.message.contains("injected disk write failure"));
        assert!(!destination.exists());
        assert_eq!(fs::read(temp.path().join("sibling")).unwrap(), b"keep");
    }

    #[test]
    fn invalid_embedded_path_does_not_escape_destination() {
        let temp = tempfile::tempdir().unwrap();
        let files = [EmbeddedFile {
            template: Template::Fullstack,
            path: "../sibling",
            contents: b"overwrite",
        }];
        fs::write(temp.path().join("sibling"), b"keep").unwrap();
        let destination = temp.path().join("new");
        let error = materialize(&destination, files.iter(), |file, bytes| {
            file.write_all(bytes)
        })
        .unwrap_err();
        assert!(error.message.contains("Invalid embedded path"));
        assert!(!destination.exists());
        assert_eq!(fs::read(temp.path().join("sibling")).unwrap(), b"keep");
    }
}
