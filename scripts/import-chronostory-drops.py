"""Import the public ChronoStory XLSX export using only Python's standard library.

Usage: python scripts/import-chronostory-drops.py source.xlsx --date YYYY-MM-DD
No formulas, macros, or external links in the workbook are executed.
"""
import argparse
from datetime import date
import hashlib
import json
from pathlib import Path
import posixpath
import re
import unicodedata
import xml.etree.ElementTree as ET
from zipfile import ZipFile


SOURCE_URL = "https://docs.google.com/spreadsheets/d/1Wj4P9_RNcUoW8xgC0yZy5WGqFDurZLZjNzknTdODA1U/edit"
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
EXCLUDED = {"注意事項", "四轉流程"}
EQUIPMENT_SHEETS = {"劍士", "法師 (四速)", "法師 (五速)", "弓箭手", "盜賊 (力幸)", "盜賊 (敏幸)", "海盜"}
SCROLL_SHEETS = {"武器卷軸", "防具卷軸"}


def clean(value):
    value = unicodedata.normalize("NFKC", value).strip()
    return re.sub(r"\s+", " ", value)


def identity(value):
    return re.sub(r"\s+", "", clean(value))


def identifier(prefix, value):
    return prefix + "-" + hashlib.sha256(identity(value).encode("utf-8")).hexdigest()[:12]


def append_unique(values, value):
    if value not in values:
        values.append(value)


def number(value):
    return int(float(value)) if value else None


def display_number(value):
    return str(int(float(value))) if re.fullmatch(r"\d+\.0", value) else clean(value)


def expand_build(value):
    return value.replace("力幸", "力量／幸運").replace("敏幸", "敏捷／幸運")


def format_stats(value):
    """Generate display-ready effects; A+B 防 is physical/magic defense."""
    names = {"力": "力量", "敏": "敏捷", "智": "智力", "幸": "幸運", "命": "命中",
             "防": "物理防禦", "魔防": "魔法防禦", "攻": "攻擊力", "迴": "迴避",
             "速": "移動速度", "跳": "跳躍力", "血": "HP", "魔": "MP", "捲": "可升級次數"}
    text = re.sub(r"^頂\s*", "", clean(value))
    text = re.sub(r"全\s*(\d+)\s*屬", r"\1 全能力", text)
    pattern = re.compile(r"([+-]?\d+(?:\.\d+)?(?:\s*\+\s*\d+(?:\.\d+)?)*)\s*"
                         r"(魔法防禦|物理防禦|全能力|力量|敏捷|智力|幸運|命中|攻擊力|移動速度|跳躍力|可升級次數|魔防|[力敏智幸命防攻迴速跳血魔捲]|HP|MP)")
    parts, cursor = [], 0

    def effect(name, amount):
        return f"{name} {'-' if amount.startswith('-') else '+'} {amount.lstrip('+-')}"

    for match in pattern.finditer(text):
        prefix = text[cursor:match.start()].strip(" +、,")
        if prefix:
            parts.append(prefix)
        amount = re.sub(r"\s", "", match[1])
        stat = match[2]
        defenses = re.fullmatch(r"(\d+(?:\.\d+)?)\+(\d+(?:\.\d+)?)", amount) if stat == "防" else None
        if defenses:
            parts.extend([effect("物理防禦", defenses[1]), effect("魔法防禦", defenses[2])])
        else:
            parts.append(effect(names.get(stat, stat), amount))
        cursor = match.end()
    suffix = text[cursor:].strip(" +、,")
    if suffix:
        parts.append(suffix)
    return "、".join(parts)


def read_workbook(path):
    """Read cached cell values, expanding only vertical merges (category labels)."""
    sheets = {}
    with ZipFile(path) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = ["".join(t.text or "" for t in si.findall(".//s:t", NS))
                       for si in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("s:si", NS)]
        relationships = {r.get("Id"): r.get("Target") for r in
                         ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))}
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        for sheet in workbook.findall("s:sheets/s:sheet", NS):
            name = sheet.get("name")
            if name in EXCLUDED:
                continue
            if name not in EQUIPMENT_SHEETS | SCROLL_SHEETS | {"後期簡表"}:
                raise ValueError(f"Unexpected sheet: {name}; review its layout before importing")
            target = relationships[sheet.get(f"{{{REL_NS}}}id")]
            member = target.lstrip("/") if target.startswith("/") else posixpath.normpath("xl/" + target)
            root = ET.fromstring(archive.read(member))
            cells = {}
            for cell in root.findall("s:sheetData/s:row/s:c", NS):
                value = cell.findtext("s:v", "", NS)
                if cell.get("t") == "s":
                    value = strings[int(value)] if value else ""
                elif cell.get("t") == "inlineStr":
                    value = "".join(t.text or "" for t in cell.findall(".//s:t", NS))
                if value.strip():
                    cells[cell.get("r")] = value.strip()
            for merge in root.findall("s:mergeCells/s:mergeCell", NS):
                first, last = merge.get("ref").split(":")
                col, start = re.fullmatch(r"([A-Z]+)(\d+)", first).groups()
                end_col, end = re.fullmatch(r"([A-Z]+)(\d+)", last).groups()
                if col == end_col and first in cells:
                    for row in range(int(start) + 1, int(end) + 1):
                        cells[f"{col}{row}"] = cells[first]
            sheets[name] = cells
    expected = EQUIPMENT_SHEETS | SCROLL_SHEETS | {"後期簡表"}
    if set(sheets) != expected:
        raise ValueError(f"Missing sheets: {expected - set(sheets)}")
    return sheets


def compile_data(sheets, imported_on, source_hash):
    items, monsters, drops = {}, {}, {}

    def item_record(name, kind, category, job):
        name = clean(name)
        if kind == "scroll":
            name = re.sub(r"\s+", "", name)
            if "卷軸" not in name:
                name = re.sub(r"(\d+%)$", r"卷軸\1", name)
        key = identifier("item", kind + ":" + name)
        item = items.setdefault(key, {"id": key, "name": name, "kind": kind,
                                     "categories": [], "jobs": [], "variants": [],
                                     "summaryNotes": []})
        if category:
            append_unique(item["categories"], category)
        if job:
            append_unique(item["jobs"], job)
        return item

    def monster_record(name, region):
        name = clean(name)
        boss = bool(re.match(r"^B\s+", name))
        name = re.sub(r"^B\s+", "", name)
        key = identifier("monster", name)
        monster = monsters.setdefault(key, {"id": key, "name": name, "boss": False,
                                           "regions": [], "elements": []})
        monster["boss"] |= boss
        append_unique(monster["regions"], region)
        return monster

    def add_drop(item, monster, region, rate, rate_text=None):
        key = (item["id"], monster["id"])
        drop = drops.setdefault(key, {"itemId": key[0], "monsterId": key[1], "observations": []})
        observation = {"region": region, "ratePercent": rate}
        if rate_text is not None:
            observation["rateText"] = rate_text
        append_unique(drop["observations"], observation)

    # Detailed sheets provide requirements and measured drop rates.
    for sheet, cells in sheets.items():
        if sheet == "後期簡表":
            continue
        scroll = sheet in SCROLL_SHEETS
        name_col = "C" if scroll else "D"
        region_cols = "EFGHIJ" if scroll else "HIJKLM"
        region_row = 5 if sheet == "防具卷軸" else 3
        regions = {col: clean(cells[f"{col}{region_row}"]) for col in region_cols}
        rows = sorted(int(c[len(name_col):]) for c in cells if re.fullmatch(name_col + r"\d+", c))
        for row in rows:
            name = cells[f"{name_col}{row}"]
            if name in {"全名", "裝備"}:
                continue
            category = clean(cells.get(f"{'B' if scroll else 'C'}{row}", ""))
            job = "" if scroll else sheet.split(" (")[0]
            item = item_record(name, "scroll" if scroll else "equipment", category, job)
            variant = {"category": category, "stats": format_stats(cells.get(f"{'D' if scroll else 'G'}{row}", ""))}
            if scroll:
                match = re.search(r"(\d+)%$", item["name"])
                if not match:
                    raise ValueError(f"Invalid scroll name at {sheet}!{name_col}{row}: {name}")
                variant["successPercent"] = int(match[1])
            else:
                variant.update({"job": job, "build": expand_build(sheet),
                                "requirement": {"type": "luk" if sheet == "法師 (四速)" else "level",
                                                "value": number(cells.get(f"E{row}", ""))},
                                "totalMaxStats": expand_build(display_number(cells.get(f"F{row}", "")))})
            append_unique(item["variants"], variant)
            for col, region in regions.items():
                coord = f"{col}{row}"
                for line in cells.get(coord, "").splitlines():
                    match = re.fullmatch(r"(.+?)\s*\(([\d.]+)%\)", clean(line))
                    if not match:
                        raise ValueError(f"Unparsed drop at {sheet}!{coord}: {line!r}")
                    monster_name, rate_text = match.groups()
                    rate = float(rate_text) if re.fullmatch(r"\d+(?:\.\d+)?", rate_text) else None
                    if rate is not None and not 0 <= rate <= 100:
                        raise ValueError(f"Invalid drop rate at {sheet}!{coord}")
                    monster = monster_record(monster_name, region)
                    add_drop(item, monster, region, rate, rate_text + "%")

    # The summary contains additional relationships with no drop percentage.
    # Keep supplemental game values, without spreadsheet coordinates or raw cells.
    sheet = "後期簡表"
    cells = sheets[sheet]
    jobs = dict(zip("EFGHI", ["劍士", "法師", "弓箭手", "盜賊", "海盜"]))
    rows = sorted(int(c[1:]) for c in cells if re.fullmatch(r"C\d+", c))
    for row in rows:
        name = cells[f"C{row}"]
        if name == "怪物":
            continue
        region = clean(cells[f"B{row}"])
        monster = monster_record(name, region)
        if cells.get(f"D{row}"):
            append_unique(monster["elements"], {"text": clean(cells[f"D{row}"])})
        for col in "EFGHIJK":
            coord = f"{col}{row}"
            for line in cells.get(coord, "").splitlines():
                raw = clean(line)
                if col in "JK":
                    if not re.fullmatch(r".+?\s*\d+%", raw):
                        raise ValueError(f"Unparsed summary scroll at {coord}: {line!r}")
                    item = item_record(raw, "scroll", "", "")
                    # Summary-only scrolls still need their success rate and type.
                    if not item["variants"]:
                        success = int(re.search(r"(\d+)%$", raw)[1])
                        item["variants"].append({"category": "武器卷軸" if col == "J" else "防具卷軸",
                                                 "stats": "", "successPercent": success})
                else:
                    match = re.fullmatch(r"(\d+)\s*(.+?)\s*/\s*(.+)", raw)
                    if match:
                        level, item_name, total = match.groups()
                        item = item_record(item_name, "equipment", "", jobs[col])
                        append_unique(item["summaryNotes"], {"level": int(level), "totalMaxStats": expand_build(total)})
                    else:
                        match = re.fullmatch(r"(.+?)\s*\((頂.+)\)", raw)
                        if not match:
                            raise ValueError(f"Unparsed summary equipment at {coord}: {line!r}")
                        item = item_record(match[1], "equipment", "戒指", "")
                        append_unique(item["summaryNotes"], {"stats": format_stats(match[2])})
                add_drop(item, monster, region, None)

    return {"schemaVersion": 2,
            "source": {"url": SOURCE_URL, "importedOn": imported_on, "sha256": source_hash,
                       "sheets": list(sheets), "excludedSheets": sorted(EXCLUDED),
                       "notes": ["僅收錄原試算表整理的裝備、卷軸與掉落，並非完整遊戲資料庫。",
                                 "空白掉落欄位表示原表未記載來源，不代表不會掉落。",
                                 "防具卷軸分頁註明：除了飾品卷軸，不列入 Boss 掉落。",
                                 "等級、屬性、地區與機率差異保留於各筆資料，不推測修正。",
                                 "法師 (四速) 的需求欄為幸運需求，不是裝備等級。"]},
            "items": list(items.values()), "monsters": list(monsters.values()), "drops": list(drops.values())}


def write_data(data, output):
    output.parent.mkdir(parents=True, exist_ok=True)
    encode = lambda value: json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    lines = ['"use strict";', '// Generated by scripts/import-chronostory-drops.py; edit the importer to regenerate.',
             'window.chronoStoryDropData = {', f'  "schemaVersion": {data["schemaVersion"]},', f'  "source": {encode(data["source"])},']
    for key in ("items", "monsters", "drops"):
        lines.append(f'  "{key}": [')
        lines.append(",\n".join("    " + encode(record) for record in data[key]))
        lines.append("  ]" + ("," if key != "drops" else ""))
    lines.append("};\n")
    output.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--date", required=True, type=date.fromisoformat, help="Date this source snapshot was downloaded")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "assets/js/tools/chronostory/drop-data.js")
    args = parser.parse_args()
    dataset = compile_data(read_workbook(args.source), args.date.isoformat(), hashlib.sha256(args.source.read_bytes()).hexdigest())
    write_data(dataset, args.output)
    print(f"Imported {len(dataset['items'])} items, {len(dataset['monsters'])} monsters, {len(dataset['drops'])} drop relationships")
