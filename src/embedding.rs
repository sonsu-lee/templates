use std::fs;
use std::io;
use std::path::{Component, Path, PathBuf};

pub fn valid_relative_path(path: &Path) -> bool {
    !path.as_os_str().is_empty()
        && path
            .components()
            .all(|component| matches!(component, Component::Normal(_)))
}

fn excluded(name: &str) -> bool {
    matches!(
        name,
        ".git"
            | "node_modules"
            | ".next"
            | "out"
            | "dist"
            | "coverage"
            | "target"
            | ".cache"
            | ".DS_Store"
    ) || name.ends_with(".tsbuildinfo")
        || (name.starts_with(".env") && name != ".env.example")
}

pub fn collect(root: &Path) -> io::Result<Vec<PathBuf>> {
    fn visit(root: &Path, directory: &Path, files: &mut Vec<PathBuf>) -> io::Result<()> {
        for entry in fs::read_dir(directory)? {
            let entry = entry?;
            let name = entry.file_name();
            let name = name
                .to_str()
                .ok_or_else(|| io::Error::other("Template paths must be UTF-8"))?;
            // Skip generated trees before inspecting their contents (e.g. pnpm's symlinks).
            if excluded(name) {
                continue;
            }
            let path = entry.path();
            let file_type = entry.file_type()?;
            if file_type.is_dir() {
                visit(root, &path, files)?;
            } else if file_type.is_file() {
                let relative = path.strip_prefix(root).map_err(io::Error::other)?;
                if !valid_relative_path(relative) {
                    return Err(io::Error::other(format!(
                        "Invalid template path: {}",
                        path.display()
                    )));
                }
                files.push(relative.to_path_buf());
            } else {
                return Err(io::Error::other(format!(
                    "Template source must not contain symlinks or special files: {}",
                    path.display()
                )));
            }
        }
        Ok(())
    }
    if !fs::symlink_metadata(root)?.file_type().is_dir() {
        return Err(io::Error::other(format!(
            "Template root must be a directory: {}",
            root.display()
        )));
    }
    let mut files = Vec::new();
    visit(root, root, &mut files)?;
    files.sort();
    if files.is_empty() {
        return Err(io::Error::other(format!(
            "Template is empty: {}",
            root.display()
        )));
    }
    Ok(files)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_paths_outside_the_template() {
        for path in ["", ".", "..", "../file", "a/../../file", "/absolute"] {
            assert!(!valid_relative_path(Path::new(path)), "{path}");
        }
        assert!(valid_relative_path(Path::new(".github/workflows/ci.yml")));
    }

    #[test]
    fn preserves_source_dotfiles_but_excludes_local_outputs() {
        let temp = tempfile::tempdir().unwrap();
        for file in [
            ".env.example",
            ".env",
            ".env.local",
            ".DS_Store",
            "build.tsbuildinfo",
            "package.json",
            "pnpm-lock.yaml",
            ".gitignore",
        ] {
            fs::write(temp.path().join(file), b"test").unwrap();
        }
        for directory in [
            ".github",
            ".vscode",
            ".git",
            "node_modules",
            ".next",
            "out",
            "dist",
            "coverage",
            "target",
            ".cache",
        ] {
            fs::create_dir(temp.path().join(directory)).unwrap();
            fs::write(temp.path().join(directory).join("fixture"), b"test").unwrap();
        }
        let files = collect(temp.path()).unwrap();
        let expected: Vec<PathBuf> = [
            ".env.example",
            ".github/fixture",
            ".gitignore",
            ".vscode/fixture",
            "package.json",
            "pnpm-lock.yaml",
        ]
        .into_iter()
        .map(PathBuf::from)
        .collect();
        assert_eq!(files, expected);
    }

    #[cfg(unix)]
    #[test]
    fn rejects_source_symlinks_and_symlink_roots() {
        use std::os::unix::fs::symlink;
        let temp = tempfile::tempdir().unwrap();
        fs::write(temp.path().join("real"), b"keep").unwrap();
        symlink("real", temp.path().join("link")).unwrap();
        assert!(
            collect(temp.path())
                .unwrap_err()
                .to_string()
                .contains("symlink")
        );
        let link_root = tempfile::tempdir().unwrap();
        symlink(temp.path(), link_root.path().join("root")).unwrap();
        assert!(collect(&link_root.path().join("root")).is_err());
    }
}
