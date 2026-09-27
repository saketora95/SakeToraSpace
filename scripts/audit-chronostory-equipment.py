"""Audit bundled equipment and optionally inspect the original XLSX rows."""
import argparse
from collections import defaultdict
import hashlib
import importlib.util
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("importer", ROOT / "scripts/import-chronostory-drops.py")
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


def audit(source=None):
    data = json.loads((ROOT / "assets/js/tools/chronostory/drop-data.js").read_text(encoding="utf-8")
                      .split("window.chronoStoryDropData = ")[1].removesuffix(";\n"))
    equipment = [item for item in data["items"] if item["kind"] == "equipment"]
    conflicts, totals, summaries = [], [], []
    for item in equipment:
        groups = defaultdict(list)
        for variant in item["variants"]:
            groups[(variant.get("job"), variant.get("build"), variant.get("category"))].append(variant)
            if not re.fullmatch(r"\d+(?:\.\d+)?(?:\s*\([\d.]+\))?", variant.get("totalMaxStats", "")):
                continue
            stats = {name.strip(): float(sign + value) for name, sign, value in
                     re.findall(r"([^、]+?)\s*([+-])\s*(\d+(?:\.\d+)?)", variant["stats"])}
            job = variant.get("job")
            keys = {"劍士": ["力量", "敏捷", "命中"], "法師": ["智力", "幸運", "攻擊力"],
                    "弓箭手": ["力量", "敏捷"], "海盜": ["力量", "敏捷"]}.get(job)
            if job == "盜賊":
                keys = ["力量" if "力量／幸運" in variant.get("build", "") else "敏捷", "幸運"]
            if variant.get("category") == "武器" or not keys:
                continue
            computed = sum(stats.get(key, 0) for key in keys)
            stated = float(re.match(r"[\d.]+", variant["totalMaxStats"])[0])
            if abs(computed - stated) > 1e-8:
                totals.append({"name": item["name"], "build": variant.get("build"),
                               "stated": variant["totalMaxStats"], "computed": computed, "stats": variant["stats"]})
        for key, variants in groups.items():
            if len({json.dumps(v, sort_keys=True, ensure_ascii=False) for v in variants}) > 1:
                conflicts.append({"name": item["name"], "group": key, "variants": variants})
        detailed_levels = {v.get("requirement", {}).get("value") for v in item["variants"]}
        for note in item["summaryNotes"]:
            if detailed_levels and note.get("level") is not None and note["level"] not in detailed_levels:
                summaries.append({"name": item["name"], "detailLevels": list(detailed_levels), "summary": note})
    result = {"equipmentCount": len(equipment), "variantCount": sum(len(i["variants"]) for i in equipment),
              "sameBuildConflicts": conflicts, "armorTotalMismatches": totals, "summaryLevelMismatches": summaries}
    if source:
        sheets = importer.read_workbook(source)
        result["sourceHashMatches"] = hashlib.sha256(source.read_bytes()).hexdigest() == data["source"]["sha256"]
        duplicates = []
        for sheet, cells in sheets.items():
            if sheet not in importer.EQUIPMENT_SHEETS | importer.SHEET_LABELS.keys():
                continue
            names = defaultdict(list)
            for coord, name in cells.items():
                if re.fullmatch(r"D\d+", coord) and name != "裝備":
                    row = int(coord[1:])
                    names[importer.identity(name)].append({"row": row, "name": name,
                        "cells": {c: v for c, v in cells.items() if re.fullmatch(r"[A-Z]+" + str(row), c)}})
            duplicates.extend({"sheet": sheet, "rows": rows} for rows in names.values() if len(rows) > 1)
        result["sourceDuplicateNames"] = duplicates
        regenerated = importer.compile_data(sheets, data["source"]["importedOn"], data["source"]["sha256"])
        result["bundledMatchesCorrectedSource"] = all(regenerated[key] == data[key] for key in ("items", "monsters", "drops", "summary"))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", nargs="?", type=Path)
    args = parser.parse_args()
    print(json.dumps(audit(args.source), ensure_ascii=False, indent=2))
