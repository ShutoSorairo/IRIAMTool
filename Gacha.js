// --- 変数・初期化 ---
let lastResults = [];
let lastDrawCount = 0;

const STORAGE_KEY = 'iriam_gacha_v3';
const OLD_STORAGE_KEY = 'iriam_gacha_v2';
const DEFAULT_COLORS = ["#9e9e9e","#4caf50","#03a9f4","#ff9800","#e91e63"];

// store: 全ガチャ + 共通の参加者名
// config: 現在選択中のガチャ（store.gachas の要素への参照）
let store = null;
let config = null;

function newGachaId() {
    return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function createGacha(title) {
    const g = {
        id: newGachaId(),
        title: title || "マイガチャ",
        rarities: [
            { name: "N",   rate: 50, color: DEFAULT_COLORS[0] },
            { name: "R",   rate: 30, color: DEFAULT_COLORS[1] },
            { name: "SR",  rate: 15, color: DEFAULT_COLORS[2] },
            { name: "SSR", rate: 4,  color: DEFAULT_COLORS[3] },
            { name: "UR",  rate: 1,  color: DEFAULT_COLORS[4] }
        ],
        prizes: [],
        history: []
    };
    for (let i = 0; i < 10; i++) g.prizes.push({ name: "景品 " + (i + 1), rarityIndex: 0 });
    return g;
}

// 旧形式（ガチャ1種類）や欠けたデータを現在の形式に揃える
function normalizeGacha(g) {
    g = Object.assign({ title: "マイガチャ", rarities: [], prizes: [], history: [] }, g);
    if (!g.id) g.id = newGachaId();
    if (!Array.isArray(g.rarities) || g.rarities.length === 0) g.rarities = createGacha().rarities;
    g.rarities.forEach((r, i) => { if (!r.color) r.color = DEFAULT_COLORS[i % 5]; });
    if (!Array.isArray(g.prizes) || g.prizes.length === 0) g.prizes = createGacha().prizes;
    if (!Array.isArray(g.history)) g.history = [];
    delete g.names;
    delete g.updatedAt;
    return g;
}

function normalizeStore(data) {
    if (data && Array.isArray(data.gachas) && data.gachas.length > 0) {
        const s = {
            names: Array.isArray(data.names) ? data.names : [],
            gachas: data.gachas.map(normalizeGacha),
            activeId: data.activeId
        };
        if (!s.gachas.some(g => g.id === s.activeId)) s.activeId = s.gachas[0].id;
        return s;
    }
    if (data && Array.isArray(data.rarities)) {
        // v2（ガチャ1種類）からの移行
        const g = normalizeGacha(data);
        return { names: Array.isArray(data.names) ? data.names : [], gachas: [g], activeId: g.id };
    }
    const g = createGacha();
    return { names: [], gachas: [g], activeId: g.id };
}

// Gacha-firebase.js から参照する（let 変数は window に載らないため関数経由で渡す）
function getGachaStore() { return store; }

window.onload = function() {
    if (!localStorage.getItem('iriam_uid')) loadData();
    // ログイン中はGacha-firebase.jsがFirestoreから読み込んでloadData()を呼ぶ
};

// --- セクション開閉 ---
function toggleSection(id, headerEl) {
    const el = document.getElementById(id);
    if (el.style.display === 'none') {
        el.style.display = 'block';
        headerEl.classList.remove('closed');
    } else {
        el.style.display = 'none';
        headerEl.classList.add('closed');
    }
}

// --- データ保存・読み込み ---
function readLocal() {
    try {
        const v3 = localStorage.getItem(STORAGE_KEY);
        if (v3) return JSON.parse(v3);
        const v2 = localStorage.getItem(OLD_STORAGE_KEY);
        if (v2) return JSON.parse(v2);
    } catch (e) {
        console.warn('ガチャデータの読み込みに失敗:', e);
    }
    return null;
}

// data を渡すとそれを採用（Firestoreからの読み込み用）、省略時は localStorage から
function loadData(data) {
    store = normalizeStore(data !== undefined ? data : readLocal());
    config = store.gachas.find(g => g.id === store.activeId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    renderAll();
}

function renderAll() {
    document.getElementById('gacha-title').value = config.title;
    document.getElementById('rarity-count').value = config.rarities.length;
    renderGachaSelect();
    renderRarityTable();
    renderPrizeTable();
    renderNameList();
    renderNameSelect();
    renderHistory();
    clearResult();
}

function saveData() {
    if (!store) return;
    config.title = document.getElementById('gacha-title').value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    renderGachaSelect();
}

// --- ガチャ切り替え・作成・削除 ---
function renderGachaSelect() {
    const sel = document.getElementById('gacha-select');
    sel.innerHTML = '';
    store.gachas.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.title || '(名称未設定)';
        if (g.id === store.activeId) opt.selected = true;
        sel.appendChild(opt);
    });
    document.getElementById('gacha-count').textContent = store.gachas.length;
}

function switchGacha(id) {
    const g = store.gachas.find(x => x.id === id);
    if (!g) return;
    store.activeId = id;
    config = g;
    renderAll();
    saveData();
}

function addGacha() {
    const fallback = "ガチャ" + (store.gachas.length + 1);
    const title = prompt("新しいガチャの名前", fallback);
    if (title === null) return;
    const g = createGacha(title.trim() || fallback);
    store.gachas.push(g);
    switchGacha(g.id);
}

function duplicateGacha() {
    const fallback = config.title + " のコピー";
    const title = prompt("複製したガチャの名前", fallback);
    if (title === null) return;
    const g = JSON.parse(JSON.stringify(config));
    g.id = newGachaId();
    g.title = title.trim() || fallback;
    g.history = [];
    store.gachas.push(g);
    switchGacha(g.id);
}

function deleteGacha() {
    if (store.gachas.length <= 1) { alert("ガチャは最低1つ必要です"); return; }
    if (!confirm(`「${config.title}」を削除しますか？\n（景品・履歴もすべて消えます）`)) return;
    const id = config.id;
    const idx = store.gachas.findIndex(g => g.id === id);
    store.gachas.splice(idx, 1);
    window.onGachaDeleted?.(id);
    switchGacha(store.gachas[Math.max(0, idx - 1)].id);
}

// --- 名前登録 ---
function addName() {
    const input = document.getElementById('new-name-input');
    const name = input.value.trim();
    if (!name) return;
    if (store.names.includes(name)) { alert("すでに登録されています"); return; }
    store.names.push(name);
    input.value = '';
    saveData();
    renderNameList();
    renderNameSelect();
}

function deleteName(index) {
    store.names.splice(index, 1);
    saveData();
    renderNameList();
    renderNameSelect();
}

function clearAllNames() {
    if (!confirm("登録済みの名前をすべて削除しますか？")) return;
    store.names = [];
    saveData();
    renderNameList();
    renderNameSelect();
}

function renderNameList() {
    const container = document.getElementById('name-list-container');
    container.innerHTML = '';
    if (store.names.length === 0) {
        container.innerHTML = '<div style="color:#aaa; text-align:center; padding:10px;">登録された名前はありません</div>';
        return;
    }
    store.names.forEach((name, i) => {
        const div = document.createElement('div');
        div.className = 'name-item';
        div.innerHTML = `<span>${name}</span><button class="btn-red" style="font-size:0.8em; padding:3px 8px;" onclick="deleteName(${i})">削除</button>`;
        container.appendChild(div);
    });
}

function renderNameSelect() {
    const sel = document.getElementById('name-select');
    sel.innerHTML = '<option value="">-- 登録済みの名前 --</option>';
    store.names.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
    });
}

function selectName(val) {
    if (val) document.getElementById('user-name').value = val;
}

// --- レアリティ処理 ---
function updateRarityTable() {
    const count = parseInt(document.getElementById('rarity-count').value);
    if (count < 1) return;
    const currentLen = config.rarities.length;
    if (count > currentLen) {
        for (let i = currentLen; i < count; i++) {
            config.rarities.push({ name: "Rank" + (i + 1), rate: 0, color: DEFAULT_COLORS[i % 5] });
        }
    } else {
        config.rarities.splice(count);
    }
    saveData();
    renderRarityTable();
    renderPrizeTable();
    renderImportRaritySelect();
}

function renderRarityTable() {
    const tbody = document.getElementById('rarity-tbody');
    tbody.innerHTML = '';
    let total = 0;
    config.rarities.forEach((r, index) => {
        total += parseFloat(r.rate) || 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="table-input" value="${r.name}" oninput="updateRarityData(${index}, 'name', this.value)"></td>
            <td><input type="number" class="table-input" value="${r.rate}" oninput="updateRarityData(${index}, 'rate', this.value)"></td>
            <td><input type="color" value="${r.color}" onchange="updateRarityData(${index}, 'color', this.value)" style="width:40px; height:28px; border:none; cursor:pointer; background:none;"></td>
        `;
        tbody.appendChild(tr);
    });
    const totalEl = document.getElementById('total-prob');
    totalEl.textContent = total.toFixed(2);
    totalEl.style.color = Math.abs(total - 100) < 0.01 ? '#2e7d32' : '#d32f2f';
    renderImportRaritySelect();
}

function updateRarityData(index, field, value) {
    if (field === 'rate') value = parseFloat(value);
    config.rarities[index][field] = value;
    saveData();
    if (field === 'rate') renderRarityTable();
    if (field === 'name') { renderPrizeTable(); renderImportRaritySelect(); }
}

function clearResult() {
    lastResults = [];
    document.getElementById('result-area').innerHTML = '<div style="text-align:center; color:#ccc; padding:20px;">ここに結果が表示されます</div>';
    document.getElementById('copy-area').style.display = 'none';
}

// --- 景品処理 ---
function addPrize() {
    config.prizes.push({ name: "新規景品", rarityIndex: 0 });
    saveData();
    renderPrizeTable();
}

function deletePrize(index) {
    if (config.prizes.length <= 1) { alert("景品は最低1つ必要です"); return; }
    config.prizes.splice(index, 1);
    saveData();
    renderPrizeTable();
}

function renderPrizeTable() {
    const tbody = document.getElementById('prize-tbody');
    tbody.innerHTML = '';
    document.getElementById('prize-count-display').textContent = config.prizes.length;

    const rarityCounts = new Array(config.rarities.length).fill(0);
    config.prizes.forEach(p => { if (p.rarityIndex < config.rarities.length) rarityCounts[p.rarityIndex]++; });

    config.prizes.forEach((p, index) => {
        let options = '';
        config.rarities.forEach((r, rIdx) => {
            options += `<option value="${rIdx}" ${p.rarityIndex == rIdx ? 'selected' : ''}>${r.name}</option>`;
        });
        let individualRate = "0.00";
        if (p.rarityIndex < config.rarities.length && rarityCounts[p.rarityIndex] > 0) {
            individualRate = (config.rarities[p.rarityIndex].rate / rarityCounts[p.rarityIndex]).toFixed(2);
        }
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><select onchange="updatePrizeData(${index}, 'rarityIndex', this.value)">${options}</select></td>
            <td style="color:#666; font-size:0.9em;">${individualRate}%</td>
            <td><input type="text" class="table-input" value="${p.name}" oninput="updatePrizeData(${index}, 'name', this.value)" style="text-align:left;"></td>
            <td><button class="btn-red" onclick="deletePrize(${index})">削除</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function updatePrizeData(index, field, value) {
    if (field === 'rarityIndex') value = parseInt(value);
    config.prizes[index][field] = value;
    saveData();
    if (field === 'rarityIndex') renderPrizeTable();
}

// --- 一括インポート ---
function renderImportRaritySelect() {
    const sel = document.getElementById('import-rarity-select');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '';
    config.rarities.forEach((r, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = r.name;
        if (String(i) === String(current)) opt.selected = true;
        sel.appendChild(opt);
    });
}

function importPrizes() {
    const text = document.getElementById('import-textarea').value.trim();
    if (!text) { alert("景品名を入力してください"); return; }
    const rarityIndex = parseInt(document.getElementById('import-rarity-select').value);
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    lines.forEach(name => {
        config.prizes.push({ name, rarityIndex });
    });
    document.getElementById('import-textarea').value = '';
    saveData();
    renderPrizeTable();
    alert(`${lines.length}件の景品を追加しました`);
}

// --- ガチャロジック ---
function drawCustom() {
    const count = parseInt(document.getElementById('custom-draw-count').value);
    drawGacha(count);
}

function drawGacha(times) {
    let totalRate = config.rarities.reduce((sum, r) => sum + (parseFloat(r.rate) || 0), 0);
    if (Math.abs(totalRate - 100) > 0.1) {
        alert("合計確率が100%になっていません。(現在: " + totalRate.toFixed(2) + "%)");
        return;
    }
    if (config.prizes.length === 0) { alert("景品が設定されていません。"); return; }

    const prizesByRarity = [];
    config.rarities.forEach(() => prizesByRarity.push([]));
    config.prizes.forEach(p => { if (prizesByRarity[p.rarityIndex]) prizesByRarity[p.rarityIndex].push(p); });

    const results = [];
    for (let i = 0; i < times; i++) {
        const rand = Math.random() * 100;
        let current = 0, rIdx = -1;
        for (let r = 0; r < config.rarities.length; r++) {
            current += config.rarities[r].rate;
            if (rand < current) { rIdx = r; break; }
        }
        if (rIdx === -1) rIdx = config.rarities.length - 1;
        const list = prizesByRarity[rIdx];
        if (list && list.length > 0) {
            const prize = list[Math.floor(Math.random() * list.length)];
            results.push({ rName: config.rarities[rIdx].name, rIdx, color: config.rarities[rIdx].color, name: prize.name });
        } else {
            results.push({ rName: config.rarities[rIdx].name, rIdx, color: config.rarities[rIdx].color, name: "(空)" });
        }
    }

    lastResults = results;
    lastDrawCount = times;

    const userName = document.getElementById('user-name').value || "名無し";
    const date = new Date().toLocaleString();

    // 結果表示（グリッド）
    let html = `<div style="padding:10px; border-bottom:1px solid #ddd; margin-bottom:10px; background:#f9f9f9; text-align:center;">
        <strong>${userName}</strong> さんの結果 (${times}回) <br><span style="font-size:0.8em; color:#888;">${date}</span>
    </div>`;

    if (times >= 4) {
        html += '<div class="result-grid">';
        results.forEach((r, idx) => {
            html += `<div class="result-grid-item">
                <span style="font-size:0.75em; color:#aaa;">${idx + 1}</span>
                <span class="rarity-badge" style="background:${r.color};">${r.rName}</span>
                <span style="font-size:0.9em; font-weight:bold;">${r.name}</span>
            </div>`;
        });
        html += '</div>';
    } else {
        results.forEach((r, idx) => {
            html += `<div class="result-item">
                <span style="color:#aaa; font-size:0.8em; margin-right:10px; width:25px;">${idx + 1}</span>
                <span class="rarity-badge" style="background:${r.color};">${r.rName}</span>
                <span style="font-weight:bold;">${r.name}</span>
            </div>`;
        });
    }

    document.getElementById('result-area').innerHTML = html;
    document.getElementById('copy-area').style.display = 'block';

    // 名前をリセット
    document.getElementById('user-name').value = '';
    document.getElementById('name-select').value = '';

    // 履歴に保存
    config.history.unshift({ userName, date, times, results });
    if (config.history.length > 100) config.history.pop();
    saveData();
    renderHistory();
}

// --- 履歴 ---
function renderHistory() {
    const container = document.getElementById('history-container');
    if (!config.history || config.history.length === 0) {
        container.innerHTML = '<div style="color:#aaa; text-align:center; padding:10px;">履歴はありません</div>';
        return;
    }
    container.innerHTML = '';
    config.history.forEach((h, hi) => {
        const summary = new Map();
        h.results.forEach(r => {
            if (summary.has(r.name)) summary.get(r.name).count++;
            else summary.set(r.name, { ...r, count: 1 });
        });
        const sorted = Array.from(summary.values()).sort((a, b) => b.rIdx - a.rIdx);

        const div = document.createElement('div');
        div.style = 'border:1px solid #eee; border-radius:6px; margin-bottom:10px; overflow:hidden;';
        let itemsHtml = sorted.map(item =>
            `<span class="rarity-badge" style="background:${item.color};">${item.rName}</span> ${item.name}${item.count > 1 ? ` x${item.count}` : ''}`
        ).join('<br>');
        div.innerHTML = `
            <div style="background:#f5f5f5; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                <span><strong>${h.userName}</strong> (${h.times}回) <span style="font-size:0.8em; color:#888;">${h.date}</span></span>
                <button class="btn-red" style="font-size:0.8em; padding:3px 8px;" onclick="deleteHistory(${hi})">削除</button>
            </div>
            <div style="padding:10px 12px; font-size:0.9em; line-height:2;">${itemsHtml}</div>
        `;
        container.appendChild(div);
    });
}

function deleteHistory(index) {
    config.history.splice(index, 1);
    saveData();
    renderHistory();
}

function clearHistory() {
    if (!confirm("履歴をすべて削除しますか？")) return;
    config.history = [];
    saveData();
    renderHistory();
}

// --- コピー機能 ---
function copyResult() {
    if (lastResults.length === 0) return;
    const userName = document.getElementById('user-name').value || lastResults._user || "名無し";
    const title = config.title;
    const summary = new Map();
    lastResults.forEach(r => {
        if (summary.has(r.name)) summary.get(r.name).count++;
        else summary.set(r.name, { ...r, count: 1 });
    });
    const sortedItems = Array.from(summary.values()).sort((a, b) => b.rIdx - a.rIdx);
    let text = `【${title}】${lastDrawCount}回\n`;
    sortedItems.forEach(item => {
        const countStr = item.count > 1 ? ` x${item.count}` : "";
        text += `[${item.rName}] ${item.name}${countStr}\n`;
    });
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => alert("コピーしました！(高レア順)"));
    } else {
        alert("このブラウザでは対応していません");
    }
}

// --- リセット ---
function resetAll() {
    if (!confirm("すべてのガチャと参加者名を削除して初期化しますか？")) return;
    store.gachas.forEach(g => window.onGachaDeleted?.(g.id));
    localStorage.removeItem(OLD_STORAGE_KEY);
    const g = createGacha();
    store = { names: [], gachas: [g], activeId: g.id };
    config = g;
    renderAll();
    saveData();
}
