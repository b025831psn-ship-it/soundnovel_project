"""Build a private, ID-keyed text pack from the reviewed translation snapshot."""
import argparse
import json
import os
from pathlib import Path
import subprocess
from tempfile import NamedTemporaryFile

REVISION = "fbee3d156c69cbe9ed882da18209bcee4ac429d4"
FILES = {
    "script": ("script/script.ja.json", "script/ko/script.ko.json"),
    "scenes": ("script/extra/scene-labels.json", "script/ko/scene-labels-ko.json"),
    "exe": ("script/extra/exe-string-candidates.json", "script/ko/exe-string-candidates-ko.json"),
}


def read_revision(repo, filename):
    raw = subprocess.check_output(["git", "-C", str(repo), "show", f"{REVISION}:{filename}"])
    return json.loads(raw)


def build(repo):
    pack = {"revision": REVISION}
    for key, (ja_file, ko_file) in FILES.items():
        source = read_revision(repo, ja_file)
        target = read_revision(repo, ko_file)
        ids = [item["id"] for item in source]
        if len(ids) != len(set(ids)) or ids != [item["id"] for item in target]:
            raise ValueError(f"source and target IDs differ for {key}")
        entries = {}
        for original, localized in zip(source, target):
            if localized.get("translate") is False:
                continue
            if not isinstance(localized["ko"], str) or not localized["ko"].strip():
                raise ValueError(f"empty translation for {original['id']}")
            entries[original["id"]] = {"ja": original["ja"], "ko": localized["ko"]}
        pack[key] = entries
    return pack


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("private_repo", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    pack = build(args.private_repo)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile("w", dir=args.output.parent, encoding="utf8", delete=False) as out:
        temp = Path(out.name)
        try:
            json.dump(pack, out, ensure_ascii=False, separators=(",", ":"))
        except BaseException:
            out.close()
            temp.unlink()
            raise
    try:
        os.replace(temp, args.output)
    finally:
        temp.unlink(missing_ok=True)
    print(REVISION, {key: len(pack[key]) for key in FILES})


if __name__ == "__main__":
    main()
