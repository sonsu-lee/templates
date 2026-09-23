#!/usr/bin/env python3
"""Exercise the built CLI outside the checkout; no generated app tools are run."""

import argparse
import errno
import hashlib
import json
import os
import platform
import pty
import select
import shutil
import signal
import subprocess
import tempfile
import time
from pathlib import Path


SOURCE = Path(__file__).resolve().parents[1]


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def tree(root):
    files = {}
    for path in sorted(root.rglob("*")):
        assert not path.is_symlink(), f"Unexpected generated symlink: {path}"
        if path.is_file():
            files[path.relative_to(root).as_posix()] = sha256(path.read_bytes())
    return files


def source_tree(template):
    prefix = f"templates/{template}/"
    paths = subprocess.check_output(
        ["git", "ls-files", "-z", "--", prefix], cwd=SOURCE
    ).decode().split("\0")
    files = {
        path[len(prefix):]: sha256((SOURCE / path).read_bytes())
        for path in paths if path
    }
    assert files, f"No tracked source files for {template}"
    return files


def run_pty(binary, cwd, args, steps, expected, records, close_input=False):
    """Wait for actual prompts before sending keys, with a bounded child lifetime."""
    pid, master = pty.fork()
    if pid == 0:
        if close_input:
            # Exercise read/write failure instead of being terminated by SIGHUP.
            signal.signal(signal.SIGHUP, signal.SIG_IGN)
        os.chdir(cwd)
        os.environ["TERM"] = "xterm-256color"
        os.execv(str(binary), [str(binary), *args])
    output = bytearray()
    position = 0
    step = 0
    status = None
    deadline = time.monotonic() + 15
    started = time.monotonic()
    try:
        while time.monotonic() < deadline:
            if master is not None and select.select([master], [], [], 0.05)[0]:
                try:
                    chunk = os.read(master, 65536)
                    output.extend(chunk)
                except OSError as error:
                    if error.errno != errno.EIO:
                        raise
            if step < len(steps):
                prompt, keys = steps[step]
                match = output.find(prompt.encode(), position)
                if match >= 0:
                    position = len(output)
                    os.write(master, keys)
                    step += 1
            if close_input and b"Architecture" in output and master is not None:
                os.close(master)
                master = None
            child, candidate = os.waitpid(pid, os.WNOHANG)
            if child:
                status = candidate
                break
        assert status is not None, f"PTY timeout: {args!r}; {output!r}"
        code = os.waitstatus_to_exitcode(status)
        records.append({
            "command": [str(binary), *args], "mode": "pty", "exit": code,
            "output": output.decode(errors="replace"), "steps_sent": step,
            "seconds": round(time.monotonic() - started, 3),
        })
        assert code == expected, records[-1]
        if not close_input:
            assert step == len(steps), records[-1]
    finally:
        if status is None:
            os.kill(pid, signal.SIGKILL)
            os.waitpid(pid, 0)
        if master is not None:
            os.close(master)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("binary", type=Path)
    parser.add_argument("--output-dir", type=Path)
    args = parser.parse_args()
    if args.output_dir:
        output = args.output_dir.expanduser().resolve()
        output.mkdir(parents=True, exist_ok=False)
    else:
        parent = Path.home() / "tmp"
        parent.mkdir(exist_ok=True)
        output = Path(tempfile.mkdtemp(prefix="sonsu-issue4.", dir=parent))
    binary = output / "sonsu"
    shutil.copy2(args.binary.resolve(), binary)
    report = {
        "source": str(SOURCE), "directory": str(output),
        "platform": platform.platform(), "machine": platform.machine(),
        "binary_sha256": sha256(binary.read_bytes()),
        "commands": [], "comparisons": [], "status": "running",
    }

    def run(arguments, expected=0, diagnostic=None, prefix=()):
        command = [*prefix, str(binary), *arguments]
        completed = subprocess.run(command, cwd=output, stdin=subprocess.DEVNULL,
                                   capture_output=True, text=True, timeout=15)
        record = {"command": command, "mode": "noninteractive",
                  "exit": completed.returncode, "stdout": completed.stdout,
                  "stderr": completed.stderr}
        report["commands"].append(record)
        assert completed.returncode == expected, record
        if diagnostic:
            assert diagnostic in completed.stderr, record
        return completed

    def compare(name, template):
        actual = tree(output / name)
        expected = source_tree(template)
        assert actual == expected, f"Source mismatch: {name}"
        report["comparisons"].append({"destination": str(output / name),
                                      "template": template, "files": len(actual),
                                      "file_hashes": actual, "equal": True})

    try:
        help_text = run(["--help"]).stdout
        assert "templates" in help_text and "create" in help_text
        listing = run(["templates"])
        variants = [
            ("next-app", "next-fullstack", ["--template", "next"]),
            ("node-service", "next-node-nest", ["--template", "next-nest", "--web", "node"]),
            ("static-service", "next-static-nest", ["--template", "next-nest", "--web", "static"]),
            ("default-service", "next-node-nest", ["--template", "next-nest"]),
        ]
        for name, template, flags in variants:
            assert template in listing.stdout
            run(["create", name, *flags])
            compare(name, template)
        run(["create", "bad", "--template", "next", "--web", "static"], 2, "static")
        run(["create", "missing-option"], 2, "--template")
        run(["create", "next-app", "--template", "next"], 1, "already exists")
        compare("next-app", "next-fullstack")
        assert not (output / "bad").exists()
        assert not (output / "missing-option").exists()
        for name, target in [("valid-link", "next-app"), ("dangling-link", "absent")]:
            (output / name).symlink_to(target)
            run(["create", name, "--template", "next"], 1, "already exists")
            assert os.readlink(output / name) == target
        assert not (output / "absent").exists()

        for name, template, flags, keys in [
            ("interactive-next", "next-fullstack", [], [("Architecture", b"\r")]),
            ("interactive-node", "next-node-nest", [], [("Architecture", b"\x1b[B\r"), ("Web deployment", b"\r")]),
            ("interactive-static", "next-static-nest", [], [("Architecture", b"\x1b[B\r"), ("Web deployment", b"\x1b[B\r")]),
            ("interactive-web-option", "next-static-nest", ["--web", "static"], [("Architecture", b"\x1b[B\r")]),
            ("interactive-explicit", "next-node-nest", ["--template", "next-nest"], []),
        ]:
            run_pty(binary, output, ["create", name, *flags], keys, 0, report["commands"])
            compare(name, template)
        for name, steps in [
            ("cancel-escape", [("Architecture", b"\x1b")]),
            ("cancel-q", [("Architecture", b"q")]),
            ("cancel-web", [("Architecture", b"\x1b[B\r"), ("Web deployment", b"q")]),
        ]:
            run_pty(binary, output, ["create", name], steps, 130, report["commands"])
            assert not (output / name).exists()
        run_pty(binary, output, ["create", "closed-terminal"], [], 1,
                report["commands"], close_input=True)
        assert not (output / "closed-terminal").exists()

        assert platform.system() == "Darwin", "Network/file isolation test requires macOS sandbox-exec"
        denied = {str(SOURCE), str(SOURCE.resolve())}
        git_common = subprocess.check_output(
            ["git", "rev-parse", "--path-format=absolute", "--git-common-dir"], cwd=SOURCE
        ).decode().strip()
        denied.add(str(Path(git_common).parent))
        profile = "(version 1) (allow default) (deny network*)\n" + "\n".join(
            f"(deny file-read* (subpath {json.dumps(path)}))" for path in sorted(denied)
        )
        profile_path = output / "offline.sb"
        profile_path.write_text(profile + "\n")
        prefix = ["/usr/bin/sandbox-exec", "-f", str(profile_path)]
        # Positive controls: prove the profile actually prevents both capabilities.
        controls = [
            ([*prefix, "/bin/cat", str(SOURCE / "README.md")], "Operation not permitted"),
            ([*prefix, "/usr/bin/python3", "-c", "import socket; socket.create_connection(('127.0.0.1', 9), timeout=1)"], "Operation not permitted"),
        ]
        for command, diagnostic in controls:
            completed = subprocess.run(command, cwd=output, capture_output=True, text=True, timeout=15)
            record = {"command": command, "mode": "sandbox-control", "exit": completed.returncode,
                      "stdout": completed.stdout, "stderr": completed.stderr}
            report["commands"].append(record)
            assert completed.returncode != 0 and diagnostic in completed.stderr, record
        for name, template, flags in variants[:3]:
            name = "offline-" + name
            run(["create", name, *flags], prefix=prefix)
            compare(name, template)
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
