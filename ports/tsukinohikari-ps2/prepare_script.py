"""Build local bilingual ED documents from the issue 54 translation revision."""
import argparse
import json
import re
import subprocess
from pathlib import Path

TRANSLATION = "d59d59b369b30fafdaf9cd60ee8f45265d049277"
CONTROLS = re.compile(r"\{[0-9A-F:]+\}")


def read_revision(repo, path):
    return json.loads(subprocess.check_output(
        ["git", "-C", str(repo), "show", f"{TRANSLATION}:{path}"]
    ))


def build(repo, output):
    documents = {}
    count = 0
    for number in (*range(9), *range(10, 19)):
        name = f"S{number:02}.json"
        pages = read_revision(repo, f"source/ja/{name}")
        records = read_revision(repo, f"source/ko/{name}")
        by_id = {record["id"]: record["ko"] for record in records}
        if len(by_id) != len(records):
            raise ValueError(f"{name}: duplicate translation ID")
        for page in pages:
            for item in page["items"]:
                if item["kind"] not in ("text", "choice"):
                    continue
                korean = by_id.pop(item["id"])
                if not korean.strip() or CONTROLS.findall(korean) != CONTROLS.findall(item["ja"]):
                    raise ValueError(f"{item['id']}: incomplete translation or control mismatch")
                item["ko"] = korean
                count += 1
        if by_id:
            raise ValueError(f"{name}: unmatched translation IDs")
        documents[name] = pages
    output.mkdir(parents=True, exist_ok=True)
    for name, pages in documents.items():
        (output / name).write_text(json.dumps(pages, ensure_ascii=False), encoding="utf-8")
    print(f"{len(documents)} ED files, {count} translated IDs, {TRANSLATION}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("private_repository", type=Path)
    parser.add_argument("private_output_directory", type=Path)
    args = parser.parse_args()
    build(args.private_repository, args.private_output_directory)
