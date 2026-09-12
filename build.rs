#[path = "src/embedding.rs"]
mod embedding;
#[path = "src/templates.rs"]
mod templates;

use std::env;
use std::fmt::Write as _;
use std::fs;
use std::path::PathBuf;

fn main() {
    let manifest = PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").unwrap());
    let output = PathBuf::from(env::var_os("OUT_DIR").unwrap()).join("embedded.rs");
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=src/embedding.rs");
    println!("cargo:rerun-if-changed=src/templates.rs");
    let mut generated = String::from("pub static FILES: &[EmbeddedFile] = &[\n");
    for template in templates::Template::ALL {
        let root = manifest.join("templates").join(template.directory());
        // Watching the directory also detects additions and removals.
        println!("cargo:rerun-if-changed={}", root.display());
        let files = embedding::collect(&root)
            .unwrap_or_else(|error| panic!("Unable to embed {}: {error}", root.display()));
        for path in files {
            let source = root.join(&path);
            let relative = path
                .iter()
                .map(|part| part.to_str().expect("UTF-8 template path"))
                .collect::<Vec<_>>()
                .join("/");
            writeln!(generated, "    EmbeddedFile {{ template: Template::{template:?}, path: {relative:?}, contents: include_bytes!({:?}) }},", source.to_str().expect("UTF-8 source path")).unwrap();
        }
    }
    generated.push_str("];\n");
    fs::write(output, generated).expect("write embedded template table");
}
