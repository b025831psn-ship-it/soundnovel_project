#!/usr/bin/env python3
"""Translation source for the SN4 scenarios, and the checks a translation must pass.

  python3 sn4text.py extract sn4.json out-dir        # write out-dir/<chunk>.json + index.json
  python3 sn4text.py check ja-dir [ko-dir]           # verify the source (and a translation)

sn4.json is the sn4dump.py output (scenario.sn4 or love.sn4). The format is described in
tools/TRANSLATION.md. A message ("unit") is the text the VM shows between two stops, in file
order, without crossing a label. Its id is "<label>@<hex file offset of its first text op>",
which never changes for this disc. Inside "ja", inline commands are tokens:

  {HERO} {PARTNER} {NAME3}   name ops 0x0D / 0x0E / 0x0F
  \n                          newline op 0x04
  {rb:base|reading}          ruby op 0x106 over the following characters
  {#n}                       any other command between two pieces of text; codes[n] holds it
"""
import collections, json, os, re, sys

NAMES = {0x0D: "{HERO}", 0x0E: "{PARTNER}", 0x0F: "{NAME3}"}
# Ops that end a message: pauses, page break, choice separator, select, scene load,
# jumps and conditional jumps (the text after them can belong to another path).
STOP = {0x09: "pause", 0x0B: "pause-clear", 0x0C: "page-break", 0x16: "choice-end",
        0x6C: "select", 0x73: "scene", 0x6A: "jump", 0x6B: "jump", 0x70: "if", 0x71: "if"}
TOKEN = re.compile(r"\{(?:HERO|PARTNER|NAME3|#\d+|rb:[^|{}]*\|[^{}]*)\}")


def units(program):
    labels = program["labels"]
    by_name = {l["label"]: l for l in labels}

    def resolve(name):  # aliases at the same position are empty labels falling through
        while name in by_name and not by_name[name]["ops"] and by_name[name].get("next"):
            name = by_name[name]["next"]
        return name
    targets = {}  # choice option label -> (group id, index)
    groups = []
    for l in labels:
        for o in l["ops"]:
            if o["op"] == 0x6C:
                gid = f"{l['label']}@{o['offset']:#x}"
                groups.append({"id": gid, "label": l["label"], "options": []})
                for i, t in enumerate(o["args"][0]): targets.setdefault(resolve(t), []).append({"group": gid, "index": i})
    out, scene = [], None
    for l in labels:
        cur, first = None, True

        def close(stop):
            nonlocal cur, first
            if cur and cur["ja"].strip("\n　 "):
                # Trailing commands after the last text belong to the next message.
                while cur["codes"] and cur["ja"].endswith("{#%d}" % (len(cur["codes"]) - 1)):
                    cur["ja"] = cur["ja"][: -len("{#%d}" % (len(cur["codes"]) - 1))]
                    cur["codes"].pop()
                cur["stop"] = stop
                # The option text shown in the menu is the first text of the target (sn4.js choiceText).
                if first and l["label"] in targets:
                    cur["choices"] = targets[l["label"]]
                out.append(cur); first = False
            cur = None

        for o in l["ops"]:
            op, a = o["op"], o["args"]
            if op == 0x73: scene = a[0]
            if op in STOP: close(STOP[op]); continue
            text = None
            if op == 0x02: text = a[0]
            elif op in NAMES: text = NAMES[op]
            elif op == 0x04: text = "\n" if cur else None
            if op == 0x106:
                if cur is None:
                    cur = {"id": f"{l['label']}@{o['offset']:#x}", "label": l["label"], "scene": scene,
                           "ja": "", "codes": [], "_ruby": None}
                cur["_ruby"] = (a[0], a[1]); continue
            if text is not None:
                if cur is None:
                    cur = {"id": f"{l['label']}@{o['offset']:#x}", "label": l["label"], "scene": scene,
                           "ja": "", "codes": [], "_ruby": None}
                if cur.get("_ruby") and op == 0x02:
                    base, reads = cur["_ruby"]; cur["_ruby"] = None
                    if text.startswith(base):
                        text = "{rb:%s|%s}" % (base, "/".join(reads)) + text[len(base):]
                    else:
                        text = "{rb:%s|%s}" % (base, "/".join(reads)) + text
                cur["ja"] += text
            elif cur is not None:
                cur["codes"].append({"op": op, "args": a})
                cur["ja"] += "{#%d}" % (len(cur["codes"]) - 1)
        close("label-end")
    by_group = {g["id"]: g for g in groups}
    for u in out:
        u.pop("_ruby", None)
        if not u["codes"]: u.pop("codes")
        for c in u.get("choices", []): by_group[c["group"]]["options"].append(u["id"])
    return out, groups


def chunk_of(label):
    m = re.match(r"([a-z]+\d*)_", label)
    return m[1] if m else None


def extract(src, dst):
    program = json.load(open(src, encoding="utf-8"))
    us, groups = units(program)
    os.makedirs(dst, exist_ok=True)
    chunks = collections.OrderedDict()
    name = "start"
    for u in us:  # internal labels (_my4 ...) stay in the chunk of the scene they follow
        name = chunk_of(u["label"]) or name
        chunks.setdefault(name, []).append(u)
    index = {"source": program["source"], "entry": program["entry"], "format": "sn4text/1",
             "units": len(us), "chars": sum(len(TOKEN.sub("", u["ja"])) for u in us),
             "choices": [g for g in groups if g["options"]], "chunks": []}
    for name, items in chunks.items():
        json.dump({"chunk": name, "units": items}, open(os.path.join(dst, name + ".json"), "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
        index["chunks"].append({"file": name + ".json", "units": len(items),
                                "chars": sum(len(TOKEN.sub("", u["ja"])) for u in items)})
    json.dump(index, open(os.path.join(dst, "index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{program['source']}: {len(us)} units, {index['chars']} chars, {len(chunks)} chunks, "
          f"{len(index['choices'])} choice groups")


def load(d):
    index = json.load(open(os.path.join(d, "index.json"), encoding="utf-8"))
    us = []
    for c in index["chunks"]:
        us += json.load(open(os.path.join(d, c["file"]), encoding="utf-8"))["units"]
    return index, us


def check(ja_dir, ko_dir=None):
    problems = []
    index, ja = load(ja_dir)
    ids = collections.Counter(u["id"] for u in ja)
    problems += [f"duplicate id {i}" for i, n in ids.items() if n > 1]
    for u in ja:
        n = len(u.get("codes", []))
        if sorted(re.findall(r"\{#(\d+)\}", u["ja"]), key=int) != [str(i) for i in range(n)]:
            problems.append(f"{u['id']}: code tokens do not match codes[]")
    if ko_dir:
        kidx, ko = load(ko_dir)
        kmap = {u["id"]: u for u in ko}
        for u in ja:
            k = kmap.get(u["id"])
            if not k or not (k.get("ko") or "").strip():
                problems.append(f"{u['id']}: missing ko"); continue
            want = collections.Counter(t for t in TOKEN.findall(u["ja"]) if not t.startswith("{rb:"))
            got = collections.Counter(t for t in TOKEN.findall(k["ko"]) if not t.startswith("{rb:"))
            if want != got: problems.append(f"{u['id']}: tokens {dict(want)} != {dict(got)}")
            if k["ko"].count("\n") != u["ja"].count("\n"):
                problems.append(f"{u['id']}: newline count {u['ja'].count(chr(10))} != {k['ko'].count(chr(10))}")
        problems += [f"{i}: not in source" for i in kmap.keys() - ids.keys()]
    for p in problems[:200]: print(p)
    print(f"{len(ja)} units, {len(problems)} problems")
    return not problems


if __name__ == "__main__":
    if sys.argv[1] == "extract": extract(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == "check": sys.exit(0 if check(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None) else 1)
    else: sys.exit(__doc__)
