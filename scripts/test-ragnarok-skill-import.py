#!/usr/bin/env python3
"""Check import parsing without making network requests."""
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("importer", Path(__file__).with_name("import-ragnarok-skill-changes.py"))
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


class SkillImportTests(unittest.TestCase):
    def test_numeric_zero_and_units(self):
        entry = importer.parse_line("固定詠唱時間 0.4 → 0 秒")[0]
        self.assertEqual((entry["before"], entry["after"], entry["unit"]), (0.4, 0, "秒"))
        entry = importer.parse_line("技能倍率 3750% → 5150%（五級武器、武器重量 150）")[0]
        self.assertEqual(entry["note"], "五級武器、武器重量 150")
        self.assertEqual(importer.parse_line("ＭＳＰ 的預設計算比率 12.5% → 25%")[0]["before"], 12.5)

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

    def test_unknown_lines_fail(self):
        with self.assertRaises(ValueError):
            importer.parse_line("這是未處理的新調整格式")
        with self.assertRaises(ValueError):
            importer.parse_line("技能倍率 400% → 450")

    def test_job_boundary_and_player_evidence(self):
        index = '''<article id="cf2901178"><ul>
          <li>第 1 版本：<a href="https://ro.gnjoy.com/news/notice/View.asp?seq=1">kRO 2021-09-01 實裝</a></li>
          <li>第 9 版本：<a href="https://ro.gnjoy.com/news/devnote/View.asp?seq=9">kRO 2026-09-30 公佈</a>（尚未實裝）</li>
          <li>最後更新：2026-10-01</li></ul></article>'''
        rows = ''.join(f'<h4>### {name}</h4><table><tr><td>第 1 版本</td><td>新增此技能</td></tr></table>' for name in importer.SKILLS)
        rows += '<h4>### 死侍武器-斬裂</h4><table><tr><td>第 9 版本</td><td>冷卻時間 0.7 → 0.5 秒<br>※ 玩家測試</td></tr></table>'
        # Add the extra version to the existing skill table instead of duplicating the skill heading.
        rows = rows.replace('<h4>### 死侍武器-斬裂</h4><table><tr><td>第 1 版本</td><td>新增此技能</td></tr></table>', '')
        skills = '<article id="cf2901200"><h3>盧恩騎士 / 盧恩龍爵</h3>' + rows + '<h3>其他職業</h3><h4>未設定技能</h4></article>'
        data = importer.build_data(index, skills, "2026-10-02")
        self.assertEqual(len(data["skills"]), 12)
        self.assertEqual(data["meta"]["currentVersionId"], "kro-v1")
        planned = data["versions"][-1]
        self.assertEqual(planned["status"], "planned")
        self.assertIsNone(planned["releasedAt"])
        self.assertEqual(planned["announcedAt"], "2026-09-30")
        player = data["records"][-1]
        self.assertEqual(player["evidence"], "player-test")
        self.assertIn("官方更新清單未載明", player["changes"][0]["note"])
        with self.assertRaises(ValueError):
            importer.build_data(index, skills.replace("冷卻時間 0.7 → 0.5 秒", "未知調整"), "2026-10-02")
        with self.assertRaises(ValueError):
            importer.parse_versions(index.replace("ro.gnjoy.com", "example.test"))


if __name__ == "__main__":
    unittest.main()
