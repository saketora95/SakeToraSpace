"use strict";

// Canonical job order for the gear summaries, following the frontier gear article.
// Each entry lists the names the data files use for that job; 阿利緹亞 is also written as 德魯伊.
(() => {
  const order = [
    ["盧恩龍爵"], ["帝國聖衛軍"], ["樞機主教"], ["聖裁者"], ["禁咒魔導士"], ["元素支配者"],
    ["機甲神匠"], ["生命締造者"], ["風鷹狩獵者"], ["天籟頌者 & 樂之舞靈"], ["十字影武"], ["深淵追跡者"],
    ["天帝"], ["契靈士"], ["夜行使"], ["流浪忍者 & 疾風忍者"], ["終極初學者"], ["魂靈師"],
    ["阿利緹亞", "德魯伊"],
  ];
  const rank = job => {
    const index = order.findIndex(names => names.some(name => job.includes(name)));
    return index < 0 ? order.length : index;
  };
  window.ragnarokJobRank = rank;
})();
