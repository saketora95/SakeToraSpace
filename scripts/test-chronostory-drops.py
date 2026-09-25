"""Run importer and bundled drop-data checks with Python's standard library."""
import importlib.util
import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("chronostory_import", ROOT / "scripts/import-chronostory-drops.py")
IMPORTER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(IMPORTER)


def bundled_data():
    text = (ROOT / "assets/js/tools/chronostory/drop-data.js").read_text(encoding="utf-8")
    return json.loads(text.split("window.chronoStoryDropData = ", 1)[1].removesuffix(";\n"))


class ImportTests(unittest.TestCase):
    def test_all_retired_equipment_and_drops_are_excluded(self):
        summary = {"B1": "冰原雪域", "C1": "雪吉拉戰車",
                   "F1": "\n".join(f"70 {name} / 20" for name in IMPORTER.EXCLUDED_ITEMS)}
        data = IMPORTER.compile_data({"後期簡表": summary}, "2026-09-25", "test")
        self.assertEqual(data["items"], [])
        self.assertEqual(data["drops"], [])

    def test_excluded_equipment_and_reference_only_categories(self):
        data = IMPORTER.compile_data({
            "法師 (四速)": {"C4": "套服", "D4": "紅天上之衣(男)", "G4": "999 智"},
            "後期簡表": {"B1": "冰原雪域", "C1": "雪吉拉戰車",
                         "F1": "65 魔靈之翼 / 83\n68 紅天上之衣 / 21"},
        }, "2026-09-25", "test")
        self.assertEqual([i["name"] for i in data["items"]], ["紅天上之衣"])
        self.assertEqual(data["items"][0]["categories"], ["套服"])
        self.assertEqual(data["items"][0]["variants"], [])
        self.assertEqual(len(data["drops"]), 1)
        self.assertEqual(data["drops"][0]["itemId"], data["items"][0]["id"])

    def test_elements_are_structured_and_keep_qualifiers(self):
        self.assertEqual(IMPORTER.parse_elements("弱火 抗冰"), [
            {"element": "火", "damageEffect": "increase"},
            {"element": "冰", "damageEffect": "decrease"},
        ])
        self.assertEqual(IMPORTER.parse_elements("魚屋抗火冰雷毒"), [
            {"element": element, "damageEffect": "decrease", "qualifier": "魚屋"}
            for element in "火冰雷毒"
        ])
        with self.assertRaisesRegex(ValueError, "Unrecognized element"):
            IMPORTER.parse_elements("未知")

    def fixture(self):
        regions = dict(zip("EFGHIJ", ["維多利亞", "天空之城", "玩具城", "地球防衛", "水世界", "神木村"]))
        scrolls = {f"{col}3": name for col, name in regions.items()}
        scrolls.update({"B4": "火槍", "C4": "火槍攻擊卷軸10%", "D4": "3 敏 5 攻 1 命",
                        "J4": "赤翼龍(0.24%)\n烏龜(0.0.9%)", "B5": "火槍", "C5": "火槍攻擊卷軸15%"})
        mage = {f"{col}3": name for col, name in zip("HIJKLM", regions.values())}
        mage.update({"C4": "武器", "D4": "測試法杖", "E4": "68.0", "F4": "83.0", "G4": "83 攻",
                     "I4": "雪吉拉(0.21%)"})
        summary = {"B9": "神木村 後半", "C9": "赤翼龍", "D9": "弱冰\n抗火", "J9": "火槍攻擊 10%",
                   "B10": "神木村 後半", "C10": "墮落的翼龍", "E10": "閃耀的龍鱗戒指 (頂 265 HP + 1 捲)",
                   "B11": "冰原雪域", "C11": "雪吉拉戰車", "F11": "65 測試法杖 / 83"}
        return IMPORTER.compile_data({"武器卷軸": scrolls, "法師 (五速)": mage,
                                      "法師 (四速)": {"D4": "不應匯入的四速裝備"},
                                      "後期簡表": summary}, "2026-09-24", "test")

    def test_summary_scroll_alias_merges_without_losing_rates(self):
        data = self.fixture()
        scroll = next(i for i in data["items"] if i["name"] == "火槍攻擊卷軸10%")
        dragon = next(m for m in data["monsters"] if m["name"] == "赤翼龍")
        drops = [d for d in data["drops"] if (d["itemId"], d["monsterId"]) == (scroll["id"], dragon["id"])]
        self.assertEqual(len(drops), 1)
        self.assertEqual([o["ratePercent"] for o in drops[0]["observations"]], [0.24, None])
        self.assertEqual(scroll["variants"][0]["successPercent"], 10)
        self.assertEqual(scroll["variants"][0]["stats"], "敏捷 + 3、攻擊力 + 5、命中 + 1")

    def test_malformed_percentage_remains_unknown(self):
        observations = [o for drop in self.fixture()["drops"] for o in drop["observations"]]
        invalid = next(o for o in observations if o.get("rateText") == "0.0.9%")
        self.assertIsNone(invalid["ratePercent"])
        self.assertEqual(invalid["region"], "神木村")

    def test_only_five_speed_mage_is_imported_and_renamed(self):
        data = self.fixture()
        item = next(i for i in data["items"] if i["name"] == "測試法杖")
        self.assertEqual(item["variants"][0]["requirement"], {"type": "level", "value": 68})
        self.assertEqual(item["variants"][0]["build"], "法師")
        self.assertNotIn("不應匯入的四速裝備", {i["name"] for i in data["items"]})
        self.assertIn("法師", data["source"]["sheets"])
        self.assertEqual(item["summaryNotes"][0]["level"], 65)
        names = {m["name"] for m in data["monsters"]}
        self.assertTrue({"雪吉拉", "雪吉拉戰車"} <= names)

    def test_summary_only_equipment_keeps_unknown_rate(self):
        data = self.fixture()
        ring = next(i for i in data["items"] if i["name"] == "閃耀的龍鱗戒指")
        self.assertEqual(ring["jobs"], [])
        self.assertEqual(ring["categories"], ["戒指"])
        drop = next(d for d in data["drops"] if d["itemId"] == ring["id"])
        self.assertIsNone(drop["observations"][0]["ratePercent"])

    def test_blank_drop_cells_do_not_invent_monsters(self):
        data = self.fixture()
        scroll = next(i for i in data["items"] if i["name"] == "火槍攻擊卷軸15%")
        self.assertFalse(any(d["itemId"] == scroll["id"] for d in data["drops"]))

    def test_summary_preserves_sheet_order_and_excludes_detailed_only_monsters(self):
        data = self.fixture()
        monsters = {monster["id"]: monster for monster in data["monsters"]}
        self.assertEqual([(entry["region"], monsters[entry["monsterId"]]["name"])
                          for entry in data["summary"]],
                         [("神木村 後半", "赤翼龍"), ("神木村 後半", "墮落的翼龍"),
                          ("冰原雪域", "雪吉拉戰車")])

    def test_unrecognized_drop_format_fails(self):
        with self.assertRaisesRegex(ValueError, "Unparsed drop"):
            IMPORTER.compile_data({"武器卷軸": {"E3": "A", "F3": "B", "G3": "C", "H3": "D", "I3": "E", "J3": "F",
                                                   "B4": "火槍", "C4": "火槍攻擊卷軸10%", "E4": "unknown format"}}, "2026-09-24", "test")

    def test_ids_ignore_width_and_spacing(self):
        self.assertEqual(IMPORTER.identifier("item", "道具 (男)"), IMPORTER.identifier("item", "道具（男）"))

    def test_stats_are_formatted_at_import_time(self):
        cases = {
            "14 智 93+120 防": "智力 + 14、物理防禦 + 93、魔法防禦 + 120",
            "2 力 3 敏 4 智 5 幸 6 命 7 防 8 魔防": "力量 + 2、敏捷 + 3、智力 + 4、幸運 + 5、命中 + 6、物理防禦 + 7、魔法防禦 + 8",
            "0 力 -2 敏 1.5 智": "力量 + 0、敏捷 - 2、智力 + 1.5",
            "頂 265 HP + 1 捲": "HP + 265、可升級次數 + 1",
            "頂全 2 屬 + 0 捲": "全能力 + 2、可升級次數 + 0",
            "10 血 10 魔 2 迴 3 速 5 跳": "HP + 10、MP + 10、迴避 + 2、移動速度 + 3、跳躍力 + 5",
            "": "",
        }
        for original, expected in cases.items():
            with self.subTest(original=original):
                self.assertEqual(IMPORTER.format_stats(original), expected)
        ring = next(i for i in self.fixture()["items"] if i["name"] == "閃耀的龍鱗戒指")
        self.assertEqual(ring["summaryNotes"][0]["stats"], "HP + 265、可升級次數 + 1")


class BundledDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = bundled_data()

    def test_unique_ids_and_valid_bidirectional_references(self):
        items = {i["id"] for i in self.data["items"]}
        monsters = {m["id"] for m in self.data["monsters"]}
        self.assertEqual(len(items), len(self.data["items"]))
        self.assertEqual(len(monsters), len(self.data["monsters"]))
        pairs = set()
        for drop in self.data["drops"]:
            self.assertIn(drop["itemId"], items)
            self.assertIn(drop["monsterId"], monsters)
            pair = (drop["itemId"], drop["monsterId"])
            self.assertNotIn(pair, pairs)
            pairs.add(pair)
            self.assertTrue(drop["observations"])
            for observation in drop["observations"]:
                rate = observation["ratePercent"]
                self.assertTrue(rate is None or 0 <= rate <= 100)

    def test_no_spreadsheet_locations_or_raw_cells_are_exported(self):
        allowed = set(self.data["source"]["sheets"])
        self.assertEqual(allowed, {IMPORTER.SHEET_LABELS.get(name, name) for name in IMPORTER.EQUIPMENT_SHEETS}
                         | IMPORTER.SCROLL_SHEETS | {"後期簡表"})
        self.assertFalse(allowed & IMPORTER.EXCLUDED)
        def walk(value):
            if isinstance(value, dict):
                self.assertFalse({"cell", "sheet", "sources", "raw"} & value.keys())
                for child in value.values():
                    walk(child)
            elif isinstance(value, list):
                for child in value:
                    walk(child)
        walk(self.data)
        self.assertEqual(self.data["schemaVersion"], 3)

    def test_bundled_stats_are_display_ready(self):
        records = [v for item in self.data["items"] for v in item["variants"] + item["summaryNotes"]]
        stats = [v["stats"] for v in records if v.get("stats")]
        self.assertIn("智力 + 14、物理防禦 + 93、魔法防禦 + 120", stats)
        effect = r"(?:力量|敏捷|智力|幸運|命中|物理防禦|魔法防禦|攻擊力|迴避|移動速度|跳躍力|HP|MP|全能力|可升級次數) [+-] \d+(?:\.\d+)?"
        for text in stats:
            self.assertRegex(text, rf"^{effect}(?:、{effect})*$")

    def test_shipped_source_typo_is_preserved(self):
        records = [o for d in self.data["drops"] for o in d["observations"] if o.get("rateText") == "0.0.9%"]
        self.assertEqual(len(records), 1)
        self.assertIsNone(records[0]["ratePercent"])
        self.assertEqual(records[0]["region"], "維多利亞")


if __name__ == "__main__":
    unittest.main()
