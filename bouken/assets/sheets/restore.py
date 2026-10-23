"""Restore original PNGs from parts. Run: python bouken/assets/sheets/restore.py"""
from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parent
manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
for asset in manifest["assets"]:
    target = root / asset["name"]
    data = b"".join((root / part["file"]).read_bytes() for part in asset["parts"]) if "parts" in asset else target.read_bytes()
    if len(data) != asset["bytes"] or hashlib.sha256(data).hexdigest() != asset["sha256"]:
        raise ValueError("Integrity check failed: " + asset["name"])
    if "parts" in asset:
        target.write_bytes(data)
    print("Verified:", asset["name"])
