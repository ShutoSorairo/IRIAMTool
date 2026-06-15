// --- 変数・初期化 ---
let lastResults = [];
let lastDrawCount = 0;

let config = {
    title: "マイガチャ",
    rarities: [
        { name: "N",   rate: 50, color: "#9e9e9e" },
        { name: "R",   rate: 30, color: "#4caf50" },
        { name: "SR",  rate: 15, color: "#03a9f4" },
        { name: "SSR", rate: 4,  color: "#ff9800" },
        { name: "UR",  rate: 1,  color: "#e91e63" }
    ],
    prizes: [],
    names: [],
    history: []
};

window.onload = function() { loadData(); };

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
function loadData() {
    const stored = localStorage.getItem('iriam_gacha_v2');
    if (stored) {
        const parsed = JSON.parse(stored);
        config = Object.assign({ names: [], history: [] }, parsed);
        // 旧データに color がない場合の補完
        config.rarities.forEach((r, i) => {
            if (!r.color) r.color = ["#9e9e9e","#4caf50","#03a9f4","#ff9800","#e91e63"][i % 5];
        });
        document.getElementById('gacha-title').value = config.title;
        document.getElementById('rarity-count').value = config.rarities.length;
        if (config.prizes.length === 0) initPrizes(10);
    } else {
        initPrizes(10);
    }
    renderRarityTable();
    renderPrizeTable();
    renderNameList();
    renderNameSelect();
    renderHistory();
}

function saveData() {
    config.title = document.getElementById('gacha-title').value;
    localStorage.setItem('iriam_gacha_v2', JSON.stringify(config));
}

function initPrizes(count) {
    config.prizes = [];
    for (let i = 0; i < count; i++) {
        config.prizes.push({ name: "景品 " + (i + 1), rarityIndex: 0 });
    }
    saveData();
}

// --- 名前登録 ---
function addName() {
    const input = document.getElementById('new-name-input');
    const name = input.value.trim();
    if (!name) return;
    if (config.names.includes(name)) { alert("すでに登録されています"); return; }
    config.names.push(name);
    input.value = '';
    saveData();
    renderNameList();
    renderNameSelect();
}

function deleteName(index) {
    config.names.splice(index, 1);
    saveData();
    renderNameList();
    renderNameSelect();
}

function clearAllNames() {
    if (!confirm("登録済みの名前をすべて削除しますか？")) return;
    config.names = [];
    saveData();
    renderNameList();
    renderNameSelect();
}

function renderNameList() {
    const container = document.getElementById('name-list-container');
    container.innerHTML = '';
    if (config.names.length === 0) {
        container.innerHTML = '<div style="color:#aaa; text-align:center; padding:10px;">登録された名前はありません</div>';
        return;
    }
    config.names.forEach((name, i) => {
        const div = document.createElement('div');
        div.className = 'name-item';
        div.innerHTML = `<span>${name}</span><button class="btn-red" style="font-size:0.8em; padding:3px 8px;" onclick="deleteName(${i})">削除</button>`;
        container.appendChild(div);
    });
}

function renderNameSelect() {
    const sel = document.getElementById('name-select');
    sel.innerHTML = '<option value="">-- 登録済みの名前 --</option>';
    config.names.forEach(name => {
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
    const defaultColors = ["#9e9e9e","#4caf50","#03a9f4","#ff9800","#e91e63"];
    if (count > currentLen) {
        for (let i = currentLen; i < count; i++) {
            config.rarities.push({ name: "Rank" + (i + 1), rate: 0, color: defaultColors[i % 5] });
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
    if (confirm("全データを削除して初期化しますか？")) {
        localStorage.removeItem('iriam_gacha_v2');
        location.reload();
    }
}
