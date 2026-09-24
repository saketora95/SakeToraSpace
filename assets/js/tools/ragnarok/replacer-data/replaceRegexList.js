"use strict";
const firstLayerRegexRules = [
  // #region 角色判斷
  {
    "pattern": "(?P<indent>\\s*)(?P<value>\\d+) 레벨 이상인 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<value>\\p{Decimal_Number}+) 레벨 이상인 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}基本等級達 {value} 以上時，"
  },
  {
    "pattern": "(?P<indent>\\s*)베이스 레벨 (?P<value>\\d+)이상인 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)베이스 레벨 (?<value>\\p{Decimal_Number}+)이상인 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}基本等級達 {value} 以上時，"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<value>\\d+)레벨 이상인 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<value>\\p{Decimal_Number}+)레벨 이상인 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}基本等級達 {value} 以上時，"
  },
  {
    "pattern": "(?P<indent>\\s*)베이스 레벨이 (?P<value>\\d+) 이상인 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)베이스 레벨이 (?<value>\\p{Decimal_Number}+) 이상인 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}基本等級達 {value} 以上時，"
  },
  {
    "pattern": "(?P<indent>\\s*)순수 (?P<status>.+?)가 (?P<value>\\d+) 이상인 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)순수 (?<status>[^\\n]+?)가 (?<value>\\p{Decimal_Number}+) 이상인 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}純粹 {status} 達 {value} 以上時，"
  },
  {
    "pattern": "(?P<indent>\\s*)순수 (?P<status>.+?)이 (?P<value>\\d+) 이상인 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)순수 (?<status>[^\\n]+?)이 (?<value>\\p{Decimal_Number}+) 이상인 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}純粹 {status} 達 {value} 以上時，"
  },
  {
    "pattern": "(?P<indent>\\s*)순수 (?P<status>.+?) (?P<value>\\d+) 이상인 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)순수 (?<status>[^\\n]+?) (?<value>\\p{Decimal_Number}+) 이상인 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}純粹 {status} 達 {value} 以上時，"
  },
  // #endregion
  // #region 精煉判斷
  {
    "pattern": "(?P<indent>\\s*)무기 (?P<value>\\d+)제련 당\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)무기 (?<value>\\p{Decimal_Number}+)제련 당[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}武器精煉值每 +{value:>2} 時，"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<value>\\d+)\\s*제련 당\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<value>\\p{Decimal_Number}+)[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*제련 당[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}精煉值每 +{value:>2} 時，"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<value>\\d+)\\s*제련 당,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<value>\\p{Decimal_Number}+)[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*제련 당,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}精煉值每 +{value:>2} 時，"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<value>\\d+)제련 시,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<value>\\p{Decimal_Number}+)제련 시,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}精煉值達 +{value:>2} 以上時，"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<value>\\d+)제련 이상인 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<value>\\p{Decimal_Number}+)제련 이상인 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}精煉值達 +{value:>2} 以上時，"
  },
  {
    "pattern": "(?P<indent>\\s*)무기가 (?P<value>\\d+)제련 이상인 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)무기가 (?<value>\\p{Decimal_Number}+)제련 이상인 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}武器精煉值達 +{value:>2} 以上時，"
  },
  {
    "pattern": "(?P<indent>\\s*)갑옷이 (?P<value>\\d+)제련 이상인 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)갑옷이 (?<value>\\p{Decimal_Number}+)제련 이상인 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}鎧甲精煉值達 +{value:>2} 以上時，"
  },
  // #endregion
  // #region 階級判斷
  {
    "pattern": "(?P<indent>\\s*)(?P<grade_level>.+?)등급 이상일 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<grade_level>[^\\n]+?)등급 이상일 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}階級達 {grade_level} 以上時，"
  },
  {
    "pattern": "(?P<indent>\\s*)무기의 등급이 (?P<grade_level>.+?)등급 이상인 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)무기의 등급이 (?<grade_level>[^\\n]+?)등급 이상인 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}武器階級達 {grade_level} 以上時，"
  },
  // #endregion
  // #region 套裝判斷
  {
    "pattern": "(?P<indent>\\s*)(?P<equip>.+?)와 함께 장착시,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<equip>[^\\n]+?)와 함께 장착시,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}同時裝備「{equip}」時，"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<equip>.+?)와 함께 장착 시,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<equip>[^\\n]+?)와 함께 장착 시,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}同時裝備「{equip}」時，"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<equip>.+?)과 함께 장착 시,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<equip>[^\\n]+?)과 함께 장착 시,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}同時裝備「{equip}」時，"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<equip_1>.+?), (?P<equip_2>.+?)와 함께 장착 시,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<equip_1>[^\\n]+?), (?<equip_2>[^\\n]+?)와 함께 장착 시,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}同時裝備「{equip_1}」與「{equip_2}」時，"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<equip_1>.+?), (?P<equip_2>.+?), (?P<equip_3>.+?)와 함께 장착 시,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<equip_1>[^\\n]+?), (?<equip_2>[^\\n]+?), (?<equip_3>[^\\n]+?)와 함께 장착 시,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}同時裝備「{equip_1}」、「{equip_2}」與「{equip_3}」時，"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<equip_1>.+?), (?P<equip_2>.+?), (?P<equip_3>.+?), (?P<equip_4>.+?)와 함께 장착 시,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<equip_1>[^\\n]+?), (?<equip_2>[^\\n]+?), (?<equip_3>[^\\n]+?), (?<equip_4>[^\\n]+?)와 함께 장착 시,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}同時裝備「{equip_1}」、「{equip_2}」、「{equip_3}」與「{equip_4}」時，"
  },
  {
    "pattern": "(?P<indent>\\s*)장착한 (?P<equip_1>.+?), (?P<equip_2>.+?)의 등급이 각 (?P<grade_level>.+?)등급 이상일 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)장착한 (?<equip_1>[^\\n]+?), (?<equip_2>[^\\n]+?)의 등급이 각 (?<grade_level>[^\\n]+?)등급 이상일 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}同時裝備「{equip_1}」與「{equip_2}」且階級均達 {grade_level} 階級以上時，"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<series_name>.+?)의 \\((?P<series_detail>.+?)\\)의 각 등급이 (?P<grade_level>.+?)등급 이상인 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<series_name>[^\\n]+?)의 \\((?<series_detail>[^\\n]+?)\\)의 각 등급이 (?<grade_level>[^\\n]+?)등급 이상인 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}{series_name}系列裝備 ({series_detail}) 的階級均達 {grade_level} 階級以上時，"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<equip_1>.+?), (?P<equip_2>.+?)의 제련도 합이 (?P<refine_level>.+?) 이상이며, 각 (?P<grade_level>.+?)등급 이상이고,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<equip_1>[^\\n]+?), (?<equip_2>[^\\n]+?)의 제련도 합이 (?<refine_level>[^\\n]+?) 이상이며, 각 (?<grade_level>[^\\n]+?)등급 이상이고,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}同時裝備「{equip_1}」與「{equip_2}」、合計精煉值達 {refine_level} 且階級均達 {grade_level} 階級以上時，"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<equip_1>.+?), (?P<equip_2>.+?), (?P<equip_3>.+?)의 제련도 합이 (?P<refine_level>.+?) 이상이며, 각 (?P<grade_level>.+?)등급 이상이고,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<equip_1>[^\\n]+?), (?<equip_2>[^\\n]+?), (?<equip_3>[^\\n]+?)의 제련도 합이 (?<refine_level>[^\\n]+?) 이상이며, 각 (?<grade_level>[^\\n]+?)등급 이상이고,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}同時裝備「{equip_1}」、「{equip_2}」與「{equip_3}」、合計精煉值達 {refine_level} 且階級均達 {grade_level} 階級以上時，"
  },
  // #endregion
  // #region 其他判斷
  {
    "pattern": "(?P<indent>\\s*)(?P<level>.+?)레벨 무기인 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<level>[^\\n]+?)레벨 무기인 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}使用 {level} 級武器時，"
  },
  {
    "pattern": "(?P<indent>\\s*)양손검, 양손창, 양손지팡이, 양손도끼, 카타르, 활, 풍마수리검, 총기 계열의 (?P<level>.+?)레벨 무기인 경우,\\s*",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)양손검, 양손창, 양손지팡이, 양손도끼, 카타르, 활, 풍마수리검, 총기 계열의 (?<level>[^\\n]+?)레벨 무기인 경우,[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*",
    "replacement": "{indent}使用雙手劍、雙手槍、雙手杖、雙手斧、拳刃、弓、風魔飛鏢與槍械系列的 {level} 級武器時，"
  },
  // #endregion
  // #region 體型傷害
  {
    "pattern": "(?P<indent>\\s*)모든 크기 적에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 크기 적에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有體型敵人的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 크기의 적에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 크기의 적에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有體型敵人的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 크기의 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 크기의 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有體型敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 크기의 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 크기의 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有體型敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)소형 기의 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)소형 기의 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對小型體型敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)소형 기의 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)소형 기의 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對小型體型敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)중형 기의 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)중형 기의 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對中型體型敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)중형 기의 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)중형 기의 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對中型體型敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)대형 기의 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)대형 기의 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對大型體型敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)대형 기의 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)대형 기의 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對大型體型敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)소형 몬스터에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)소형 몬스터에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對小型體型魔物的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)소형 몬스터에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)소형 몬스터에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對小型體型魔物的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)중형 몬스터에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)중형 몬스터에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對中型體型魔物的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)중형 몬스터에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)중형 몬스터에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對中型體型魔物的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)대형 몬스터에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)대형 몬스터에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對大型體型魔物的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)대형 몬스터에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)대형 몬스터에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對大型體型魔物的魔法傷害 + {value}"
  },
  // #endregion
  // #region 對屬性敵人傷害
  {
    "pattern": "(?P<indent>\\s*)모든 속성 적에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 속성 적에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有屬性敵人的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 속성의 적에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 속성의 적에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有屬性敵人的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 속성 몬스터에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 속성 몬스터에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有屬性魔物的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 속성 몬스터에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 속성 몬스터에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有屬性魔物的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 속성 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 속성 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有屬性敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 속성 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 속성 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有屬性敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 속성의 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 속성의 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有屬性敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 속성의 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 속성의 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有屬性敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)무속성 적에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)무속성 적에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對無屬性敵人的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)무속성 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)무속성 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對無屬性敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)무속성 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)무속성 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對無屬性敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)화속성 적에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화속성 적에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對火屬性敵人的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)화속성 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화속성 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對火屬性敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)화속성 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화속성 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對火屬性敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)수속성 적에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)수속성 적에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對水屬性敵人的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)수속성 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)수속성 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對水屬性敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)수속성 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)수속성 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對水屬性敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)풍속성 적에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)풍속성 적에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對風屬性敵人的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)풍속성 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)풍속성 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對風屬性敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)풍속성 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)풍속성 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對風屬性敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)지속성 적에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)지속성 적에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對地屬性敵人的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)지속성 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)지속성 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對地屬性敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)지속성 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)지속성 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對地屬性敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)독속성 적에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)독속성 적에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對毒屬性敵人的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)독속성 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)독속성 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對毒屬性敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)독속성 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)독속성 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對毒屬性敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)성속성 적에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)성속성 적에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對聖屬性敵人的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)성속성 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)성속성 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對聖屬性敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)성속성 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)성속성 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對聖屬性敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)암속성 적에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)암속성 적에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對暗屬性敵人的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)암속성 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)암속성 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對暗屬性敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)암속성 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)암속성 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對暗屬性敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)염속성 적에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)염속성 적에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對念屬性敵人的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)염속성 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)염속성 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對念屬性敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)염속성 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)염속성 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對念屬性敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)불사속성 적에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)불사속성 적에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對不死屬性敵人的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)불사속성 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)불사속성 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對不死屬性敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)불사속성 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)불사속성 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對不死屬性敵人的魔法傷害 + {value}"
  },
  // #endregion
  // #region 種族傷害
  {
    "pattern": "(?P<indent>\\s*)모든 종족 몬스터에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가\\(플레이어 제외\\)",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 종족 몬스터에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가\\(플레이어 제외\\)",
    "replacement": "{indent}對所有種族魔物的物理與魔法傷害 + {value} (不包含玩家)"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 종족 몬스터에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가\\(플레이어 제외\\)",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 종족 몬스터에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가\\(플레이어 제외\\)",
    "replacement": "{indent}對所有種族魔物的物理傷害 + {value} (不包含玩家)"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 종족 몬스터에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가\\(플레이어 제외\\)",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 종족 몬스터에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가\\(플레이어 제외\\)",
    "replacement": "{indent}對所有種族魔物的魔法傷害 + {value} (不包含玩家)"
  },
  // #endregion
  // #region 階級傷害
  {
    "pattern": "(?P<indent>\\s*)일반형 적 및 보스형 몬스터에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)일반형 적 및 보스형 몬스터에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對一般階級與 Boss 階級魔物的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)일반형 적, 보스형 몬스터에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)일반형 적, 보스형 몬스터에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對一般階級與 Boss 階級魔物的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)일반형 적 및 보스형 몬스터에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)일반형 적 및 보스형 몬스터에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對一般階級與 Boss 階級魔物的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)일반형 적 및 보스형 몬스터에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)일반형 적 및 보스형 몬스터에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對一般階級與 Boss 階級魔物的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)일반형 몬스터에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)일반형 몬스터에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對一般階級魔物的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)일반형 몬스터에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)일반형 몬스터에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對一般階級魔物的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)일반형 몬스터에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)일반형 몬스터에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對一般階級魔物的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)보스형 몬스터에게 주는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)보스형 몬스터에게 주는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對 Boss 階級魔物的物理與魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)보스형 몬스터에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)보스형 몬스터에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對 Boss 階級魔物的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)보스형 몬스터에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)보스형 몬스터에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對 Boss 階級魔物的魔法傷害 + {value}"
  },
  // #endregion
  // #region 近 / 遠 / 暴擊 / 命中
  {
    "pattern": "(?P<indent>\\s*)근접 및 원거리 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)근접 및 원거리 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}近距離與遠距離物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)근접/원거리 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)근접/원거리 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}近距離與遠距離物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)근접 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)근접 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}近距離物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)원거리 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)원거리 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}遠距離物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)크리티컬 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)크리티컬 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}暴擊傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)크리티컬 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)크리티컬 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}暴擊傷害 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)명중 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)명중 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}命中物理傷害 + {value}"
  },
  // #endregion
  // #region 屬性法傷
  {
    "pattern": "(?P<indent>\\s*)모든 속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}所有屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)무속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)무속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}無屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)화속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}火屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)수속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)수속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}水屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)풍속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)풍속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}風屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)지속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)지속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}地屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)독속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)독속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}毒屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)성속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)성속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}聖屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)암속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)암속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}暗屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)염속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)염속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}念屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)불사속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)불사속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}不死屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)화, 무속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화, 무속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}火與無屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)수, 풍, 지속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)수, 풍, 지속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}水、風與地屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)화, 무, 성속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화, 무, 성속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}火、無與聖屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)화, 독, 암, 무속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가.",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화, 독, 암, 무속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가.",
    "replacement": "{indent}火、毒、暗與無屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)풍, 암, 염, 불사속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가.",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)풍, 암, 염, 불사속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가.",
    "replacement": "{indent}風、暗、念與不死屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)수, 풍, 지, 화, 독, 암, 무속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)수, 풍, 지, 화, 독, 암, 무속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}水、風、地、火、毒、暗與無屬性的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)화, 무, 성, 풍, 암, 염, 불사속성 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화, 무, 성, 풍, 암, 염, 불사속성 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}火、無、聖、風、暗、念與不死屬性的魔法傷害 + {value}"
  },
  // #endregion
  // #region 複合傷害
  {
    "pattern": "(?P<indent>\\s*)모든 크기 및 속성의 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 크기 및 속성의 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有體型與所有屬性敵人的物理與魔法傷害 + {value}"
  },
  // #endregion
  // #region 功能
  {
    "pattern": "(?P<indent>\\s*)몬스터 사냥 시 얻는 경험치 \\+ (?P<value>.+?)",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)몬스터 사냥 시 얻는 경험치 \\+ (?<value>[^\\n]+?)",
    "replacement": "{indent}打倒魔物獲得的經驗值 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)고정 캐스팅 (?P<value>.+?)초 (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)고정 캐스팅 (?<value>[^\\n]+?)초 (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}固定詠唱時間 - {value} 秒"
  },
  {
    "pattern": "(?P<indent>\\s*)파괴 불가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)파괴 불가",
    "replacement": "{indent}不會被破壞"
  },
  {
    "pattern": "(?P<indent>\\s*)스킬 사용 시 소모 SP (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)스킬 사용 시 소모 SP (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}施展技能的 SP 消耗 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)공격속도 (?:추가\\s*)?증가\\(공격 후 딜레이 (?P<value>.+?) (?:추가\\s*)?감소\\)",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)공격속도 (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가\\(공격 후 딜레이 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소\\)",
    "replacement": "{indent}攻擊速度增加 (攻擊後延遲 - {value})"
  },
  {
    "pattern": "(?P<indent>\\s*)공격 속도 (?:추가\\s*)?증가\\(공격 후 딜레이 (?P<value>.+?) (?:추가\\s*)?감소\\)",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)공격 속도 (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가\\(공격 후 딜레이 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소\\)",
    "replacement": "{indent}攻擊速度增加 (攻擊後延遲 - {value})"
  },
  {
    "pattern": "(?P<indent>\\s*)글로벌 쿨타임 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)글로벌 쿨타임 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}共通技能後延遲 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)글로벌 쿨타임 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)글로벌 쿨타임 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}共通技能後延遲 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)변동 캐스팅 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)변동 캐스팅 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}變動詠唱時間 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)변동 캐스팅 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)변동 캐스팅 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}變動詠唱時間 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)유도 공격 확률 \\+ (?P<value>.+?)",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)유도 공격 확률 \\+ (?<value>[^\\n]+?)",
    "replacement": "{indent}誘導攻擊機率 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)유도 공격 확률 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)유도 공격 확률 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}誘導攻擊機率 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)근접 물리 데미지 (?P<value_1>.+?), 유도 공격 확률 (?P<value_2>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)근접 물리 데미지 (?<value_1>[^\\n]+?), 유도 공격 확률 (?<value_2>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}近距離物理傷害 + {value_1}、誘導攻擊機率 + {value_2}"
  },
  {
    "pattern": "(?P<indent>\\s*)원거리 물리 데미지 (?P<value_1>.+?), 유도 공격 확률 (?P<value_2>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)원거리 물리 데미지 (?<value_1>[^\\n]+?), 유도 공격 확률 (?<value_2>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}遠距離物理傷害 + {value_1}、誘導攻擊機率 + {value_2}"
  },
  // #endregion
  // #region 自動詠唱
  {
    "pattern": "(?P<indent>\\s*)(?P<skill_1>.+?) 사용 시 (?P<skill_2>.+?)가 배운 최대 레벨로 추가 발동\\((?P<skill_3>.+?)를 1레벨 이상 배운 경우 발동됩니다\\)",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<skill_1>[^\\n]+?) 사용 시 (?<skill_2>[^\\n]+?)가 배운 최대 레벨로 추가 발동\\((?<skill_3>[^\\n]+?)를 1레벨 이상 배운 경우 발동됩니다\\)",
    "replacement": "{indent}施展{skill_1}時自動詠唱已習得最高等級的{skill_2} ({skill_3}習得 1 等級以上時才會發動)"
  },
  {
    "pattern": "(?P<indent>\\s*)일반 근접 물리 공격 시, (?P<value_1>.+?) 확률로 (?P<skill_1>.+?)우 (?P<level_1>.+?)레벨 발동",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)일반 근접 물리 공격 시, (?<value_1>[^\\n]+?) 확률로 (?<skill_1>[^\\n]+?)우 (?<level_1>[^\\n]+?)레벨 발동",
    "replacement": "{indent}一般近距離物理攻擊時，有 {value_1} 的機率自動詠唱等級 {level_1} 的 {skill_1}"
  },
  {
    "pattern": "(?P<indent>\\s*)일반 근접 물리 공격 시, (?P<value_1>.+?) 확률로 (?P<skill_1>.+?)우 (?P<level_1>.+?)레벨 발동, (?P<value_2>.+?) 확률로 (?P<skill_2>.+?) (?P<level_2>.+?)레벨 발동",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)일반 근접 물리 공격 시, (?<value_1>[^\\n]+?) 확률로 (?<skill_1>[^\\n]+?)우 (?<level_1>[^\\n]+?)레벨 발동, (?<value_2>[^\\n]+?) 확률로 (?<skill_2>[^\\n]+?) (?<level_2>[^\\n]+?)레벨 발동",
    "replacement": "{indent}一般近距離物理攻擊時，有 {value_1} 的機率自動詠唱等級 {level_1} 的 {skill_1}、{value_2} 的機率自動詠唱等級 {level_2} 的 {skill_2}"
  },
  // #endregion
  // #region 體型抗性
  {
    "pattern": "(?P<indent>\\s*)모든 크기 적에게 받는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 크기 적에게 받는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自所有體型敵人的物理與魔法傷害 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 크기 적에게 받는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 크기 적에게 받는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自所有體型敵人的物理傷害 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 크기 적에게 받는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 크기 적에게 받는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自所有體型敵人的魔法傷害 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)중형, 대형 적에게 받는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)중형, 대형 적에게 받는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自中型與大型體型敵人的物理與魔法傷害 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)중형, 대형 적에게 받는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)중형, 대형 적에게 받는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自中型與大型體型敵人的物理傷害 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)중형, 대형 적에게 받는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)중형, 대형 적에게 받는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自中型與大型體型敵人的魔法傷害 - {value}"
  },
  // #endregion
  // #region 對屬性抗性
  {
    "pattern": "(?P<indent>\\s*)무속성 공격에 대한 내성 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)무속성 공격에 대한 내성 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對無屬性的抗性 + {value}"
  },
  // #endregion
  // #region 對屬性敵人抗性
  {
    "pattern": "(?P<indent>\\s*)모든 속성 적에게 받는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 속성 적에게 받는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自所有屬性敵人的物理與魔法傷害 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 속성 적에게 받는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 속성 적에게 받는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自所有屬性敵人的物理傷害 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 속성 적에게 받는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 속성 적에게 받는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自所有屬性敵人的魔法傷害 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)화속성 적에게 받는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화속성 적에게 받는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自火屬性敵人的物理與魔法傷害 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)화속성 적에게 받는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화속성 적에게 받는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自火屬性敵人的物理傷害 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)화속성 적에게 받는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화속성 적에게 받는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自火屬性敵人的魔法傷害 - {value}"
  },
  // #endregion
  // #region 種族抗性
  {
    "pattern": "(?P<indent>\\s*)무형 몬스터에게 받는 물리/마법 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)무형 몬스터에게 받는 물리/마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自無形種族魔物的物理與魔法傷害 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)무형 몬스터에게 받는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)무형 몬스터에게 받는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自無形種族魔物的物理傷害 - {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)무형 몬스터에게 받는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)무형 몬스터에게 받는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?감소",
    "replacement": "{indent}來自無形種族魔物的魔法傷害 - {value}"
  },
  // #endregion
  // #region 階級抗性
  // #endregion
  // #region 雜項
  {
    "pattern": "(?P<indent>\\s*)모든 크기 및 속성 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 크기 및 속성 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有體型與所有屬性敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)모든 크기 및 속성 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)모든 크기 및 속성 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對所有體型與所有屬性敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)제련도 합의 (?P<value>.+?)배만큼 (?P<skill>.+?) 데미지 % (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)제련도 합의 (?<value>[^\\n]+?)배만큼 (?<skill>[^\\n]+?) 데미지 % (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}{skill}的傷害 + (精煉值合計 * {value})%"
  },
  {
    "pattern": "(?P<indent>\\s*)화속성 적, 무형 몬스터에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화속성 적, 무형 몬스터에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對火屬性敵人與無形種族魔物的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)화속성 적, 무형 몬스터에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화속성 적, 무형 몬스터에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對火屬性敵人與無形種族魔物的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)화속성 적, 무형 몬스터, 중형, 대형 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화속성 적, 무형 몬스터, 중형, 대형 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對火屬性敵人、無形種族魔物、中型與大型體型敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)화속성 적, 무형 몬스터, 중형, 대형 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)화속성 적, 무형 몬스터, 중형, 대형 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對火屬性敵人、無形種族魔物、中型與大型體型敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)중형, 대형 적에게 주는 물리 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)중형, 대형 적에게 주는 물리 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對中型與大型體型敵人的物理傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)중형, 대형 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)중형, 대형 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對中型與大型體型敵人的魔法傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)중형, 대형 적에게 주는 마법 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)중형, 대형 적에게 주는 마법 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}對中型與大型體型敵人的魔法傷害 + {value}"
  },
  // #endregion
];
// #region Second Layer Regex
const secondLayerRegexRules = [
  {
    "pattern": "(?P<indent>\\s*)(?P<skill>.+?) 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<skill>[^\\n]+?) 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}{skill}的傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<skill>.+?) 데미지 (?P<value>.+?) (?:추가\\s*)?증가",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<skill>[^\\n]+?) 데미지 (?<value>[^\\n]+?) (?:추가[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)?증가",
    "replacement": "{indent}{skill}的傷害 + {value}"
  },
  {
    "pattern": "(?P<indent>\\s*)(?P<skill>.+?) 스킬 쿨타임 (?P<value>.+?)초 감소",
    "browserPattern": "(?<indent>[\\t-\\r\\x1c-\\x20\\x85\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]*)(?<skill>[^\\n]+?) 스킬 쿨타임 (?<value>[^\\n]+?)초 감소",
    "replacement": "{indent}{skill}的冷卻時間 - {value} 秒"
  },
];
// #endregion
