#!/usr/bin/env python3
"""Import all job sections from saved Bahamut posts; no network required."""
import argparse
import hashlib
import json
import re
import unicodedata
from datetime import date
from functools import lru_cache
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = "https://forum.gamer.com.tw/C.php?bsn=4212&snA=436731"
SECTION_URL = "https://forum.gamer.com.tw/Co.php?bsn=4212&sn=2901200"
# Job sections use the source's headings, including its alternate Taiwan names.
# A shared section still produces two independently selectable jobs.
JOB_SECTIONS = {
    "盧恩騎士 / 盧恩龍爵": [("dragon-knight", "盧恩龍爵")],
    "機械工匠 / 機甲神匠": [("meister", "機甲神匠")],
    "十字斬首者 / 十字影武": [("shadow-cross", "十字影武")],
    "咒術士 / 禁咒魔導士": [("arch-mage", "禁咒魔導士")],
    "大主教 / 樞機主教": [("cardinal", "樞機主教")],
    "遊俠 / 風鷹狩獵者": [("wind-hawk", "風鷹狩獵者")],
    "皇家禁衛隊 / 帝國聖衛軍": [("imperial-guard", "帝國聖衛軍")],
    "基因學者 / 生命締造者": [("biolo", "生命締造者")],
    "魅影追蹤者 / 深淵追跡者": [("abyss-chaser", "深淵追跡者")],
    "妖術師 / 元素支配者": [("elemental-master", "元素支配者")],
    "修羅 / 聖裁者": [("inquisitor", "聖裁者")],
    "宮廷樂師 & 浪跡舞者 (浪姬舞者) / 天籟頌者 & 樂之舞靈": [("troubadour", "天籟頌者"), ("trouvere", "樂之舞靈")],
    "日影忍者 (影狼) & 月影忍者 (朧) / 流浪忍者 & 疾風忍者": [("shinkiro", "流浪忍者"), ("shiranui", "疾風忍者")],
    "叛亂者 / 夜行使": [("night-watch", "夜行使")],
    "拳皇 / 天帝": [("sky-emperor", "天帝")],
    "獵靈士 / 契靈士": [("soul-ascetic", "契靈士")],
    "超級初學者 / 終極初學者": [("hyper-novice", "終極初學者")],
    "召喚師 (喵族) / 魂靈師": [("spirit-handler", "魂靈師")],
    "德魯伊": [("druid", "德魯伊")],
}
SECTION_POSTS = {
    2901200: tuple(list(JOB_SECTIONS)[:6]),
    2901201: tuple(list(JOB_SECTIONS)[6:12]),
    2901202: tuple(list(JOB_SECTIONS)[12:]),
    2901252: ("咒術士 / 禁咒魔導士", "大主教 / 樞機主教", "遊俠 / 風鷹狩獵者", "基因學者 / 生命締造者", "拳皇 / 天帝", "德魯伊"),
}
# Display order is independent of the source article's chapter order.
JOB_ORDER = (
    "dragon-knight", "imperial-guard", "cardinal", "inquisitor",
    "arch-mage", "elemental-master", "meister", "biolo", "wind-hawk",
    "troubadour", "trouvere", "shadow-cross", "abyss-chaser", "sky-emperor",
    "soul-ascetic", "night-watch", "shinkiro", "shiranui", "hyper-novice",
    "spirit-handler", "druid",
)
# These skills are gender-specific in otherwise shared job sections.
EXCLUSIVE_SKILL_JOBS = {}
MERGED_SKILLS = {
    "ABR-決戰勇士 / ARB-雙子加農砲 / ABR-天網聖母": ["ABR-決戰勇士", "ABR-雙子加農砲", "ABR-天網聖母"],
    "強酸禁地(水/風/地/火)": [f"強酸禁地（{element}）" for element in "水風地火"],
}
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
    "使用雙手劍會造成近距離物理傷害,使用雙手矛會造成遠距離物理傷害": ("傷害類型", "雙手劍：近距離物理；雙手矛：遠距離物理"),
    "依據施展者的暴擊率適用暴擊": ("暴擊判定", "採用施展者暴擊率"),
    "增加一般近距離物理攻擊傷害增加的效果": ("一般近距離物理攻擊", "新增傷害加成"),
    "天龍光環習得時,依據龍駕馭習得等級,對龍之氣息增加 POW 與 P.ATK 係數": ("龍之氣息倍率計算", "習得天龍光環後，依龍駕馭等級加入 POW、P.ATK 係數"),
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
            "title": f"kRO {day[0]} " + ("開發者筆記（預定調整）" if planned else "官方維護公告"),
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


def description(value):
    if not isinstance(value, str):
        return value
    value = value.translate(str.maketrans(",;:()!?", "，；：（）！？"))
    # Keep decimal points and abbreviations such as P.ATK intact.
    return re.sub(r"\.(?=\s|$)", "。", value)


def change(item, before, after, unit="", note=""):
    result = {"item": description(item), "before": description(before), "after": description(after)}
    if unit:
        result["unit"] = unit
    if note:
        result["note"] = description(note)
    return result


def normalized_line(raw):
    line = unicodedata.normalize("NFKC", raw).strip()
    # Thousands separators are numbers, not Chinese punctuation.
    while re.search(r"(?<=\d),(?=\d{3}(?:\D|$))", line):
        line = re.sub(r"(?<=\d),(?=\d{3}(?:\D|$))", "", line)
    line = re.sub(r"\s*→\s*", " → ", line)
    line = re.sub(r"^(技能(?:基本)?倍率)[:：]\s*", r"\1 ", line)
    return line


def trailing_parentheses(value):
    """Return the last outer parenthesis without breaking formula parentheses."""
    if not value.endswith(")"):
        return value, ""
    depth = 0
    for index in range(len(value) - 1, -1, -1):
        if value[index] == ")":
            depth += 1
        elif value[index] == "(":
            depth -= 1
            if depth == 0:
                return value[:index].strip(), value[index + 1:-1].strip()
    return value, ""


def split_outer(value, separator="、"):
    parts, start, depth = [], 0, 0
    for index, character in enumerate(value):
        if character == "(":
            depth += 1
        elif character == ")":
            depth -= 1
        elif character == separator and depth == 0:
            parts.append(value[start:index].strip())
            start = index + 1
    return parts + [value[start:].strip()]


def parse_value(value):
    value = value.strip()
    if value in ("?", "？", "未知", "未記載", "—"):
        return None, ""
    scalar = re.fullmatch(r"([+-]?\d+(?:\.\d+)?)\s*(%|秒|HP|次|格|顆|枝|發|瓶|個)?", value)
    if scalar:
        return number(scalar[1]), scalar[2] or ""
    if re.fullmatch(r"\d+\s*[xX*×]\s*\d+", value):
        return re.sub(r"\s*[xX*×]\s*", " x ", value), ""
    return value, ""


def value_change(item, before, after, note=""):
    old, old_unit = parse_value(before) if before is not None else (None, "")
    new, new_unit = parse_value(after)
    # An old unit omitted in the article stays literal if the units are ambiguous.
    if old_unit and new_unit and old_unit != new_unit:
        return change(item, before, after, note=note)
    if old_unit and not new_unit:
        return change(item, before, after, note=note)
    if old is not None and new_unit and not old_unit and isinstance(old, str):
        return change(item, before, after, note=note)
    unit = new_unit or old_unit
    item = re.sub(r"^(SP|AP)(消耗|恢復)", r"\1 \2", item.rstrip(" +"))
    if before is not None and item in ("冷卻時間", "持續時間") and not unit:
        note = "；".join(filter(None, (note, "原文未標示單位")))
    return change(item, old, new, " HP" if unit == "HP" else unit, note)


VALUE_ITEMS = r"(?:技能(?:基本)?倍率|自動詠唱技能基本倍率|打擊次數|技能範圍|攻擊屬性|技能形式|技能類型|技能效果|技能特性|固定詠唱(?:時間)?|變動詠唱(?:時間)?|共通(?:技能)?延遲|技能共通延遲|冷卻時間|持續時間|施展距離|攻擊距離|擊退距離|(?:SP|AP|HP)\s*(?:消耗|恢復)|\S+消耗)"


def parse_line(raw, inherited_item=None):
    """Parse explicit comparisons, preserving unfamiliar descriptions in full."""
    line = normalized_line(raw)
    if not line:
        return []
    if line in TEXT_CHANGES:
        item, after = TEXT_CHANGES[line]
        return [change(item, None, after)]
    if line.startswith("技能類型 對目標造成 3 次近距離物理暴擊傷害"):
        return [change("技能類型", None, "對目標造成近距離物理暴擊傷害"),
                change("打擊次數", None, 3, "次"), change("打擊次數", None, 4, "次", "活力之源狀態下")]
    proc = re.fullmatch(r"具有巨人成長狀態時,有 (\d+)% → (\d+)% 機率增加傷害", line)
    if proc:
        return [change("增傷觸發機率", int(proc[1]), int(proc[2]), "%", "巨人成長狀態下")]

    # The article sometimes places a label on one line and numbered values below it.
    if inherited_item:
        line = re.sub(r"^\d+\)\s*", "", line)
        if "→" in line:
            line = inherited_item + " " + line
    segments = split_outer(line)
    if len(segments) > 1 and all("→" in segment for segment in segments):
        first = parse_line(segments[0])
        item = first[0]["item"]
        return first + [entry for segment in segments[1:] for entry in parse_line(item + " " + segment)]

    # A second explicit comparison inside a condition becomes a separate row.
    body, condition = trailing_parentheses(line)
    if condition and "→" in condition:
        primary = parse_line(body)
        conditional = re.match(r"(.+?)\s+(?=[?\d])(.+)", condition)
        if primary and conditional:
            entries = parse_line(primary[0]["item"] + " " + conditional[2])
            for entry in entries:
                entry["note"] = description("；".join(filter(None, (conditional[1], entry.get("note", "")))))
            return primary + entries
    if "→" in line:
        label = re.match(r"(" + VALUE_ITEMS + r")\s+(.+?) → (.+)", body if condition else line)
        if label:
            return [value_change(label[1], label[2], label[3], condition)]
        # Scalar values may have a descriptive suffix, e.g. physical resistance.
        numeric = re.fullmatch(r"(.+?)\s+([?\d][\d.]*(?:\s*(?:%|秒|HP|次|格|顆|枝|發|瓶|個))?) → ([?\d][\d.]*(?:\s*(?:%|秒|HP|次|格|顆|枝|發|瓶|個))?)(.*)", body if condition else line)
        if numeric:
            item, before, after, suffix = numeric.groups()
            note = "；".join(filter(None, (condition, suffix.strip())))
            if "傷害" in item and " + " in line:
                note = "；".join(filter(None, (note, "傷害加成")))
            return [value_change(item, before, after, note)]
        # Keep the whole left side when changing the type of an effect.
        before, after = line.split(" → ", 1)
        return [change("技能效果", before, after)]

    label = re.match(r"(" + VALUE_ITEMS + r")\s+(.+)", line)
    if label:
        item, value = label.groups()
        base, note = trailing_parentheses(value)
        # Explicit initial conditional values have no invented previous value.
        conditional = re.match(r"(.+?)\s+(\d+(?:\.\d+)?%?)$", note)
        scalar, _ = parse_value(base)
        if conditional and isinstance(scalar, (int, float)):
            return [value_change(item, None, base), value_change(item, None, conditional[2], conditional[1])]
        if re.match(r"^(追加|減少|變更為|固定|增加為|減少為|所有等級)", value):
            # A delta is not a new absolute value.
            return [change(item, None, value)]
        return [value_change(item, None, value)]
    return [change("技能效果", None, line)]


def section_key(value):
    return unicodedata.normalize("NFKC", re.sub(r"^#+\s*", "", value)).strip()


def skill_names(heading):
    heading = section_key(heading).replace(" - ", "-")
    if heading in MERGED_SKILLS:
        return MERGED_SKILLS[heading]
    # Korean/Chinese parallel headings may contain several skills in each language.
    if re.search(r"[\uac00-\ud7a3]", heading) and " / " in heading:
        heading = heading.rsplit(" / ", 1)[1]
    return [description(name.strip()) for name in heading.split("/") if name.strip()]


def section_url(post_id):
    return f"https://forum.gamer.com.tw/Co.php?bsn=4212&sn={post_id}"


@lru_cache(maxsize=1)
def skill_metadata():
    metadata_path = Path(__file__).with_name("ragnarok-skill-metadata.json")
    if metadata_path.exists():
        return json.loads(metadata_path.read_text(encoding="utf-8")).get("skills", {})
    return {}


def metadata_for(name):
    metadata = dict(skill_metadata().get(name, {}))
    if name in SKILLS:
        game_id, korean = SKILLS[name]
        metadata.update({"skillId": game_id, "ko": korean,
                         "sourceUrl": f"https://ro.gnjoy.com/guide/runemidgarts/skillview.asp?lineseq=2&skillid={game_id}"})
    return {"skillId": None, "ko": None, "ja": None, "en": None, "sourceUrl": None, **metadata}


def make_skill(name, heading, post_id, section_jobs):
    metadata = metadata_for(name)
    game_id = metadata.get("skillId")
    # Source-based identifiers remain stable when more official metadata is verified.
    skill_id = f"dk-{SKILLS[name][0]}" if name in SKILLS else f"post-{post_id}-" + hashlib.sha256(name.encode("utf-8")).hexdigest()[:12]
    job_ids = metadata.get("jobIds") or EXCLUSIVE_SKILL_JOBS.get(name) or [job[0] for job in section_jobs]
    if not set(job_ids).issubset({job[0] for job in section_jobs}):
        raise ValueError(f"{name}：技能職業資料與來源章節不符")
    skill = {"id": skill_id, "skillId": game_id, "jobIds": job_ids,
             "names": {"zhHant": name, "ko": metadata.get("ko"), "ja": metadata.get("ja"), "en": metadata.get("en")}}
    if metadata.get("sourceUrl"):
        skill["metadataSourceUrl"] = metadata["sourceUrl"]
    skill["sourceUrl"] = section_url(post_id)
    if section_key(heading) != name:
        skill["sourceHeading"] = description(section_key(heading))
    return skill


def parse_row_changes(fragment):
    lines = [line.strip() for line in plain(fragment).splitlines() if line.strip()]
    notes = [line.removeprefix("※").strip() for line in lines if line.startswith("※")]
    evidence = "player-test" if any("測試" in line for line in notes) else "article"
    changes, inherited = [], None
    strike = re.findall(r"<(?:strike|del|s)\b[^>]*>(.*?)</(?:strike|del|s)>", fragment, re.S | re.I)
    if strike:
        correction = next((note for note in notes if "移除" in note), None)
        if not correction:
            raise ValueError("來源含刪線文字但未提供可核對的撤回說明")
        removal_date = re.search(r"\d{4}-\d{2}-\d{2}", correction)
        after = f"該效果已於 {removal_date[0]} 維護移除" if removal_date else "該效果已移除"
        changes += [change("技能效果", plain(value), after) for value in strike]
        fragment = re.sub(r"<(?:strike|del|s)\b[^>]*>.*?</(?:strike|del|s)>", "", fragment, flags=re.S | re.I)
        lines = [line.strip() for line in plain(fragment).splitlines() if line.strip()]
    for line in lines:
        if line.startswith("※"):
            continue
        if line in ("技能倍率", "技能類型"):
            inherited = line
            continue
        if normalized_line(line) == "被動模式的加成 :":
            inherited = "被動模式"
            continue
        numbered = re.match(r"\d+\)", normalized_line(line))
        group_note = ""
        if numbered:
            body, possible_note = trailing_parentheses(normalized_line(line))
            # A second parenthesis scopes the whole numbered comparison, such as
            # the main and extra damage against a Sound Blend target.
            if possible_note and body.endswith(")") and "→" not in possible_note:
                line, group_note = body, possible_note
        entries = parse_line(line, inherited if numbered else None)
        if group_note:
            for entry in entries:
                entry["note"] = description("；".join(filter(None, (group_note, entry.get("note", "")))))
        if inherited == "技能類型" and entries and entries[0]["item"] == "技能效果":
            entries[0]["item"] = "技能類型"
        if inherited == "被動模式":
            for entry in entries:
                entry["note"] = "；".join(filter(None, ("被動模式", entry.get("note", ""))))
        if re.match(r"(?:AP|SP|固定|變動|共通|冷卻|技能基本倍率)", normalized_line(line)):
            inherited = None
        changes += entries
    for entry in changes:
        if notes:
            entry["note"] = description("；".join(filter(None, (entry.get("note", ""), *notes))))
    if not changes:
        raise ValueError("空白調整記錄")
    return changes, evidence


def build_data(index_html, skills_html, imported_at, *, partial=False):
    """Strict by default; partial=True exists only for focused parser fixtures."""
    versions, announcements, source_date = parse_versions(index_html)
    current = versions.get("4.2")
    if current is None or current["status"] != "released":
        raise ValueError("版本索引必須包含已實裝的現行版本 4.2")
    if isinstance(skills_html, str):
        skills_html = [skills_html]
    contents = {}
    for html in skills_html:
        for post_id in SECTION_POSTS:
            try:
                content = post(html, post_id)
            except ValueError:
                continue
            if post_id in contents and contents[post_id] != content:
                raise ValueError(f"來源樓層 cf{post_id} 出現不同內容")
            contents[post_id] = content
    if not partial and set(contents) != set(SECTION_POSTS):
        missing = sorted(set(SECTION_POSTS) - set(contents))
        raise ValueError(f"缺少職業來源樓層：{missing}")
    if not contents:
        raise ValueError("找不到職業來源樓層")
    skills, records, used_versions, jobs, coverage = [], [], set(), {}, []
    for post_id in SECTION_POSTS:
        if post_id not in contents:
            continue
        content = contents[post_id]
        headings = list(re.finditer(r"<h([34])\b[^>]*>(.*?)</h\1>", content, re.S | re.I))
        section_jobs, seen_sections, source_rows, source_headings = None, [], 0, 0
        for index, heading in enumerate(headings):
            title = plain(heading[2])
            key = section_key(title)
            fragment = content[heading.end():headings[index + 1].start() if index + 1 < len(headings) else len(content)]
            is_section = heading[1] == "3" or re.match(r"^##(?:\s|$)", title)
            if is_section:
                if key not in JOB_SECTIONS:
                    if partial:
                        section_jobs = None
                        continue
                    raise ValueError(f"cf{post_id}：未知職業章節 {key}")
                if key in seen_sections:
                    raise ValueError(f"cf{post_id}：職業章節重複 {key}")
                seen_sections.append(key)
                section_jobs = JOB_SECTIONS[key]
                for job_id, job_name in section_jobs:
                    jobs[job_id] = {"id": job_id, "name": job_name}
                if re.search(r"<table\b", fragment, re.I):
                    raise ValueError(f"{key}：技能表格缺少標題")
                continue
            if not key:
                if re.search(r"<table\b", fragment, re.I):
                    raise ValueError(f"cf{post_id}：空白技能標題含表格")
                continue
            if section_jobs is None:
                if partial:
                    continue
                raise ValueError(f"cf{post_id}：{key} 不在已知職業章節內")
            names = skill_names(title)
            source_headings += 1
            heading_skills = [make_skill(name, title, post_id, section_jobs) for name in names]
            skills += heading_skills
            rows = re.findall(r"<tr\b[^>]*>(.*?)</tr>", fragment, re.S | re.I)
            if not rows:
                raise ValueError(f"{key}：技能沒有調整表格")
            for row in rows:
                cells = re.findall(r"<td\b[^>]*>(.*?)</td>", row, re.S | re.I)
                if len(cells) != 2:
                    raise ValueError(f"{key}：無法解析表格列")
                version_label = plain(cells[0])
                version_match = re.fullmatch(r"第\s*([\d.]+)\s*版本", version_label)
                version_number = version_match[1] if version_match else None
                if version_number is None and version_label == "未知":
                    version_number = "unknown"
                    versions.setdefault("unknown", {"id": "kro-unknown", "name": "版本未知", "order": 0,
                                                   "releasedAt": None, "status": "unknown"})
                    announcements.setdefault("unknown", {"id": "kro-unknown-source", "versionId": "kro-unknown",
                        "title": "來源文章：調整版本未確認", "publishedAt": None, "url": None,
                        "kind": "article-source", "sourceUrl": section_url(post_id)})
                if version_number not in versions:
                    raise ValueError(f"{key}：未知版本 {version_label}")
                used_versions.add(version_number)
                changes, evidence = parse_row_changes(cells[1])
                source_rows += 1
                for skill in heading_skills:
                    records.append({"id": f"{skill['id']}-{versions[version_number]['id']}", "skillId": skill["id"],
                                    "versionId": versions[version_number]["id"], "announcementIds": [announcements[version_number]["id"]],
                                    "evidence": evidence, "changes": [dict(entry) for entry in changes], "sourceUrl": section_url(post_id)})
        if not partial and set(seen_sections) != set(SECTION_POSTS[post_id]):
            raise ValueError(f"cf{post_id}：職業章節不完整，預期 {SECTION_POSTS[post_id]}，實際 {seen_sections}")
        if source_rows != len(re.findall(r"<tr\b", content, re.I)):
            raise ValueError(f"cf{post_id}：來源表格列未完整涵蓋")
        coverage.append({"postId": post_id, "sections": len(seen_sections), "skillHeadings": source_headings, "rows": source_rows})
    if len({skill["id"] for skill in skills}) != len(skills):
        raise ValueError("技能識別碼重複，請確認來源標題")
    if len({record["id"] for record in records}) != len(records):
        raise ValueError("同一技能與版本出現重複記錄，請確認來源結構")
    game_ids = [skill["skillId"] for skill in skills if skill["skillId"] is not None]
    if len(set(game_ids)) != len(game_ids):
        raise ValueError("可驗證的遊戲技能 ID 重複，請確認中繼資料")
    if not partial and {skill["skillId"] for skill in skills if skill["id"].startswith("dk-")} != {entry[0] for entry in SKILLS.values()}:
        raise ValueError("盧恩龍爵既有技能不完整")
    job_order = {job_id: index for index, job_id in enumerate(JOB_ORDER)}
    skills.sort(key=lambda skill: (min(job_order[job_id] for job_id in skill["jobIds"]),
                                   skill["skillId"] if skill["skillId"] is not None else float("inf"), skill["id"]))
    return {"schemaVersion": 1, "meta": {
        "isDemo": False, "server": "kRO", "currentVersionId": current["id"], "updatedAt": imported_at,
        "notice": "收錄來源文章全部職業與非四轉補充的 kRO 調整摘要；版本編號依來源文章。預告、版本未知與玩家測試內容另有標註，缺漏值不予推測。",
        "source": {"title": "kRO 迄今技能調整／優化整理", "author": "杜腐（badgirl159）", "url": SOURCE_URL,
                   "sectionUrl": SECTION_URL, "sectionUrls": [section_url(post_id) for post_id in contents],
                   "updatedAt": source_date, "coverage": coverage},
    }, "jobs": [jobs[job_id] for job_id in JOB_ORDER if job_id in jobs],
        "versions": [version for key, version in versions.items() if key in used_versions or version["id"] == current["id"]],
        "announcements": [entry for key, entry in announcements.items() if key in used_versions or entry["versionId"] == current["id"]],
        "skills": skills, "records": records}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--index", required=True, type=Path, help="文章首樓（版本索引）HTML")
    parser.add_argument("--skills", required=True, type=Path, nargs="+", help="完整討論串或四之一、四之二、擴充與非四轉技能樓層 HTML")
    parser.add_argument("--date", required=True, type=date.fromisoformat, help="匯入日期 YYYY-MM-DD")
    parser.add_argument("--output", type=Path, default=ROOT / "assets/js/tools/ragnarok/skill-change-data.js")
    args = parser.parse_args()
    data = build_data(args.index.read_text(encoding="utf-8"), [path.read_text(encoding="utf-8") for path in args.skills], args.date.isoformat())
    encoded = json.dumps(data, ensure_ascii=False, indent=2)
    args.output.write_text('"use strict";\n\n// 由 scripts/import-ragnarok-skill-changes.py 產生；來源與範圍見 meta。\nwindow.ragnarokSkillChangeData = ' + encoded + ';\n', encoding="utf-8")
    print(f"匯入 {len(data['skills'])} 個技能 / {len(data['versions'])} 個版本 / {len(data['records'])} 筆記錄 / {sum(len(r['changes']) for r in data['records'])} 個調整項目")


if __name__ == "__main__":
    main()
