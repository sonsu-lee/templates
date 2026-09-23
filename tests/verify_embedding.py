#!/usr/bin/env python3
"""Verify incremental embedding using a disposable source copy and Cargo offline."""

import argparse
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cargo", default="cargo")
    parser.add_argument("--output-dir", type=Path)
    args = parser.parse_args()
    source = Path(__file__).resolve().parents[1]
    if args.output_dir:
        output = args.output_dir.expanduser().resolve()
        output.mkdir(parents=True, exist_ok=False)
    else:
        parent = Path.home() / "tmp"
        parent.mkdir(exist_ok=True)
        output = Path(tempfile.mkdtemp(prefix="sonsu-embedding.", dir=parent))
    checkout = output / "source"
    checkout.mkdir()
    report = {"directory": str(output), "commands": [], "status": "running"}

    def run(command, expected=0, diagnostic=None):
        env = dict(os.environ)
        env["CARGO_TARGET_DIR"] = str(output / "target")
        completed = subprocess.run(command, cwd=checkout, capture_output=True, text=True,
                                   timeout=180, env=env)
        record = {"command": [str(part) for part in command], "exit": completed.returncode,
                  "stdout": completed.stdout, "stderr": completed.stderr}
        report["commands"].append(record)
        assert completed.returncode == expected, record
        if diagnostic:
            assert diagnostic in completed.stderr, record

    def build(expected=0, diagnostic=None):
        run([args.cargo, "build", "--locked", "--offline"], expected, diagnostic)

    def generate(name):
        destination = output / name
        run([str(output / "target/debug/sonsu"), "create", str(destination),
             "--template", "next"])
        return destination

    try:
        for file in ["Cargo.toml", "Cargo.lock", "build.rs"]:
            shutil.copy2(source / file, checkout / file)
        shutil.copytree(source / "src", checkout / "src")
        tracked = subprocess.check_output(["git", "ls-files", "-z", "--", "templates"], cwd=source)
        for name in tracked.decode().split("\0"):
            if name:
                destination = checkout / name
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source / name, destination)
        template = checkout / "templates/next-fullstack"
        build()
        assert not (generate("baseline") / "added.txt").exists()

        (template / "added.txt").write_bytes(b"first\x00version\xff")
        for name in [".env.local", ".DS_Store", "cached.tsbuildinfo", "node_modules/sentinel", ".next/server/sentinel"]:
            path = template / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("must not embed")
        build()
        generated = generate("addition")
        assert (generated / "added.txt").read_bytes() == b"first\x00version\xff"
        for name in [".env.local", ".DS_Store", "cached.tsbuildinfo", "node_modules", ".next"]:
            assert not (generated / name).exists(), name

        (template / "added.txt").write_bytes(b"second-version")
        (template / ".env.example").write_text("PUBLIC_EXAMPLE=kept\n")
        build()
        generated = generate("modification")
        assert (generated / "added.txt").read_bytes() == b"second-version"
        assert (generated / ".env.example").read_text() == "PUBLIC_EXAMPLE=kept\n"

        (template / "added.txt").unlink()
        (template / ".github/workflows/ci.yml").unlink()
        build()
        generated = generate("deletion")
        assert not (generated / "added.txt").exists()
        assert not (generated / ".github/workflows/ci.yml").exists()

        (template / "source-link").symlink_to("package.json")
        build(101, "must not contain symlinks or special files")
        (template / "source-link").unlink()
        os.mkfifo(template / "special-file")
        build(101, "must not contain symlinks or special files")
        (template / "special-file").unlink()
        build()
        report["status"] = "passed"
    except BaseException as error:
        report["status"] = "failed"
        report["error"] = str(error)
        raise
    finally:
        (output / "verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        print(output)


if __name__ == "__main__":
    main()
