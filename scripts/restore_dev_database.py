#!/usr/bin/env python3
"""Replace the local discowarpcore_dev database from a MongoDB archive.

This script is deliberately restricted to the local development database. It
will refuse non-loopback MongoDB URIs, non-development database names, and
archives outside this repository's dump/ directory.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from urllib.parse import urlsplit


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ARCHIVE = (
    REPO_ROOT
    / "dump"
    / "neonazoth-discowarpcore-production-20260727-090143.archive.gz"
)
TARGET_DATABASE = "discowarpcore_dev"
ALLOWED_HOSTS = {"127.0.0.1", "localhost", "::1"}


def load_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.is_file():
        return values

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip("'\"")
    return values


def validate_local_uri(uri: str) -> None:
    parsed = urlsplit(uri)
    database = parsed.path.rstrip("/").lstrip("/")

    if parsed.scheme not in {"mongodb", "mongodb+srv"}:
        raise SystemExit("Refusing unexpected MONGO_URI scheme.")
    if parsed.hostname not in ALLOWED_HOSTS:
        raise SystemExit(
            f"Refusing non-local MongoDB host: {parsed.hostname or '<missing>'}."
        )
    if database != TARGET_DATABASE:
        raise SystemExit(
            f"Refusing database {database or '<missing>'}; expected {TARGET_DATABASE}."
        )
    if parsed.scheme == "mongodb+srv":
        raise SystemExit("Refusing mongodb+srv for a local development restore.")


def resolve_archive(raw_path: str) -> Path:
    archive = Path(raw_path).expanduser().resolve()
    dump_root = (REPO_ROOT / "dump").resolve()
    if archive.parent != dump_root:
        raise SystemExit(f"Archive must be directly inside {dump_root}.")
    if not archive.name.endswith(".archive.gz"):
        raise SystemExit("Archive must be a gzipped MongoDB archive (*.archive.gz).")
    if not archive.is_file():
        raise SystemExit(f"Archive not found: {archive}")
    return archive


def run_node_database_action(uri: str, action: str) -> str:
    node_script = """
const mongoose = require('mongoose');
const uri = process.env.MONGO_URI;
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }).then(async () => {
  const db = mongoose.connection.db;
  if (process.argv[1] === 'drop') {
    await db.dropDatabase();
    console.log('dropped');
  } else {
    const collections = (await db.listCollections().toArray()).map((item) => item.name).sort();
    const counts = {};
    for (const name of collections) counts[name] = await db.collection(name).countDocuments();
    console.log(JSON.stringify({ database: db.databaseName, collections, counts }));
  }
  await mongoose.disconnect();
  process.exit(0);
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
"""
    env = {**os.environ, "MONGO_URI": uri}
    result = subprocess.run(
        ["node", "-e", node_script, action],
        cwd=REPO_ROOT,
        env=env,
        check=False,
        text=True,
        capture_output=True,
    )
    if result.returncode != 0:
        raise SystemExit(result.stderr.strip() or "MongoDB action failed.")
    return result.stdout.strip()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--archive",
        default=str(DEFAULT_ARCHIVE),
        help=f"MongoDB archive to restore (default: {DEFAULT_ARCHIVE})",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help=f"Confirm dropping and replacing {TARGET_DATABASE}.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate the URI and archive without changing the database.",
    )
    args = parser.parse_args()

    archive = resolve_archive(args.archive)
    env = load_env_file(REPO_ROOT / "backend" / ".env")
    uri = env.get("MONGO_URI") or os.environ.get("MONGO_URI", "")
    if not uri:
        raise SystemExit("MONGO_URI was not found in backend/.env or the environment.")
    validate_local_uri(uri)

    mongorestore = shutil.which("mongorestore")
    if not mongorestore:
        raise SystemExit("mongorestore was not found on PATH.")

    print(f"Archive: {archive}")
    print(f"Target:  {TARGET_DATABASE} on local MongoDB")
    if args.dry_run:
        print("Dry run: no database changes made.")
        return 0

    if not args.yes:
        print(
            f"Refusing to continue without --yes; this will drop {TARGET_DATABASE}.",
            file=sys.stderr,
        )
        return 2

    print(f"Dropping {TARGET_DATABASE}...")
    print(run_node_database_action(uri, "drop"))
    print("Restoring archive...")
    subprocess.run(
        [
            mongorestore,
            "--drop",
            "--gzip",
            f"--archive={archive}",
            "--nsFrom=discowarpcore.*",
            f"--nsTo={TARGET_DATABASE}.*",
        ],
        cwd=REPO_ROOT,
        check=True,
    )
    verification = run_node_database_action(uri, "verify")
    print(f"Verified: {json.loads(verification)}")
    print("Development database replacement completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
