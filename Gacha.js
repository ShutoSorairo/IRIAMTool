// --- 変数・初期化 ---
let lastResults = [];
let lastDrawCount = 0;

let config = {
    title: "マイガチャ",
    rarities: [
        { name: "N", rate: 50 },
        { name: "R", rate: 30 },
        { name: "SR", rate: 15 },
        { name: "SSR", rate: 4 },
        { name: "UR", rate: 1 }
    ],
    prizes: []
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
    const stored = localStorage.getItem('iriam_highspec_gacha');
    if (stored) {
        config = JSON.parse(stored);
        document.getElementById('gacha-title').value = config.title;
        document.getElementById('rarity-count').value = config.rarities.length;
        if(config.prizes.length === 0) initPrizes(10);
    } else {
        initPrizes(10); 
    }
    renderRarityTable();
    renderPrizeTable();
}

function saveData() {
    config.title = document.getElementById('gacha-title').value;
    localStorage.setItem('iriam_highspec_gacha', JSON.stringify(config));
}

function initPrizes(count) {
    config.prizes = [];
    for(let i=0; i<count; i++) {
        config.prizes.push({ name: "景品 " + (i+1), rarityIndex: 0 });
    }
    saveData();
}

// --- レアリティ処理 ---
function updateRarityTable() {
    const count = parseInt(document.getElementById('rarity-count').value);
    if (count < 1) return;
    const currentLen = config.rarities.length;
    if (count > currentLen) {
        for (let i = currentLen; i < count; i++) {
            config.rarities.push({ name: "Rank"+(i+1), rate: 0 });
        }
    } else if (count < currentLen) {
        config.rarities.splice(count);
    }
    saveData();
    renderRarityTable();
    renderPrizeTable();
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
            <td><span class="rarity-badge bg-${index % 5}">Color</span></td>
        `;
        tbody.appendChild(tr);
    });
    const totalEl = document.getElementById('total-prob');
    totalEl.textContent = total.toFixed(2);
    totalEl.style.color = Math.abs(total - 100) < 0.01 ? '#2e7d32' : '#d32f2f';
}

function updateRarityData(index, field, value) {
    if (field === 'rate') value = parseFloat(value);
    config.rarities[index][field] = value;
    saveData();
    if(field === 'rate') renderRarityTable();
    if(field === 'name') renderPrizeTable();
}

// --- 景品処理 ---
function addPrize() {
    config.prizes.push({ name: "新規景品", rarityIndex: 0 });
    saveData();
    renderPrizeTable();
}

function deletePrize(index) {
    if(config.prizes.length <= 1) {
        alert("景品は最低1つ必要です");
        return;
    }
    config.prizes.splice(index, 1);
    saveData();
    renderPrizeTable();
}

function renderPrizeTable() {
    const tbody = document.getElementById('prize-tbody');
    tbody.innerHTML = '';
    document.getElementById('prize-count-display').textContent = config.prizes.length;

    const rarityCounts = new Array(config.rarities.length).fill(0);
    config.prizes.forEach(p => {
        if(p.rarityIndex < config.rarities.length) rarityCounts[p.rarityIndex]++;
    });

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

// --- ガチャロジック ---
function drawCustom() {
    const count = parseInt(document.getElementById('custom-draw-count').value);
    drawGacha(count);
}

function drawGacha(times) {
    let totalRate = config.rarities.reduce((sum, r) => sum + (parseFloat(r.rate)||0), 0);
    if (Math.abs(totalRate - 100) > 0.1) {
        alert("合計確率が100%になっていません。(現在: " + totalRate.toFixed(2) + "%)");
        return;
    }
    if (config.prizes.length === 0) {
        alert("景品が設定されていません。");
        return;
    }

    const prizesByRarity = [];
    config.rarities.forEach(() => prizesByRarity.push([]));
    config.prizes.forEach(p => {
        if(prizesByRarity[p.rarityIndex]) prizesByRarity[p.rarityIndex].push(p);
    });

    const results = [];
    for(let i=0; i<times; i++) {
        const rand = Math.random() * 100;
        let current = 0;
        let rIdx = -1;
        for(let r=0; r<config.rarities.length; r++) {
            current += config.rarities[r].rate;
            if (rand < current) { rIdx = r; break; }
        }
        if(rIdx === -1) rIdx = config.rarities.length - 1;

        const list = prizesByRarity[rIdx];
        if (list && list.length > 0) {
            const prize = list[Math.floor(Math.random() * list.length)];
            results.push({ rName: config.rarities[rIdx].name, rIdx: rIdx, name: prize.name });
        } else {
            results.push({ rName: config.rarities[rIdx].name, rIdx: rIdx, name: "(空)" });
        }
    }

    lastResults = results;
    lastDrawCount = times;

    // 結果表示
    let html = "";
    const userName = document.getElementById('user-name').value || "名無し";
    const date = new Date().toLocaleString();
    
    html += `<div style="padding:10px; border-bottom:1px solid #ddd; margin-bottom:10px; background:#f9f9f9; text-align:center;">
        <strong>${userName}</strong> さんの結果 (${times}回) <br><span style="font-size:0.8em; color:#888;">${date}</span>
    </div>`;

    results.forEach((r, idx) => {
        html += `<div class="result-item">
            <span style="color:#aaa; font-size:0.8em; margin-right:10px; width:25px;">${idx+1}</span>
            <span class="rarity-badge bg-${r.rIdx % 5}">${r.rName}</span>
            <span style="font-weight:bold;">${r.name}</span>
        </div>`;
    });
    document.getElementById('result-area').innerHTML = html;
    document.getElementById('copy-area').style.display = 'block';
}

// --- コピー機能 (まとめて・高レア順) ---
function copyResult() {
    if (lastResults.length === 0) return;
    const userName = document.getElementById('user-name').value || "名無し";
    const title = config.title;

    // 集計
    const summary = new Map();
    lastResults.forEach(r => {
        if (summary.has(r.name)) {
            summary.get(r.name).count++;
        } else {
            summary.set(r.name, { ...r, count: 1 });
        }
    });

    // ソート (レア度が高い順)
    const sortedItems = Array.from(summary.values()).sort((a, b) => b.rIdx - a.rIdx);

    // テキスト生成
    let text = `【${title}】${userName}さんの結果 (${lastDrawCount}回)\n`;
    sortedItems.forEach(item => {
        const countStr = item.count > 1 ? ` x${item.count}` : "";
        text += `[${item.rName}] ${item.name}${countStr}\n`;
    });
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert("結果をまとめてコピーしました！\n(高レア順)");
        }).catch(err => {
            alert("コピーに失敗しました");
        });
    } else {
        alert("このブラウザでは対応していません");
    }
}

function resetAll() {
    if(confirm("全データを削除して初期化しますか？")) {
        localStorage.removeItem('iriam_highspec_gacha');
        location.reload();
    }
}
