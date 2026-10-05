#!/usr/bin/env python3
"""Check import parsing without making network requests."""
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("importer", Path(__file__).with_name("import-ragnarok-skill-changes.py"))
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)

INDEX = '''<article id="cf2901178"><ul>
  <li>第 1 版本：<a href="https://ro.gnjoy.com/news/notice/View.asp?seq=1">kRO 2021-09-01 實裝</a></li>
  <li>第 1.1 版本：<a href="https://ro.gnjoy.com/news/notice/View.asp?seq=11">kRO 2021-09-08 實裝</a></li>
  <li>第 4.2 版本：<a href="https://ro.gnjoy.com/news/notice/View.asp?seq=42">kRO 2024-10-16 實裝</a></li>
  <li>第 8 版本：<a href="https://ro.gnjoy.com/news/notice/View.asp?seq=8">kRO 2026-08-19 實裝</a></li>
  <li>第 9 版本：<a href="https://ro.gnjoy.com/news/devnote/View.asp?seq=9">kRO 2026-09-30 公佈</a>（尚未實裝）</li>
  <li>最後更新：2026-10-01</li></ul></article>'''


def skill_table(name, version="1", body="新增此技能"):
    label = f"第 {version} 版本" if version != "unknown" else "未知"
    return f'<h4>### {name}</h4><table><tr><td>{label}</td><td>{body}</td></tr></table>'


def source_fixture():
    """Distinct skills across every mandatory article/section, with real DK IDs."""
    posts = []
    for post_id, sections in importer.SECTION_POSTS.items():
        headings = []
        for position, title in enumerate(sections):
            # The source mistakenly uses h4 for one job heading.
            level = "4" if title == "大主教 / 樞機主教" else "3"
            headings.append(f'<h{level}>## {title}</h{level}>')
            if post_id == 2901200 and position == 0:
                headings.extend(skill_table(name) for name in importer.SKILLS)
            elif title.startswith("宮廷樂師"):
                headings.append(skill_table("混聲烙印"))
            elif title.startswith("日影忍者"):
                headings.append(skill_table("詭影狩獵"))
            elif title == "機械工匠 / 機甲神匠":
                headings.append(skill_table("ABR-決戰勇士 / ARB-雙子加農砲 / ABR-天網聖母"))
            elif title == "基因學者 / 生命締造者" and post_id != 2901252:
                headings.append(skill_table("強酸禁地(水/風/地/火)"))
            elif post_id == 2901252 and title == "拳皇 / 天帝":
                headings.append(skill_table("太陽的憤怒 / 月亮的憤怒 / 星星的憤怒"))
            else:
                headings.append(skill_table(f"測試技能{post_id}-{position}"))
        posts.append(f'<article id="cf{post_id}">' + ''.join(headings) + '</article>')
    return posts


class SkillImportTests(unittest.TestCase):
    def test_numeric_zero_and_units(self):
        entry = importer.parse_line("固定詠唱時間 0.4 → 0 秒")[0]
        self.assertEqual((entry["before"], entry["after"], entry["unit"]), (0.4, 0, "秒"))
        entry = importer.parse_line("技能倍率 3750% → 5150%（五級武器、武器重量 150）")[0]
        self.assertEqual(entry["note"], "五級武器、武器重量 150")
        self.assertEqual(importer.parse_line("ＭＳＰ 的預設計算比率 12.5% → 25%")[0]["before"], 12.5)
        entry = importer.parse_line("技能倍率 3750% → 5150%（五級武器:重量 150;P.ATK 12.5%,上限.）")[0]
        self.assertEqual(entry["note"], "五級武器：重量 150；P.ATK 12.5%，上限。")
        entry = importer.parse_line("使用雙手劍會造成近距離物理傷害，使用雙手矛會造成遠距離物理傷害")[0]
        self.assertEqual(entry["after"], "雙手劍：近距離物理；雙手矛：遠距離物理")

    def test_range_and_attack_display(self):
        entry = importer.parse_line("技能範圍 5 x 5 → 9 x 9")[0]
        self.assertEqual((entry["item"], entry["before"], entry["after"]), ("技能範圍", "5 x 5", "9 x 9"))
        entry = importer.parse_line("打擊次數 1 次打擊分 2 次表示 → 2 次打擊")[0]
        self.assertEqual(entry["before"], "1 次打擊分 2 次表示")

    def test_conditional_values_split(self):
        entries = importer.parse_line("技能基本倍率 3850% → 4550%（天龍光環時 4200% → 5000%）")
        self.assertEqual([(entry["before"], entry["after"]) for entry in entries], [(3850, 4550), (4200, 5000)])
        self.assertEqual(entries[1]["note"], "天龍光環時")
        entries = importer.parse_line("技能基本倍率 4050%（活力之源時 5400%）")
        self.assertTrue(all(entry["before"] is None for entry in entries))
        self.assertEqual(entries[1]["after"], 5400)

    def test_old_values_not_invented(self):
        self.assertIsNone(importer.parse_line("新增此技能")[0]["before"])
        self.assertIsNone(importer.parse_line("依據施展者的暴擊率適用暴擊")[0]["before"])
        entry = importer.parse_line("冷卻時間 150 → 60")[0]
        self.assertNotIn("unit", entry)
        self.assertIn("未標示單位", entry["note"])

    def test_unfamiliar_descriptions_are_preserved_without_invention(self):
        entry = importer.parse_line("這是未處理的新調整格式")[0]
        self.assertEqual(entry, {"item": "技能效果", "before": None, "after": "這是未處理的新調整格式"})
        entry = importer.parse_line("技能倍率 400% → 450")[0]
        self.assertEqual((entry["before"], entry["after"]), ("400%", "450"))
        self.assertNotIn("unit", entry)
        entry = importer.parse_line("冷卻時間 減少 30 秒")[0]
        self.assertEqual((entry["before"], entry["after"]), (None, "減少 30 秒"))
        entry = importer.parse_line("疾風加速持續時間 ? → 5 秒")[0]
        self.assertEqual((entry["before"], entry["after"], entry["unit"]), (None, 5, "秒"))

    def test_thousands_ranges_and_composite_values(self):
        entry = importer.parse_line("ABR 的 MHP 增加 20,000 → 400,000")[0]
        self.assertEqual((entry["before"], entry["after"]), (20000, 400000))
        entry = importer.parse_line("技能範圍 5 x 5→ 7 x 7")[0]
        self.assertEqual((entry["item"], entry["before"], entry["after"]), ("技能範圍", "5 x 5", "7 x 7"))
        entries = importer.parse_line("技能範圍 5 x 5 → 7 x 7（狂氣 7 x 7 → 9 x 9）")
        self.assertEqual([(entry["before"], entry["after"]) for entry in entries], [("5 x 5", "7 x 7"), ("7 x 7", "9 x 9")])
        self.assertEqual(entries[1]["note"], "狂氣")
        entry = importer.parse_line("技能基本倍率 6400%/2070% → 6750%/8750%（霰彈槍；基本倍率/王牌出手）")[0]
        self.assertEqual((entry["before"], entry["after"]), ("6400%/2070%", "6750%/8750%"))
        self.assertIn("霰彈槍", entry["note"])

    def test_numbered_conditions_keep_main_extra_and_target_context(self):
        entries, _ = importer.parse_row_changes('技能倍率<br>1) 2500% → 3750%（主要）、750% → 1750%（額外）<br>2) 3250% → 5000%（主要）、975% → 3750%（額外）（對混聲烙印目標時）')
        self.assertEqual([(entry["before"], entry["after"]) for entry in entries], [(2500, 3750), (750, 1750), (3250, 5000), (975, 3750)])
        self.assertTrue(all(entry["item"] == "技能倍率" for entry in entries))
        self.assertEqual(entries[0]["note"], "主要")
        self.assertEqual(entries[1]["note"], "額外")
        self.assertTrue(all("對混聲烙印目標時" in entry["note"] for entry in entries[2:]))

    def test_footnotes_and_retracted_player_effects(self):
        changes, evidence = importer.parse_row_changes('<strike>不會被亡靈掌心、擊退、位置互換的位移效果解除</strike><br>※ 玩家測試結果<br>※ 2026-09-02 維護中，此項被 kRO 認列 Bug 並移除。')
        self.assertEqual(evidence, "player-test")
        self.assertIn("位移效果解除", changes[0]["before"])
        self.assertIn("2026-09-02", changes[0]["after"])
        self.assertIn("移除", changes[0]["after"])
        self.assertIn("玩家測試", changes[0]["note"])
        self.assertIn("認列 Bug", changes[0]["note"])
        changes, evidence = importer.parse_row_changes('技能基本倍率 6400%/2070% → 6750%/8750%<br>※ 原始倍率的 2070% 與 2270% 應為官方筆誤。')
        self.assertEqual(evidence, "article")
        self.assertEqual(changes[0]["before"], "6400%/2070%")
        self.assertIn("官方筆誤", changes[0]["note"])
        _, evidence = importer.parse_row_changes('移動速度增加 25% → 15%<br>※ 合計上會更快一些')
        self.assertEqual(evidence, "article")

    def test_job_boundary_and_player_evidence(self):
        index = '''<article id="cf2901178"><ul>
          <li>第 1 版本：<a href="https://ro.gnjoy.com/news/notice/View.asp?seq=1">kRO 2021-09-01 實裝</a></li>
          <li>第 4.2 版本：<a href="https://ro.gnjoy.com/news/notice/View.asp?seq=42">kRO 2024-10-16 實裝</a></li>
          <li>第 8 版本：<a href="https://ro.gnjoy.com/news/notice/View.asp?seq=8">kRO 2026-08-19 實裝</a></li>
          <li>第 9 版本：<a href="https://ro.gnjoy.com/news/devnote/View.asp?seq=9">kRO 2026-09-30 公佈</a>（尚未實裝）</li>
          <li>最後更新：2026-10-01</li></ul></article>'''
        rows = ''.join(f'<h4>### {name}</h4><table><tr><td>第 1 版本</td><td>新增此技能</td></tr></table>' for name in importer.SKILLS)
        rows += '<h4>### 死侍武器-斬裂</h4><table><tr><td>第 9 版本</td><td>冷卻時間 0.7 → 0.5 秒<br>※ 玩家測試</td></tr></table>'
        # Add the extra version to the existing skill table instead of duplicating the skill heading.
        rows = rows.replace('<h4>### 死侍武器-斬裂</h4><table><tr><td>第 1 版本</td><td>新增此技能</td></tr></table>', '')
        skills = '<article id="cf2901200"><h3>盧恩騎士 / 盧恩龍爵</h3>' + rows + '<h3>其他職業</h3><h4>未設定技能</h4></article>'
        data = importer.build_data(index, skills, "2026-10-02", partial=True)
        self.assertEqual(len(data["skills"]), 12)
        self.assertEqual(data["meta"]["currentVersionId"], "kro-v4-2")
        self.assertEqual([version["id"] for version in data["versions"]], ["kro-v1", "kro-v4-2", "kro-v9"])
        self.assertTrue(any(entry["versionId"] == "kro-v4-2" for entry in data["announcements"]))
        with self.assertRaisesRegex(ValueError, "現行版本 4.2"):
            importer.build_data(index.replace("第 4.2 版本", "第 4.1 版本"), skills, "2026-10-02", partial=True)
        planned = data["versions"][-1]
        self.assertEqual(planned["status"], "planned")
        self.assertIsNone(planned["releasedAt"])
        self.assertEqual(planned["announcedAt"], "2026-09-30")
        player = data["records"][-1]
        self.assertEqual(player["evidence"], "player-test")
        self.assertIn("玩家測試", player["changes"][0]["note"])
        with self.assertRaises(ValueError):
            importer.build_data(index, skills.replace("第 9 版本", "第 99 版本"), "2026-10-02", partial=True)
        with self.assertRaises(ValueError):
            importer.parse_versions(index.replace("ro.gnjoy.com", "example.test"))

    def test_full_job_coverage_shared_skills_and_supplement(self):
        data = importer.build_data(INDEX, source_fixture(), "2026-10-05")
        self.assertEqual(len(data["jobs"]), 21)
        self.assertEqual({job["id"] for job in data["jobs"]}, {job[0] for jobs in importer.JOB_SECTIONS.values() for job in jobs})
        skills = {skill["names"]["zhHant"]: skill for skill in data["skills"]}
        self.assertEqual(set(skills["混聲烙印"]["jobIds"]), {"troubadour", "trouvere"})
        self.assertEqual(set(skills["詭影狩獵"]["jobIds"]), {"shinkiro", "shiranui"})
        for name in ("ABR-決戰勇士", "ABR-雙子加農砲", "ABR-天網聖母", "強酸禁地（水）", "強酸禁地（火）", "太陽的憤怒", "月亮的憤怒", "星星的憤怒"):
            self.assertIn(name, skills)
        self.assertEqual(skills["太陽的憤怒"]["jobIds"], ["sky-emperor"])
        self.assertEqual(data["meta"]["currentVersionId"], "kro-v4-2")
        self.assertEqual(len(data["meta"]["source"]["coverage"]), 4)
        self.assertEqual(sum(item["rows"] for item in data["meta"]["source"]["coverage"]), 36)
        for name, (game_id, korean) in importer.SKILLS.items():
            self.assertEqual((skills[name]["id"], skills[name]["skillId"], skills[name]["names"]["ko"]), (f"dk-{game_id}", game_id, korean))

    def test_unknown_version_is_retained_without_a_date_or_official_notice(self):
        source = '<article id="cf2901202"><h3>## 超級初學者 / 終極初學者</h3>' + skill_table("隕石術猛擊", "unknown", "技能倍率 3500% → 6300%（落下）、2050% → 3450%（爆炸）") + '</article>'
        data = importer.build_data(INDEX, source, "2026-10-05", partial=True)
        version = next(version for version in data["versions"] if version["id"] == "kro-unknown")
        self.assertEqual((version["status"], version["releasedAt"], version["order"]), ("unknown", None, 0))
        record = data["records"][0]
        self.assertEqual(record["versionId"], "kro-unknown")
        self.assertEqual([(entry["before"], entry["after"]) for entry in record["changes"]], [(3500, 6300), (2050, 3450)])
        announcement = next(item for item in data["announcements"] if item["id"] == record["announcementIds"][0])
        self.assertEqual((announcement["url"], announcement["publishedAt"], announcement["kind"]), (None, None, "article-source"))

    def test_strict_import_rejects_missing_posts_sections_and_orphan_rows(self):
        sources = source_fixture()
        with self.assertRaisesRegex(ValueError, "缺少職業來源樓層"):
            importer.build_data(INDEX, sources[:1], "2026-10-05")
        with self.assertRaisesRegex(ValueError, "未知職業章節"):
            importer.build_data(INDEX, [sources[0].replace("機械工匠 / 機甲神匠", "新增的未設定職業"), *sources[1:]], "2026-10-05")
        with self.assertRaisesRegex(ValueError, "職業章節不完整"):
            importer.build_data(INDEX, [sources[0].replace('<h3>## 遊俠 / 風鷹狩獵者</h3>', ''), *sources[1:]], "2026-10-05")
        with self.assertRaisesRegex(ValueError, "未完整涵蓋"):
            importer.build_data(INDEX, [sources[0].replace('<h3>## 盧恩騎士 / 盧恩龍爵</h3>', '<table><tr><td>第 1 版本</td><td>新增此技能</td></tr></table><h3>## 盧恩騎士 / 盧恩龍爵</h3>'), *sources[1:]], "2026-10-05")

    def test_multilingual_and_merged_skill_names(self):
        self.assertEqual(importer.skill_names("### 프라임드 플레임 트랩/프라임드 스위프트 트랩 / 填裝火焰陷阱/填裝急速陷阱"), ["填裝火焰陷阱", "填裝急速陷阱"])
        self.assertEqual(importer.skill_names("### 召喚元素:阿爾多雷 / 召喚元素:迪盧比奧"), ["召喚元素：阿爾多雷", "召喚元素：迪盧比奧"])
        self.assertEqual(importer.skill_names("### 서번트 웨폰 – 클리브 / 死侍武器 - 斬裂"), ["死侍武器-斬裂"])

    def test_source_identifiers_stay_stable_when_tables_move(self):
        sources = source_fixture()
        data = importer.build_data(INDEX, sources, "2026-10-05")
        reordered = importer.build_data(INDEX, list(reversed(sources)), "2026-10-05")
        self.assertEqual(data["skills"], reordered["skills"])
        names = importer.skill_names("### 太陽的憤怒 / 月亮的憤怒 / 星星的憤怒")
        a = importer.make_skill(names[0], "太陽的憤怒 / 月亮的憤怒 / 星星的憤怒", 2901252, [("sky-emperor", "天帝")])
        b = importer.make_skill(names[0], "太陽的憤怒", 2901252, [("sky-emperor", "天帝")])
        self.assertEqual(a["id"], b["id"])

    def test_cli_accepts_multiple_html_files(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            index_path = folder / "index.html"
            index_path.write_text(INDEX, encoding="utf-8")
            files = []
            for position, source in enumerate(source_fixture()):
                path = folder / f"post-{position}.html"
                path.write_text(source, encoding="utf-8")
                files.append(str(path))
            output = folder / "result.js"
            result = subprocess.run([sys.executable, str(Path(__file__).with_name("import-ragnarok-skill-changes.py")), "--index", str(index_path), "--skills", *files, "--date", "2026-10-05", "--output", str(output)], text=True, capture_output=True, check=True)
            self.assertIn("個技能", result.stdout)
            encoded = output.read_text(encoding="utf-8").split("window.ragnarokSkillChangeData = ", 1)[1].rstrip(";\n")
            self.assertEqual(len(json.loads(encoded)["jobs"]), 21)


if __name__ == "__main__":
    unittest.main()
