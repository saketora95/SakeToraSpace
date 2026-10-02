#!/usr/bin/env python3
"""Import the Dragon Knight section from saved Bahamut posts; no network required."""
import argparse
import json
import re
import unicodedata
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = "https://forum.gamer.com.tw/C.php?bsn=4212&snA=436731"
SECTION_URL = "https://forum.gamer.com.tw/Co.php?bsn=4212&sn=2901200"
# IDs / Korean names checked against the kRO official skill library on 2026-10-02.
# Unknown Japanese and English names stay null; do not invent translations.
SKILLS = {
    "死侍武器": (5201, "서번트 웨폰"),
    "死侍武器-瞬幻": (5204, "서번트 웨폰-팬텀"),
    "死侍武器-破滅": (5205, "서번트 웨폰-데몰리션"),
    "風暴斬擊": (5213, "스톰 슬래쉬"),
    "狂暴粉碎": (5211, "매드니스 크러셔"),
    "橫揮斬": (5208, "핵 앤드 슬래셔"),
    "活力之源": (5212, "비고르"),
    "天龍光環": (5210, "드래고닉 오라"),
    "天龍氣息": (6001, "드래고닉 브레스"),
    "神龍貫刺": (6502, "드래고닉 피어스"),
    "死侍武器-標記": (5203, "서번트 웨폰-사인"),
    "死侍武器-斬裂": (6608, "서번트 웨폰 - 클리브"),
}
TEXT_CHANGES = {
    "變更為不會被魔法效果解除與解除消除": ("狀態解除", "不受魔法效果解除、解除影響"),
    "技能倍率會受到武器等級影響": ("倍率計算", "納入武器等級"),
    "使用雙手劍會造成近距離物理傷害,使用雙手矛會造成遠距離物理傷害": ("傷害類型", "雙手劍:近距離物理;雙手矛:遠距離物理"),
    "依據施展者的暴擊率適用暴擊": ("暴擊判定", "採用施展者暴擊率"),
    "增加一般近距離物理攻擊傷害增加的效果": ("一般近距離物理攻擊", "新增傷害加成"),
    "天龍光環習得時,依據龍駕馭習得等級,對龍之氣息增加 POW 與 P.ATK 係數": ("龍之氣息倍率計算", "習得天龍光環後,依龍駕馭等級加入 POW、P.ATK 係數"),
    "新增此技能": ("技能實裝", "新增技能"),
    "其他調整 施展動作將依據 ASPD 變化": ("施展動作", "施展速度受 ASPD 影響"),
}


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == "br":
            self.parts.append("\n")

    def handle_data(self, value):
        self.parts.append(value)


def plain(fragment):
    parser = PlainText()
    parser.feed(fragment)
    return "".join(parser.parts).strip()


def post(html, post_id):
    match = re.search(r'<article\b[^>]*\bid="cf' + str(post_id) + r'"[^>]*>(.*?)</article>', html, re.S | re.I)
    if not match:
        raise ValueError(f"找不到來源樓層 cf{post_id}")
    return match[1]


def unwrap_link(url):
    return parse_qs(urlparse(url).query).get("url", [url])[0]


def parse_versions(html):
    versions, announcements = {}, {}
    content = post(html, 2901178)
    for fragment in re.findall(r'<li\b[^>]*>(.*?)</li>', content, re.S | re.I):
        label = plain(fragment)
        match = re.match(r"第\s*([\d.]+)\s*版本[:：]", label)
        if not match:
            continue
        number = match[1]
        if number in versions:
            raise ValueError(f"版本索引重複: {number}")
        link = re.search(r'<a\b[^>]*href="([^"]+)"', fragment, re.I)
        day = re.search(r"\d{4}-\d{2}-\d{2}", label)
        if not link or not day:  # Version 0 is a baseline, not a change record.
            continue
        url = unwrap_link(link[1].replace("&amp;", "&"))
        if urlparse(url).hostname != "ro.gnjoy.com":
            raise ValueError(f"第 {number} 版本不是 kRO 官方來源")
        date.fromisoformat(day[0])
        planned = "尚未實裝" in label
        version_id = "kro-v" + number.replace(".", "-")
        versions[number] = {
            "id": version_id, "name": f"第 {number} 版本", "order": len(versions) + 1,
            "releasedAt": None if planned else day[0], "status": "planned" if planned else "released",
        }
        if planned:
            versions[number]["announcedAt"] = day[0]
        announcements[number] = {
            "id": version_id + "-notice", "versionId": version_id,
            "title": f"kRO {day[0]} " + ("開發者筆記(預定調整)" if planned else "官方維護公告"),
            "publishedAt": day[0] if planned else None, "url": url,
            "kind": "developer-note" if planned else "maintenance",
        }
    if not versions:
        raise ValueError("找不到版本與官方公告索引")
    updated = re.search(r"最後更新[:：]\s*(\d{4}-\d{2}-\d{2})", plain(content))
    if not updated:
        raise ValueError("找不到文章更新日期")
    return versions, announcements, updated[1]


def number(value):
    return float(value) if "." in value else int(value)


def change(item, before, after, unit="", note=""):
    result = {"item": item, "before": before, "after": after}
    if unit:
        result["unit"] = unit
    if note:
        result["note"] = note
    return result


def parse_line(raw):
    line = unicodedata.normalize("NFKC", raw).strip()
    area = re.fullmatch(r"(技能範圍) (\d+ x \d+) → (\d+ x \d+)", line)
    if area:
        return [change(area[1], area[2], area[3])]
    # Conditional multipliers belong in their own rows, rather than embedding a second arrow in a value.
    conditional = re.fullmatch(r"(技能(?:基本)?倍率) (\d+)% → (\d+)%\((.+?) (\d+)% → (\d+)%\)", line)
    if conditional:
        item, before, after, condition, extra_before, extra_after = conditional.groups()
        return [change(item, int(before), int(after), "%"),
                change(item, int(extra_before), int(extra_after), "%", condition)]
    proc = re.fullmatch(r"具有巨人成長狀態時,有 (\d+)% → (\d+)% 機率增加傷害", line)
    if proc:
        return [change("增傷觸發機率", int(proc[1]), int(proc[2]), "%", "巨人成長狀態下")]
    numeric = re.fullmatch(r"(.+?) (\d+(?:\.\d+)?)(%?) → (\d+(?:\.\d+)?)(%?)(.*)", line)
    if numeric:
        item, before, old_percent, after, new_percent, suffix = numeric.groups()
        if old_percent != new_percent:
            raise ValueError(f"前後單位不一致: {raw}")
        suffix = suffix.strip()
        note = ""
        parenthetical = re.fullmatch(r"\((.*?)\)", suffix)
        if parenthetical:
            note = parenthetical[1]
            suffix = ""
        if suffix not in ("", "秒", "HP"):
            raise ValueError(f"無法解析數值單位: {raw}")
        item = item.rstrip(" +")
        item = re.sub(r"^(SP|AP)(消耗|恢復)", r"\1 \2", item)
        if "傷害" in item and " + " in line:
            note = ";".join(filter(None, [note, "傷害加成"]))
        if item == "冷卻時間" and not suffix:
            note = ";".join(filter(None, [note, "原文未標示單位"]))
        return [change(item, number(before), number(after), old_percent or (" HP" if suffix == "HP" else suffix), note)]
    textual = re.fullmatch(r"(技能形式|技能類型|技能效果|打擊次數) (.+?) → (.+)", line)
    if textual:
        return [change(textual[1], textual[2], textual[3])]
    if line in TEXT_CHANGES:
        item, after = TEXT_CHANGES[line]
        return [change(item, None, after)]
    # Initial values supplied alongside a newly introduced skill have no old value.
    initial = re.fullmatch(r"(劍氣體消耗|AP恢復|技能基本倍率|固定詠唱|變動詠唱|共通技能延遲|冷卻時間) (.+)", line)
    if initial:
        item, value = initial.groups()
        item = item.replace("AP恢復", "AP 恢復")
        pair = re.fullmatch(r"(\d+)%\(活力之源時 (\d+)%\)", value)
        if pair:
            return [change(item, None, int(pair[1]), "%"), change(item, None, int(pair[2]), "%", "活力之源狀態下")]
        scalar = re.fullmatch(r"(\d+(?:\.\d+)?)( 秒)?", value)
        if scalar:
            return [change(item, None, number(scalar[1]), "秒" if scalar[2] else "")]
    if line.startswith("技能類型 對目標造成 3 次"):
        return [change("技能類型", None, "對目標造成近距離物理暴擊傷害"),
                change("打擊次數", None, 3, "次"), change("打擊次數", None, 4, "次", "活力之源狀態下")]
    raise ValueError(f"無法解析調整內容,請人工確認: {raw}")


def build_data(index_html, skills_html, imported_at):
    versions, announcements, source_date = parse_versions(index_html)
    content = post(skills_html, 2901200)
    headings = list(re.finditer(r"<h3\b[^>]*>(.*?)</h3>", content, re.S | re.I))
    target = next((i for i, heading in enumerate(headings) if "盧恩騎士 / 盧恩龍爵" in plain(heading[1])), None)
    if target is None:
        raise ValueError("找不到盧恩龍爵章節")
    section = content[headings[target].end():headings[target + 1].start() if target + 1 < len(headings) else len(content)]
    skills, records, used_versions = [], [], set()
    for match in re.finditer(r"<h4\b[^>]*>(.*?)</h4>(.*?)(?=<h4\b|$)", section, re.S | re.I):
        name = plain(match[1]).removeprefix("###").strip().split(" / ")[-1]
        name = name.replace(" - ", "-")
        if name not in SKILLS:
            raise ValueError(f"未設定的技能: {name}")
        game_id, korean = SKILLS[name]
        skill_id = f"dk-{game_id}"
        skills.append({"id": skill_id, "skillId": game_id, "jobIds": ["dragon-knight"],
                       "names": {"zhHant": name, "ko": korean, "ja": None, "en": None},
                       "metadataSourceUrl": f"https://ro.gnjoy.com/guide/runemidgarts/skillview.asp?lineseq=2&skillid={game_id}"})
        for row in re.findall(r"<tr\b[^>]*>(.*?)</tr>", match[2], re.S | re.I):
            cells = re.findall(r"<td\b[^>]*>(.*?)</td>", row, re.S | re.I)
            if len(cells) != 2:
                raise ValueError(f"{name}: 無法解析表格列")
            version_number = re.fullmatch(r"第\s*([\d.]+)\s*版本", plain(cells[0]))
            if not version_number or version_number[1] not in versions:
                raise ValueError(f"{name}: 未知版本 {plain(cells[0])}")
            version_number = version_number[1]
            used_versions.add(version_number)
            lines = [line.strip() for line in plain(cells[1]).splitlines() if line.strip()]
            evidence = "player-test" if any(line.startswith("※") for line in lines) else "article"
            changes = [entry for line in lines if not line.startswith("※") for entry in parse_line(line)]
            if evidence == "player-test":
                for entry in changes:
                    entry["note"] = "玩家測試結果;官方更新清單未載明,後續可能判定為錯誤並修正。"
            if not changes:
                raise ValueError(f"{name}: 空白調整記錄")
            records.append({"id": f"{skill_id}-{versions[version_number]['id']}", "skillId": skill_id,
                            "versionId": versions[version_number]["id"], "announcementIds": [announcements[version_number]["id"]],
                            "evidence": evidence, "changes": changes})
    if len(skills) != len(SKILLS) or {skill["skillId"] for skill in skills} != {item[0] for item in SKILLS.values()}:
        raise ValueError(f"技能數量不符預期: {len(skills)} / {len(SKILLS)}")
    if len({record["id"] for record in records}) != len(records):
        raise ValueError("同一技能與版本出現重複記錄,請確認來源結構")
    current = max((version for version in versions.values() if version["status"] == "released"), key=lambda version: version["order"])
    return {"schemaVersion": 1, "meta": {
        "isDemo": False, "server": "kRO", "currentVersionId": current["id"], "updatedAt": imported_at,
        "notice": "目前收錄盧恩龍爵的 kRO 調整摘要;版本編號及現行版本依來源文章。預告與玩家測試內容另有標註,未記載的舊值不予推測。",
        "source": {"title": "kRO 迄今技能調整/優化整理", "author": "杜腐 (badgirl159)", "url": SOURCE_URL, "sectionUrl": SECTION_URL, "updatedAt": source_date},
    }, "jobs": [{"id": "dragon-knight", "name": "盧恩龍爵"}],
        "versions": [version for key, version in versions.items() if key in used_versions or version["id"] == current["id"]],
        "announcements": [entry for key, entry in announcements.items() if key in used_versions or entry["versionId"] == current["id"]],
        "skills": skills, "records": records}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--index", required=True, type=Path, help="文章首樓(版本索引) HTML")
    parser.add_argument("--skills", required=True, type=Path, help="四之一轉職業樓層 HTML")
    parser.add_argument("--date", required=True, type=date.fromisoformat, help="匯入日期 YYYY-MM-DD")
    parser.add_argument("--output", type=Path, default=ROOT / "assets/js/tools/ragnarok/skill-change-data.js")
    args = parser.parse_args()
    data = build_data(args.index.read_text(encoding="utf-8"), args.skills.read_text(encoding="utf-8"), args.date.isoformat())
    encoded = json.dumps(data, ensure_ascii=False, indent=2)
    args.output.write_text('"use strict";\n\n// 由 scripts/import-ragnarok-skill-changes.py 產生;來源與範圍見 meta。\nwindow.ragnarokSkillChangeData = ' + encoded + ';\n', encoding="utf-8")
    print(f"匯入 {len(data['skills'])} 個技能 / {len(data['versions'])} 個版本 / {len(data['records'])} 筆記錄 / {sum(len(r['changes']) for r in data['records'])} 個調整項目")


if __name__ == "__main__":
    main()
