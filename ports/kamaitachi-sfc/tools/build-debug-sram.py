"""Build a QA bookmark from the original campaign and measured native choices.

Inputs come from kamaitachi-sfc-kor's original campaign.py and
docs/target-edges-results.json. The original game awards the gold bookmark.
"""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import struct
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for arg in ("qa_repo", "rom", "core", "campaign_sram", "output"):
        parser.add_argument(arg, type=Path)
    args = parser.parse_args()
    sys.path.insert(0, str(args.qa_repo / "tools"))
    from gold_campaign import ExtraRoute, GoldSession, extra_run
    from gold_progress import report

    def read(name):
        return json.loads((args.qa_repo / name).read_text())

    catalog = read("docs/scenario-catalog.json")
    sites = {site["id"]: site for site in catalog["choices"]}
    edges = read("docs/target-edges-results.json")
    rom_hash = sha256(args.rom.read_bytes()).hexdigest()
    if edges["original"]["rom_sha256"] != rom_hash or args.campaign_sram.stem != rom_hash:
        raise ValueError("The native choice record and campaign must match this ROM")
    seed = bytearray(args.campaign_sram.read_bytes())
    if report(seed, catalog)["ending_flags"] != list(range(1, 44)):
        raise ValueError("The game-earned first bookmark must have all 43 endings")

    # Reconcile controller choices and name-driven dispatches with the
    # decoded target table, including sites that share a choice number.
    observed = set()
    for entry in edges["evidence"]:
        site = sites[entry["site"]]
        option = ord(entry["option"]) - ord("A")
        if not 0 <= option < len(site["targets"]):
            raise ValueError("Invalid native option")
        if site["targets"][option]["start_bit"] != entry["accepted_bit"]:
            raise ValueError("Native destination differs from the decoded choice")
        observed.add((site["id"], option))
    expected = {(s["id"], i) for s in sites.values() if 1 <= s["choice_number"] <= 160
                for i in range(len(s["targets"]))}
    if not expected.issubset(observed):
        raise ValueError("Incomplete native choice coverage")

    # $049B4B tests the upper five bits, including the cartridge's padding
    # for choices with fewer than five options. Keep the other bits intact.
    if {sites[k]["choice_number"] for k, _ in expected} != set(range(1, 161)):
        raise ValueError("The native record must cover every gold row")
    for number in range(1, 161):
        seed[0xA08 + number] |= 0xF8
    for dest, begin, end in [(0x802, 0x850, 0xFFE), (0x800, 0x802, 0x84E)]:
        checksum = sum(word for word, in struct.iter_unpack("<H", seed[begin:end]))
        struct.pack_into("<H", seed, dest, checksum & 0xFFFF)
    report(seed, catalog)  # validates both cartridge checksum ranges
    guide = read("routes/guide-sfc.json")["endings"][0]
    with GoldSession(args.core, args.rom, catalog) as session:
        saved, _ = extra_run(session, ExtraRoute(guide, seed, sites), bytes(seed))
    final = report(saved, catalog)
    if not final["gold_awarded"] or final["gold_rows_complete"] != 160 or len(final["ending_flags"]) != 43:
        raise ValueError("The original did not award the gold bookmark")
    with args.output.open("xb") as out:
        out.write(saved)


if __name__ == "__main__":
    main()
