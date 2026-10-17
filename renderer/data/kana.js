// Kana tables: [character, romaji, group]
// groups: basic | dakuten (incl. handakuten) | yoon
const HIRA_ROWS = [
  ["あ","a","basic"],["い","i","basic"],["う","u","basic"],["え","e","basic"],["お","o","basic"],
  ["か","ka","basic"],["き","ki","basic"],["く","ku","basic"],["け","ke","basic"],["こ","ko","basic"],
  ["さ","sa","basic"],["し","shi","basic"],["す","su","basic"],["せ","se","basic"],["そ","so","basic"],
  ["た","ta","basic"],["ち","chi","basic"],["つ","tsu","basic"],["て","te","basic"],["と","to","basic"],
  ["な","na","basic"],["に","ni","basic"],["ぬ","nu","basic"],["ね","ne","basic"],["の","no","basic"],
  ["は","ha","basic"],["ひ","hi","basic"],["ふ","fu","basic"],["へ","he","basic"],["ほ","ho","basic"],
  ["ま","ma","basic"],["み","mi","basic"],["む","mu","basic"],["め","me","basic"],["も","mo","basic"],
  ["や","ya","basic"],["ゆ","yu","basic"],["よ","yo","basic"],
  ["ら","ra","basic"],["り","ri","basic"],["る","ru","basic"],["れ","re","basic"],["ろ","ro","basic"],
  ["わ","wa","basic"],["を","wo","basic"],["ん","n","basic"],
  ["が","ga","dakuten"],["ぎ","gi","dakuten"],["ぐ","gu","dakuten"],["げ","ge","dakuten"],["ご","go","dakuten"],
  ["ざ","za","dakuten"],["じ","ji","dakuten"],["ず","zu","dakuten"],["ぜ","ze","dakuten"],["ぞ","zo","dakuten"],
  ["だ","da","dakuten"],["ぢ","ji","dakuten"],["づ","zu","dakuten"],["で","de","dakuten"],["ど","do","dakuten"],
  ["ば","ba","dakuten"],["び","bi","dakuten"],["ぶ","bu","dakuten"],["べ","be","dakuten"],["ぼ","bo","dakuten"],
  ["ぱ","pa","dakuten"],["ぴ","pi","dakuten"],["ぷ","pu","dakuten"],["ぺ","pe","dakuten"],["ぽ","po","dakuten"],
  ["きゃ","kya","yoon"],["きゅ","kyu","yoon"],["きょ","kyo","yoon"],
  ["しゃ","sha","yoon"],["しゅ","shu","yoon"],["しょ","sho","yoon"],
  ["ちゃ","cha","yoon"],["ちゅ","chu","yoon"],["ちょ","cho","yoon"],
  ["にゃ","nya","yoon"],["にゅ","nyu","yoon"],["にょ","nyo","yoon"],
  ["ひゃ","hya","yoon"],["ひゅ","hyu","yoon"],["ひょ","hyo","yoon"],
  ["みゃ","mya","yoon"],["みゅ","myu","yoon"],["みょ","myo","yoon"],
  ["りゃ","rya","yoon"],["りゅ","ryu","yoon"],["りょ","ryo","yoon"],
  ["ぎゃ","gya","yoon"],["ぎゅ","gyu","yoon"],["ぎょ","gyo","yoon"],
  ["じゃ","ja","yoon"],["じゅ","ju","yoon"],["じょ","jo","yoon"],
  ["ぢゃ","ja","yoon"],["ぢゅ","ju","yoon"],["ぢょ","jo","yoon"],
  ["びゃ","bya","yoon"],["びゅ","byu","yoon"],["びょ","byo","yoon"],
  ["ぴゃ","pya","yoon"],["ぴゅ","pyu","yoon"],["ぴょ","pyo","yoon"],
];

// Build katakana by converting each hiragana entry.
function hiraToKata(str) {
  return [...str].map((c) => String.fromCharCode(c.charCodeAt(0) + 0x60)).join("");
}

window.KANA_DATA = {
  hiragana: HIRA_ROWS.map(([ch, romaji, group]) => ({ k: ch, a: romaji, g: group })),
  katakana: HIRA_ROWS.map(([ch, romaji, group]) => ({ k: hiraToKata(ch), a: romaji, g: group })),
};
