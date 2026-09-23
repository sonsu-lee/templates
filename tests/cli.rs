use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};

fn binary() -> &'static str {
    env!("CARGO_BIN_EXE_sonsu")
}

fn run(cwd: &Path, args: &[&str]) -> Output {
    Command::new(binary())
        .current_dir(cwd)
        .args(args)
        // Project creation must not need git, pnpm, curl, or other commands on PATH.
        .env("PATH", "")
        .stdin(Stdio::null())
        .output()
        .unwrap()
}

fn assert_exit(output: &Output, code: i32) {
    assert_eq!(
        output.status.code(),
        Some(code),
        "stdout={}\nstderr={}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
}

fn tree(root: &Path) -> BTreeMap<PathBuf, Vec<u8>> {
    fn visit(root: &Path, dir: &Path, files: &mut BTreeMap<PathBuf, Vec<u8>>) {
        for entry in fs::read_dir(dir).unwrap() {
            let path = entry.unwrap().path();
            if path.is_dir() {
                visit(root, &path, files);
            } else {
                files.insert(
                    path.strip_prefix(root).unwrap().into(),
                    fs::read(path).unwrap(),
                );
            }
        }
    }
    let mut files = BTreeMap::new();
    visit(root, root, &mut files);
    files
}

// Git's tracked source list is independent of the build script's collection rules.
fn source_tree(template: &str) -> BTreeMap<PathBuf, Vec<u8>> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let prefix = format!("templates/{template}/");
    let output = Command::new("git")
        .current_dir(root)
        .args(["ls-files", "-z", "--", &prefix])
        .output()
        .unwrap();
    assert!(output.status.success());
    let files: BTreeMap<_, _> = output
        .stdout
        .split(|byte| *byte == 0)
        .filter(|name| !name.is_empty())
        .map(|name| {
            let name = std::str::from_utf8(name).unwrap();
            (
                PathBuf::from(name.strip_prefix(&prefix).unwrap()),
                fs::read(root.join(name)).unwrap(),
            )
        })
        .collect();
    assert!(
        !files.is_empty(),
        "the independent source oracle must not be empty"
    );
    files
}

#[test]
fn copies_all_three_templates_exactly() {
    let temp = tempfile::tempdir().unwrap();
    let output = run(temp.path(), &["templates"]);
    assert_exit(&output, 0);
    assert_eq!(fs::read_dir(temp.path()).unwrap().count(), 0);
    let stdout = String::from_utf8(output.stdout).unwrap();
    let ids: Vec<_> = stdout
        .lines()
        .map(|line| line.split_whitespace().next().unwrap())
        .collect();
    assert_eq!(
        ids,
        ["next-fullstack", "next-node-nest", "next-static-nest"]
    );

    for (index, id) in ids.into_iter().enumerate() {
        let destination = format!("generated-{index}");
        let output = run(temp.path(), &["create", &destination, "--template", id]);
        assert_exit(&output, 0);
        assert_eq!(tree(&temp.path().join(destination)), source_tree(id));
    }
}

#[test]
fn version_identifies_the_package_and_embedded_source() {
    let temp = tempfile::tempdir().unwrap();
    let output = run(temp.path(), &["--version"]);
    assert_exit(&output, 0);
    assert_eq!(
        String::from_utf8(output.stdout).unwrap(),
        format!(
            "sonsu {} (source {})\n",
            env!("CARGO_PKG_VERSION"),
            env!("SONSU_SOURCE_REVISION")
        )
    );
}

#[test]
fn invalid_arguments_fail_before_writing() {
    let temp = tempfile::tempdir().unwrap();
    let cases: [(&[&str], &[&str]); 5] = [
        (&["create", "out"], &["--template", "sonsu templates"]),
        (
            &["create", "out", "--template", "unknown"],
            &["next-fullstack", "next-node-nest", "next-static-nest"],
        ),
        (&["create", "out", "--template", "next"], &[]),
        (&["create", "out", "--template", "next-nest"], &[]),
        (
            &[
                "create",
                "out",
                "--template",
                "next-fullstack",
                "--web",
                "node",
            ],
            &[],
        ),
    ];
    for (args, diagnostics) in cases {
        let output = run(temp.path(), args);
        assert_exit(&output, 2);
        let stderr = String::from_utf8_lossy(&output.stderr);
        for diagnostic in diagnostics {
            assert!(stderr.contains(diagnostic), "{args:?}: {stderr}");
        }
        assert!(!temp.path().join("out").exists(), "{args:?}");
    }
}

#[test]
fn existing_files_and_directories_are_preserved() {
    let temp = tempfile::tempdir().unwrap();
    fs::write(temp.path().join("file"), "keep").unwrap();
    fs::create_dir(temp.path().join("empty")).unwrap();
    fs::create_dir(temp.path().join("full")).unwrap();
    fs::write(temp.path().join("full/keep"), "untouched").unwrap();
    let before = tree(temp.path());
    for name in ["file", "empty", "full"] {
        let output = run(
            temp.path(),
            &["create", name, "--template", "next-fullstack"],
        );
        assert_exit(&output, 1);
        assert_eq!(tree(temp.path()), before);
        assert!(temp.path().join("empty").is_dir());
    }
}

#[cfg(unix)]
#[test]
fn existing_symlinks_including_dangling_links_are_preserved() {
    use std::os::unix::fs::symlink;
    let temp = tempfile::tempdir().unwrap();
    fs::create_dir(temp.path().join("real")).unwrap();
    fs::write(temp.path().join("real/keep"), "keep").unwrap();
    for (name, target) in [("valid", "real"), ("dangling", "absent")] {
        symlink(target, temp.path().join(name)).unwrap();
        let output = run(
            temp.path(),
            &["create", name, "--template", "next-fullstack"],
        );
        assert_exit(&output, 1);
        assert_eq!(
            fs::read_link(temp.path().join(name)).unwrap(),
            Path::new(target)
        );
    }
    assert_eq!(fs::read(temp.path().join("real/keep")).unwrap(), b"keep");
    assert!(!temp.path().join("absent").exists());
}

#[test]
fn missing_or_non_directory_parent_is_not_created_or_modified() {
    let temp = tempfile::tempdir().unwrap();
    fs::write(temp.path().join("file"), "keep").unwrap();
    for name in ["missing/app", "file/app"] {
        let output = run(
            temp.path(),
            &["create", name, "--template", "next-fullstack"],
        );
        assert_exit(&output, 1);
    }
    assert_eq!(fs::read(temp.path().join("file")).unwrap(), b"keep");
    assert!(!temp.path().join("missing").exists());
}

#[test]
fn concurrent_creates_have_one_winner_and_a_complete_result() {
    let temp = tempfile::tempdir().unwrap();
    let mut children = Vec::new();
    for _ in 0..4 {
        children.push(
            Command::new(binary())
                .current_dir(temp.path())
                .args(["create", "same", "--template", "next-fullstack"])
                .stdin(Stdio::null())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .unwrap(),
        );
    }
    let outputs: Vec<_> = children
        .into_iter()
        .map(|child| child.wait_with_output().unwrap())
        .collect();
    assert_eq!(
        outputs
            .iter()
            .filter(|output| output.status.success())
            .count(),
        1
    );
    for output in outputs.iter().filter(|output| !output.status.success()) {
        assert_exit(output, 1);
    }
    assert_eq!(
        tree(&temp.path().join("same")),
        source_tree("next-fullstack")
    );
}
