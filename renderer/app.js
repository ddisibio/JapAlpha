"use strict";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const state = {
  view: "practice", // "practice" | "quiz"
  mode: "hiragana",
  pool: [],
  index: 0,
  current: null,
  answered: false,
  score: 0,
  total: 0,
  streak: 0,
};

const KANA_GROUPS = () =>
  $$("input[data-kana]:checked").map((i) => i.dataset.kana);

const kanjiFilter = { source: "grade", levels: new Set([1]) };

function answerText(item) {
  return state.mode === "kanji" ? item.m.slice(0, 2).join(", ") : item.a;
}

function buildPool() {
  if (state.mode === "kanji") {
    const key = kanjiFilter.source === "grade" ? "g" : "j";
    state.pool = window.KANJI_DATA.filter((k) =>
      kanjiFilter.levels.has(k[key]),
    );
  } else {
    const groups = new Set(KANA_GROUPS());
    state.pool = window.KANA_DATA[state.mode].filter((k) => groups.has(k.g));
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickDistractors(correct, count) {
  const correctText = answerText(correct);
  const firstMeaning = correct.m ? correct.m[0] : null;
  const picked = [];
  const seen = new Set([correctText]);
  for (const item of shuffle([...state.pool])) {
    if (item === correct) continue;
    const text = answerText(item);
    if (seen.has(text)) continue;
    // Avoid kanji distractors that share the primary meaning.
    if (firstMeaning && item.m && item.m[0] === firstMeaning) continue;
    seen.add(text);
    picked.push(item);
    if (picked.length === count) break;
  }
  return picked;
}

// Kana covering the kanji itself: kun readings mark okurigana with "." or "-",
// so take the segment the kanji carries; fall back to first on'yomi.
function primaryReading(item) {
  const src = item.kun[0] || item.on[0] || "";
  return src.split(/[.-]/).filter(Boolean)[0] || src;
}

function nextQuestion() {
  buildPool();
  state.answered = false;
  $("#hint").textContent = "";
  $("#hint").className = "";

  if (state.pool.length < 2) {
    state.current = null;
    $("#prompt").textContent = "—";
    $("#choices").innerHTML =
      '<p style="grid-column:1/-1;color:var(--muted);text-align:center">Select at least two items to quiz.</p>';
    return;
  }

  let item = state.pool[Math.floor(Math.random() * state.pool.length)];
  if (state.pool.length > 1) {
    while (item === state.current) {
      item = state.pool[Math.floor(Math.random() * state.pool.length)];
    }
  }
  state.current = item;

  if (state.mode === "kanji") {
    const furi = primaryReading(item);
    $("#prompt").innerHTML = furi
      ? `<ruby><rb>${item.k}</rb><rt>${furi}</rt></ruby>`
      : item.k;
  } else {
    $("#prompt").textContent = item.k;
  }
  renderChoices(item);
}

function renderChoices(correct) {
  const n = Math.min(8, state.pool.length);
  const options = shuffle([correct, ...pickDistractors(correct, n - 1)]);
  const box = $("#choices");
  box.innerHTML = "";
  for (const opt of options) {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.textContent = answerText(opt);
    btn.addEventListener("click", () => answer(opt, btn));
    box.appendChild(btn);
  }
}

function answer(opt, btn) {
  if (state.answered) return;
  state.answered = true;
  state.total++;

  const correct = opt === state.current;
  const hint = $("#hint");

  if (correct) {
    state.score++;
    state.streak++;
    btn.classList.add("correct");
    hint.className = "correct";
    hint.textContent = "Correct!";
  } else {
    state.streak = 0;
    btn.classList.add("wrong");
    hint.className = "wrong";
    hint.textContent = `Answer: ${answerText(state.current)}`;
  }

  $$(".choice").forEach((b) => {
    b.disabled = true;
    if (b.textContent === answerText(state.current)) b.classList.add("correct");
    else if (b !== btn || correct) b.classList.add("dim");
  });

  if (state.mode === "kanji") {
    const k = state.current;
    const readings = [
      k.on.length ? `On: ${k.on.join("、")}` : "",
      k.kun.length ? `Kun: ${k.kun.join("、")}` : "",
    ]
      .filter(Boolean)
      .join("　");
    hint.textContent += ` — ${k.m.join(", ")}${
      readings ? "　|　" + readings : ""
    }`;
  }

  updateStatus();
  const q = state.current;
  setTimeout(
    () => {
      if (state.view === "quiz" && state.answered && state.current === q)
        nextQuestion();
    },
    correct ? 1200 : 2400,
  );
}

// ---- Practice mode ----

// Character -> romaji lookup built from the kana tables (includes yōon
// digraphs like きゃ, so longest-match handles them correctly).
const ROMAJI = new Map();
for (const list of Object.values(window.KANA_DATA))
  for (const { k, a } of list) if (!ROMAJI.has(k)) ROMAJI.set(k, a);

function kanaToRomaji(str) {
  let out = "";
  let gem = false; // small-tsu doubles the next consonant
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === "っ" || c === "ッ") {
      gem = true;
      continue;
    }
    let r;
    const two = str.slice(i, i + 2);
    if (ROMAJI.has(two)) {
      r = ROMAJI.get(two);
      i++;
    } else {
      r = ROMAJI.get(c) || c; // keep okurigana markers (. -) as-is
    }
    if (gem && /^[a-z]/i.test(r)) {
      r = r[0] + r;
      gem = false;
    }
    out += r;
  }
  return out.replace(/oo|ou/g, "ō").replace(/uu/g, "ū");
}

function renderCard() {
  const n = state.pool.length;
  const charEl = $("#practice-char");
  const readingEl = $("#practice-reading");
  const meanEl = $("#practice-meaning");
  const readingsEl = $("#practice-readings");

  if (!n) {
    state.index = 0;
    charEl.textContent = "—";
    readingEl.textContent = "";
    meanEl.textContent = "Select at least one item to study.";
    readingsEl.textContent = "";
    updateStatus();
    return;
  }

  state.index = ((state.index % n) + n) % n;
  const item = state.pool[state.index];

  if (state.mode === "kanji") {
    const furi = primaryReading(item);
    charEl.innerHTML = furi
      ? `<ruby><rb>${item.k}</rb><rt>${furi}</rt></ruby>`
      : item.k;
    readingEl.textContent = "";
    meanEl.textContent = item.m.join(", ");
    readingsEl.innerHTML = "";
    for (const [label, list] of [
      ["Kun", item.kun],
      ["On", item.on],
    ]) {
      if (!list.length) continue;
      const line = document.createElement("div");
      line.className = "reading-line";
      line.innerHTML =
        `<span class="reading-label">${label}:</span> ` +
        list
          .map((r) => `${r} <span class="romaji">(${kanaToRomaji(r)})</span>`)
          .join("、");
      readingsEl.appendChild(line);
    }
  } else {
    charEl.textContent = item.k;
    readingEl.textContent = item.a;
    meanEl.textContent = "";
    readingsEl.textContent = "";
  }
  updateStatus();
}

function resetPractice() {
  buildPool();
  state.index = 0;
  renderCard();
}

function refresh() {
  if (state.view === "quiz") nextQuestion();
  else resetPractice();
}

function updateStatus() {
  const el = $("#score");
  if (state.view === "practice") {
    el.textContent = state.pool.length
      ? `Card ${state.index + 1} / ${state.pool.length}`
      : "No items selected";
  } else {
    el.innerHTML = `Score: ${state.score} / ${state.total} &nbsp;·&nbsp; Streak: ${state.streak}`;
  }
}

function buildKanjiLevels() {
  const box = $("#kanji-levels");
  box.innerHTML = "";
  const key = kanjiFilter.source === "grade" ? "g" : "j";
  const order =
    kanjiFilter.source === "grade" ? [1, 2, 3, 4, 5, 6] : [5, 4, 3, 2, 1];

  for (const value of order) {
    const count = window.KANJI_DATA.filter((k) => k[key] === value).length;
    const lab = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = value;
    cb.checked = kanjiFilter.levels.has(value);
    cb.addEventListener("change", () => {
      cb.checked
        ? kanjiFilter.levels.add(value)
        : kanjiFilter.levels.delete(value);
      refresh();
    });
    lab.appendChild(cb);
    lab.append(
      `${
        kanjiFilter.source === "grade" ? `Grade ${value}` : `N${value}`
      } (${count})`,
    );
    box.appendChild(lab);
  }
}

function setMode(mode) {
  state.mode = mode;
  $$(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.mode === mode),
  );
  $("#kana-filters").classList.toggle("hidden", mode === "kanji");
  $("#kanji-filters").classList.toggle("hidden", mode !== "kanji");
  refresh();
}

function setView(view) {
  state.view = view;
  $$(".view-tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.view === view),
  );
  $("#practice-view").classList.toggle("hidden", view !== "practice");
  $("#quiz-view").classList.toggle("hidden", view !== "quiz");
  refresh();
}

$$(".view-tab").forEach((t) =>
  t.addEventListener("click", () => setView(t.dataset.view)),
);
$$(".tab").forEach((t) =>
  t.addEventListener("click", () => setMode(t.dataset.mode)),
);
$$("input[data-kana]").forEach((cb) => cb.addEventListener("change", refresh));
$("#kanji-source").addEventListener("change", (e) => {
  kanjiFilter.source = e.target.value;
  kanjiFilter.levels = new Set([e.target.value === "grade" ? 1 : 5]);
  buildKanjiLevels();
  refresh();
});
$("#skip").addEventListener("click", nextQuestion);

// ---- Settings (theme + UI scale) ----

const THEME_KEY = "japalpha-theme";
const SCALE_KEY = "japalpha-scale";
const COLORFUL_KEY = "japalpha-colorful";

const themeSel = $("#theme-select");
themeSel.value = document.documentElement.dataset.theme;
if (!themeSel.value) {
  // Stored value didn't match an option — fall back to default.
  document.documentElement.dataset.theme = "default";
  themeSel.value = "default";
}
themeSel.addEventListener("change", (e) => {
  document.documentElement.dataset.theme = e.target.value;
  localStorage.setItem(THEME_KEY, e.target.value);
});

const scaleSel = $("#scale-select");
scaleSel.value =
  localStorage.getItem(SCALE_KEY) ||
  document.documentElement.style.getPropertyValue("--ui-scale") ||
  "1";
if (!scaleSel.value) scaleSel.value = "1";
scaleSel.addEventListener("change", (e) => {
  document.documentElement.style.setProperty("--ui-scale", e.target.value);
  localStorage.setItem(SCALE_KEY, e.target.value);
});

const colorfulCheck = $("#colorful-check");
colorfulCheck.checked =
  (document.documentElement.dataset.colorful || "0") === "1";
colorfulCheck.addEventListener("change", () => {
  const v = colorfulCheck.checked ? "1" : "0";
  document.documentElement.dataset.colorful = v;
  localStorage.setItem(COLORFUL_KEY, v);
});

const settingsWrap = $("#settings-wrap");
$("#settings-btn").addEventListener("click", () =>
  $("#settings-panel").classList.toggle("hidden"),
);
document.addEventListener("click", (e) => {
  if (!settingsWrap.contains(e.target))
    $("#settings-panel").classList.add("hidden");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") $("#settings-panel").classList.add("hidden");
});

$("#practice-prev").addEventListener("click", () => {
  state.index--;
  renderCard();
});
$("#practice-next").addEventListener("click", () => {
  state.index++;
  renderCard();
});
$("#practice-shuffle").addEventListener("click", () => {
  shuffle(state.pool);
  state.index = 0;
  renderCard();
});
document.addEventListener("keydown", (e) => {
  if (state.view !== "practice") return;
  if (e.target.closest("select, input")) return;
  if (!$("#settings-panel").classList.contains("hidden")) return;
  if (e.key === "ArrowLeft") {
    state.index--;
    renderCard();
  } else if (e.key === "ArrowRight") {
    state.index++;
    renderCard();
  }
});

buildKanjiLevels();
refresh();
