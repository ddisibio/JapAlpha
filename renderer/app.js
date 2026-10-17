"use strict";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const state = {
  mode: "hiragana",
  pool: [],
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
      kanjiFilter.levels.has(k[key])
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
      '<p style="grid-column:1/-1;color:#a9a9c0;text-align:center">Select at least two items to quiz.</p>';
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
  const n = Math.min(4, state.pool.length);
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

  updateScore();
  const q = state.current;
  setTimeout(
    () => {
      if (state.answered && state.current === q) nextQuestion();
    },
    correct ? 1200 : 2400
  );
}

function updateScore() {
  $(
    "#score"
  ).innerHTML = `Score: ${state.score} / ${state.total} &nbsp;·&nbsp; Streak: ${state.streak}`;
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
      nextQuestion();
    });
    lab.appendChild(cb);
    lab.append(
      `${
        kanjiFilter.source === "grade" ? `Grade ${value}` : `N${value}`
      } (${count})`
    );
    box.appendChild(lab);
  }
}

function setMode(mode) {
  state.mode = mode;
  $$(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.mode === mode)
  );
  $("#kana-filters").classList.toggle("hidden", mode === "kanji");
  $("#kanji-filters").classList.toggle("hidden", mode !== "kanji");
  nextQuestion();
}

$$(".tab").forEach((t) =>
  t.addEventListener("click", () => setMode(t.dataset.mode))
);
$$("input[data-kana]").forEach((cb) =>
  cb.addEventListener("change", nextQuestion)
);
$("#kanji-source").addEventListener("change", (e) => {
  kanjiFilter.source = e.target.value;
  kanjiFilter.levels = new Set([e.target.value === "grade" ? 1 : 5]);
  buildKanjiLevels();
  nextQuestion();
});
$("#skip").addEventListener("click", nextQuestion);

buildKanjiLevels();
nextQuestion();
