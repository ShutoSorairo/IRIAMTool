const $ = id => document.getElementById(id);

// === DOM ===
const gachaNameEl = $('gacha-name');
const decimalPlacesEl = $('decimal-places');
const raritySettingsEl = $('rarity-settings');
const addRarityBtn = $('add-rarity');
const addItemBtn = $('add-item');
const autoFillBtn = $('auto-fill');
const itemSettingsEl = $('item-settings');
const totalRateEl = $('total-rate');
const userNameEl = $('user-name');
const drawCountEl = $('draw-count');
const detailedChk = $('detailed-result');
const drawBtn = $('draw-btn');
const drawTenBtn = $('draw-ten');
const resultSummaryEl = $('result-summary');
const resultDetailsEl = $('result-details');
const historyEl = $('history');
const historySummaryEl = $('history-summary');
const clearHistoryBtn = $('clear-history');
const exportCsvBtn = $('export-csv');
const saveBtn = $('save-btn');
const loadFileEl = $('load-file');
const loadBtn = $('load-btn');

let rarities = [
  { id: genId(), name: "UR",  color: "#ff66cc", rate: 1 },
  { id: genId(), name: "SSR", color: "#ffd700", rate: 4 },
  { id: genId(), name: "SR",  color: "#b388ff", rate: 10 },
  { id: genId(), name: "R",   color: "#6fa8dc", rate: 25 },
  { id: genId(), name: "C",   color: "#b0b0b0", rate: 60 }
];

let items = [
  { id: genId(), no: 1, name: "伝説の剣", rarityId: rarities[0].id },
  { id: genId(), no: 2, name: "金の盾",   rarityId: rarities[1].id },
  { id: genId(), no: 3, name: "木の棒",   rarityId: rarities[2].id }
];

let history = [];
const STORAGE_KEY = "highspec_gacha_v3"; // 既存キーを維持

// ===== 小数点桁数ユーティリティ =====
function getDp() {
  const v = Number(decimalPlacesEl?.value ?? 2);
  return Math.max(0, Math.min(6, Number.isFinite(v) ? v : 2));
}
function roundDp(n, dp = getDp()) {
  return Number((Number(n) || 0).toFixed(dp));
}
function fmtDp(n, dp = getDp()) {
  return (Number(n) || 0).toFixed(dp);
}

// 最大剰余法で合計100に揃える
function normalizeTo100(values, dp = getDp()) {
  const scale = Math.pow(10, dp);
  const raw = values.map(v => (Number(v) || 0));
  const sum = raw.reduce((s, x) => s + x, 0);
  if (sum <= 0) return raw.map(_ => 0);
  const target = raw.map(v => (v / sum) * 100);
  const floored = target.map(t => Math.floor(t * scale));
  let rest = 100 * scale - floored.reduce((s, x) => s + x, 0);
  const rema = target.map((t, i) => ({ i, frac: (t * scale) - floored[i] }));
  rema.sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < rest; k++) floored[rema[k].i] += 1;
  return floored.map(x => x / scale);
}

// ===== 初期化 =====
init();
function init() {
  loadFromStorage();
  bindEvents();
  renderAll();
}

function bindEvents() {
  addRarityBtn.addEventListener("click", onAddRarity);
  addItemBtn.addEventListener("click", onAddItem);
  autoFillBtn.addEventListener("click", autoFillSampleItems);

  drawBtn.addEventListener("click", onDraw);
  drawTenBtn.addEventListener("click", () => { drawCountEl.value = 10; onDraw(); });

  // 100連
  const hundredBtn = document.createElement("button");
  hundredBtn.textContent = "100連";
  hundredBtn.className = "btn accent";
  drawBtn.parentNode.appendChild(hundredBtn);
  hundredBtn.addEventListener("click", () => { drawCountEl.value = 100; onDraw(); });

  // 結果コピー
  const copyBtn = document.createElement("button");
  copyBtn.textContent = "結果をコピー";
  copyBtn.className = "btn";
  resultSummaryEl.parentNode.appendChild(copyBtn);
  copyBtn.addEventListener("click", copyResultText);

  // 履歴クリア
  clearHistoryBtn.addEventListener("click", clearHistory);

  // 小数点桁数 変更で再描画＆保存
  if (decimalPlacesEl) {
    const h = () => { saveToStorage(); renderAll(); };
    decimalPlacesEl.addEventListener('input', h);
    decimalPlacesEl.addEventListener('change', h);
  }

  // （任意）保存/読込ボタンを使う場合はここでイベント追加
  if (saveBtn)  saveBtn.addEventListener("click", onSaveJson);
  if (loadBtn)  loadBtn.addEventListener("click", onLoadJson);
}

// ===== レンダリング =====
function renderAll() {
  renderRarities();
  renderItems();
  renderTotalRate();
  renderHistory();
  renderHistorySummary();
}

// レアリティ設定
function renderRarities() {
  const dp = getDp();
  raritySettingsEl.innerHTML = "";
  rarities.forEach(r => {
    const div = document.createElement("div");
    div.className = "row-rarity";
    div.innerHTML = `
      <div class="color-sample" style="background:${r.color}"></div>
      <input type="text"  class="rarity-name small" value="${r.name}">
      <input type="number" step="${1 / Math.pow(10, dp)}" class="rarity-rate small" value="${fmtDp(r.rate, dp)}" style="width:80px;">%
      <input type="color" class="rarity-color small" value="${r.color}">
      <button class="btn small del-rarity">削除</button>
    `;
    raritySettingsEl.appendChild(div);

    div.querySelector(".rarity-name").oninput  = e => { r.name = e.target.value; saveToStorage(); };
    div.querySelector(".rarity-color").oninput = e => { r.color = e.target.value; saveToStorage(); renderRarities(); };
    div.querySelector(".rarity-rate").oninput  = e => { r.rate = Number(e.target.value); renderTotalRate(); saveToStorage(); };
    div.querySelector(".del-rarity").onclick   = () => {
      if (!confirm("このレアリティを削除しますか？")) return;
      items.forEach(i => { if (i.rarityId === r.id) i.rarityId = null; });
      rarities = rarities.filter(x => x !== r);
      saveToStorage();
      renderAll();
    };
  });

  // 正規化ボタン
  const normalizeBtn = document.createElement("button");
  normalizeBtn.textContent = "確率を100%に正規化";
  normalizeBtn.className = "btn";
  normalizeBtn.onclick = normalizeRarityRatesStrict;
  raritySettingsEl.appendChild(normalizeBtn);
}

function normalizeRarityRatesStrict() {
  const dp = getDp();
  const current = rarities.map(r => Number(r.rate) || 0);
  const normalized = normalizeTo100(current, dp);
  normalized.forEach((v, i) => { rarities[i].rate = v; });
  saveToStorage();
  renderRarities();
  renderTotalRate();
  alert(`レアリティ確率を ${dp} 桁で100%に正規化しました。`);
}

function renderTotalRate() {
  const dp = getDp();
  const total = rarities.reduce((s, r) => s + (Number(r.rate) || 0), 0);
  const totalText = fmtDp(total, dp);
  totalRateEl.textContent = `レアリティ合計：${totalText}%`;
  totalRateEl.classList.toggle("warning", totalText !== fmtDp(100, dp));
}

// 景品設定
function renderItems() {
  itemSettingsEl.innerHTML = "";
  items.sort((a, b) => (a.no || 0) - (b.no || 0));
  items.forEach(it => {
    const rarityOptions = rarities.map(r =>
      `<option value="${r.id}" ${r.id === it.rarityId ? "selected" : ""}>${r.name}</option>`
    ).join("");
    const div = document.createElement("div");
    div.className = "row-item";
    div.innerHTML = `
      <input type="number" class="item-no small" value="${it.no}" style="width:60px;">
      <input type="text"   class="item-name small" value="${it.name}" style="flex:1;">
      <select class="item-rarity small">${rarityOptions}</select>
      <button class="btn small del-item">削除</button>
    `;
    itemSettingsEl.appendChild(div);

    div.querySelector(".item-no").oninput     = e => { it.no = Number(e.target.value); saveToStorage(); };
    div.querySelector(".item-name").oninput   = e => { it.name = e.target.value; saveToStorage(); };
    div.querySelector(".item-rarity").onchange= e => { it.rarityId = e.target.value; saveToStorage(); };
    div.querySelector(".del-item").onclick    = () => {
      items = items.filter(x => x !== it);
      saveToStorage();
      renderItems();
    };
  });
}

// ===== 抽選 =====
function onDraw() {
  const count = Math.max(1, Number(drawCountEl.value) || 1);
  const totalRate = rarities.reduce((s, r) => s + (Number(r.rate) || 0), 0);
  if (totalRate <= 0) return alert("レアリティの確率を設定してください。");

  const results = [];
  for (let i = 0; i < count; i++) {
    const rarity = pickRarity();
    const pool = items.filter(it => it.rarityId === rarity.id);
    const chosen = pool.length ? pool[Math.floor(Math.random() * pool.length)]
                               : { name: "（該当景品なし）", rarityId: rarity.id };
    results.push(chosen);
  }

  // 集計
  const summary = {};
  results.forEach(r => summary[r.name] = (summary[r.name] || 0) + 1);

  // 表示
  let summaryText = "";
  const readable = Object.entries(summary).map(([name, c]) => {
    const rarity = rarities.find(r => r.id === (items.find(i => i.name === name) || {}).rarityId) || { name: "未設定" };
    summaryText += `${rarity.name} ${name} ×${c}\n`;
    return { name, rarityName: rarity.name, count: c };
  });

  resultSummaryEl.innerHTML = `<div>合計 ${count} 回の結果：</div>`;
  resultDetailsEl.innerHTML = `
    <table class="result-table">
      <tr><th>レアリティ</th><th>景品名</th><th>個数</th></tr>
      ${readable.map(r => `<tr><td>${r.rarityName}</td><td>${r.name}</td><td>${r.count}</td></tr>`).join('')}
    </table>
  `;

  // 詳細カード（UR/SSR/SR/R/Cクラスを付与）
  if (detailedChk.checked) {
    const grid = document.createElement("div");
    grid.className = "result-grid";
    results.forEach(r => {
      const rarityObj = rarities.find(rr => rr.id === r.rarityId);
      const cls = rarityObj ? rarityObj.name.toLowerCase() : "default"; // ur/ssr/sr/r/c
      const card = document.createElement("div");
      card.className = `result-card ${cls}`;
      card.textContent = r.name;
      grid.appendChild(card);
    });
    resultDetailsEl.appendChild(grid);
  }

  // ===== ここから：抽選者とガチャ名を保持し、コピー文にも反映 =====
  const user = (userNameEl?.value || "").trim() || "名無し";
  const gachaName = (gachaNameEl?.value || "").trim() || "ガチャ";
  const copyText =
    `【${gachaName}結果】\n` +
    `引いた人：${user}\n` +
    `回数：${count}回\n\n` +
    summaryText.trim();

  history.unshift({
    id: genId(),
    timestamp: new Date().toISOString(),
    user,
    gachaName,
    count,
    summary: summaryText.trim()
  });
  saveToStorage();
  renderHistory();
  renderHistorySummary();

  // クリップボード用文字列を保存
  window._lastResultCopy = copyText;
}

function pickRarity() {
  const total = rarities.reduce((s, r) => s + (Number(r.rate) || 0), 0);
  let rnd = Math.random() * total;
  for (let r of rarities) {
    rnd -= (Number(r.rate) || 0);
    if (rnd <= 0) return r;
  }
  return rarities[rarities.length - 1];
}

// ===== コピー・履歴 =====
function copyResultText() {
  if (!window._lastResultCopy) return alert("結果がありません。");
  navigator.clipboard.writeText(window._lastResultCopy).then(() => alert("結果をコピーしました！"));
}

function clearHistory() {
  if (!confirm("履歴を削除しますか？")) return;
  history = [];
  saveToStorage();
  renderHistory();
  renderHistorySummary();
}

function renderHistory() {
  historyEl.innerHTML = history.map(h => {
    const time = new Date(h.timestamp).toLocaleString();
    return `
      <div class="history-item">
        <strong>${h.gachaName || "ガチャ"}</strong>（${time}）<br>
        引いた人：${h.user || "名無し"} ／ ${h.count || "?"}回<br>
        ${h.summary.replace(/\n/g, '<br>')}
      </div>
    `;
  }).join('') || '履歴なし';
}

function renderHistorySummary() {
  historySummaryEl.innerHTML = `<div class="summary-box">履歴件数：${history.length}</div>`;
}

// ===== 保存/復元 =====
function saveToStorage() {
  const payload = {
    rarities, items, history,
    meta: { decimalPlaces: getDp() }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const obj = JSON.parse(raw);
    if (obj.rarities) rarities = obj.rarities;
    if (obj.items)    items    = obj.items;
    if (obj.history)  history  = obj.history;
    if (obj.meta && typeof obj.meta.decimalPlaces !== 'undefined' && decimalPlacesEl) {
      decimalPlacesEl.value = obj.meta.decimalPlaces;
    }
  } catch (e) {
    console.warn('復元失敗', e);
  }
}

// ===== その他 =====
function genId() { return "id_" + Math.random().toString(36).slice(2, 9); }
function autoFillSampleItems() { alert("サンプル機能は省略"); }
function onAddRarity() {
  rarities.push({ id: genId(), name: "新レア", color: "#cccccc", rate: 0 });
  saveToStorage(); renderRarities();
}
function onAddItem() {
  items.push({ id: genId(), no: items.length + 1, name: "新アイテム", rarityId: rarities[0]?.id || null });
  saveToStorage(); renderItems();
}
