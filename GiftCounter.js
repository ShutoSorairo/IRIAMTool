import { db } from './firebase-config.js';
import {
    collection, doc, getDocs, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

const CATEGORIES = ["おもちゃ", "ネタ", "笑", "定番", "専用", "えらい", "挨拶", "ステージ", "LOVE"];
const PRESETS = ["入室人数", "バッジ取得数", "コメント数", "新規フォロワー数"];
const SAVE_KEY = 'gc_counters';

let counters = [];
let allGifts = [];
let selectedGift = null;
let editMode = false;
let editingId = null;

function uid() { return localStorage.getItem('iriam_uid'); }

function ptValue(src) {
    const m = src?.match(/_(\d+(?:,\d+)*)pt/i);
    return m ? parseInt(m[1].replace(/,/g, '')) : 0;
}

async function loadGifts() {
    allGifts = [];
    try {
        const sharedSnap = await getDocs(collection(db, 'gifts'));
        sharedSnap.forEach(d => {
            const g = d.data();
            const cats = Array.isArray(g.categories) ? g.categories : [g.category];
            cats.forEach(cat => allGifts.push({ name: g.name, category: cat, src: g.src }));
        });
        const u = uid();
        if (u) {
            const userSnap = await getDocs(collection(db, 'users', u, 'gifts'));
            userSnap.forEach(d => {
                const g = d.data();
                const cats = Array.isArray(g.categories) ? g.categories : [g.category];
                cats.forEach(cat => allGifts.push({ name: g.name, category: cat, src: g.src }));
            });
        }
    } catch(e) {
        console.warn('ギフト読込失敗:', e);
    }
}

async function saveCounters() {
    const u = uid();
    if (u) {
        try {
            await setDoc(doc(db, 'users', u, 'counters', 'default'), { counters, updatedAt: new Date() });
        } catch(e) { console.warn('保存失敗:', e); }
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(counters));
}

async function loadCounters() {
    const u = uid();
    if (u) {
        try {
            const snap = await getDoc(doc(db, 'users', u, 'counters', 'default'));
            if (snap.exists()) {
                counters = snap.data().counters || [];
                return;
            }
        } catch(e) { console.warn('読込失敗:', e); }
    }
    const local = localStorage.getItem(SAVE_KEY);
    counters = local ? JSON.parse(local) : [];
}

function renderGrid() {
    const grid = document.getElementById('counterGrid');
    grid.className = 'gc-grid' + (editMode ? ' edit-mode' : '');
    grid.innerHTML = '';

    if (counters.length === 0) {
        grid.innerHTML = '<div class="gc-empty">カウンターがありません<br>上のボタンから追加してください</div>';
        document.getElementById('gcTotal').style.display = 'none';
        return;
    }

    counters.forEach(c => {
        const card = document.createElement('div');
        card.className = 'gc-card ' + (c.type === 'gift' ? 'gift-card-type' : 'custom-card-type');

        const pct = c.goal ? Math.min(100, Math.round((c.count / c.goal) * 100)) : 0;
        const goalText = c.goal ? `${c.count} / ${c.goal}回` : `${c.count}回`;
        const subtotal = c.type === 'gift' ? `合計 ${(c.count * c.pt).toLocaleString()}pt` : '';

        const imgHtml = c.type === 'gift'
            ? `<div class="gc-card-img"><img src="${c.src}" alt="${c.name}" loading="lazy"></div>`
            : `<div class="gc-card-icon">${c.icon || '📊'}</div>`;

        const ptLine = c.type === 'gift' ? `<div class="gc-card-pt">${c.pt.toLocaleString()}pt</div>` : '';
        const progressHtml = c.goal
            ? `<div class="gc-progress-wrap"><div class="gc-progress-bar" style="width:${pct}%"></div></div>
               <div class="gc-card-goal-text">${goalText}</div>`
            : `<div class="gc-card-goal-text" style="color:#bbb;">目標なし</div>`;

        card.innerHTML = `
            <button class="gc-delete-btn" onclick="deleteCounter('${c.id}')">×</button>
            ${imgHtml}
            <div class="gc-card-name">${c.name}</div>
            ${ptLine}
            ${progressHtml}
            <div class="gc-counter-row">
                <button class="gc-count-btn${c.count === 0 ? ' minus-zero' : ''}" onclick="changeCount('${c.id}',-1)">－</button>
                <span class="gc-count-num">${c.count}</span>
                <button class="gc-count-btn plus" onclick="changeCount('${c.id}',1)">＋</button>
            </div>
            ${subtotal ? `<div class="gc-card-subtotal">${subtotal}</div>` : ''}
            <button class="gc-goal-edit-btn" onclick="openGoalEdit('${c.id}')">目標を編集</button>
        `;
        grid.appendChild(card);
    });

    const giftCounters = counters.filter(c => c.type === 'gift');
    if (giftCounters.length > 0) {
        const total = giftCounters.reduce((s, c) => s + c.count * c.pt, 0);
        document.getElementById('totalPt').textContent = total.toLocaleString() + 'pt';
        document.getElementById('gcTotal').style.display = '';
    } else {
        document.getElementById('gcTotal').style.display = 'none';
    }
}

window.changeCount = function(id, delta) {
    const c = counters.find(x => x.id === id);
    if (!c) return;
    c.count = Math.max(0, c.count + delta);
    renderGrid();
    saveCounters();
};

window.deleteCounter = function(id) {
    if (!confirm('削除しますか？')) return;
    counters = counters.filter(x => x.id !== id);
    renderGrid();
    saveCounters();
};

window.toggleEditMode = function() {
    editMode = !editMode;
    document.getElementById('btn-edit').classList.toggle('active', editMode);
    document.getElementById('btn-edit').textContent = editMode ? '完了' : '編集';
    renderGrid();
};

// ---- ギフト追加ポップアップ ----
window.openGiftPopup = async function() {
    selectedGift = null;
    document.getElementById('giftGoalInput').value = '';
    document.getElementById('selectedInfo').textContent = 'ギフトを選んでください';
    document.getElementById('giftOverlay').style.display = 'flex';
    buildGiftTabs();
    showGiftTab(CATEGORIES[0]);
};

function buildGiftTabs() {
    const row = document.getElementById('giftTabRow');
    row.innerHTML = '';
    CATEGORIES.forEach((cat, i) => {
        const btn = document.createElement('button');
        btn.className = 'gc-tab' + (i === 0 ? ' active' : '');
        btn.textContent = cat;
        btn.onclick = () => {
            document.querySelectorAll('.gc-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showGiftTab(cat);
        };
        row.appendChild(btn);
    });
}

function showGiftTab(cat) {
    const grid = document.getElementById('giftPickerGrid');
    grid.innerHTML = '';
    const filtered = allGifts.filter(g => g.category === cat);
    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#aaa;padding:20px;">ギフトがありません</div>';
        return;
    }
    const seen = new Set();
    filtered.forEach(g => {
        if (seen.has(g.name)) return;
        seen.add(g.name);
        const item = document.createElement('div');
        item.className = 'gc-gift-item' + (selectedGift?.name === g.name ? ' selected' : '');
        item.innerHTML = `
            <img src="${g.src}" alt="${g.name}" loading="lazy">
            <div class="gc-gift-item-name">${g.name}</div>
            <div class="gc-gift-item-pt">${ptValue(g.src).toLocaleString()}pt</div>
        `;
        item.onclick = () => selectGift(g);
        grid.appendChild(item);
    });
}

function selectGift(g) {
    selectedGift = g;
    document.querySelectorAll('.gc-gift-item').forEach(el => el.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    document.getElementById('selectedInfo').textContent = `選択中: ${g.name}（${ptValue(g.src).toLocaleString()}pt）`;
}

window.closeGiftPopup = function(e) {
    if (e && e.target !== document.getElementById('giftOverlay')) return;
    document.getElementById('giftOverlay').style.display = 'none';
};

window.confirmAddGift = function() {
    if (!selectedGift) { alert('ギフトを選択してください'); return; }
    const goalVal = document.getElementById('giftGoalInput').value;
    const goal = goalVal ? parseInt(goalVal) : null;
    counters.push({
        id: crypto.randomUUID(),
        type: 'gift',
        name: selectedGift.name,
        src: selectedGift.src,
        pt: ptValue(selectedGift.src),
        goal,
        count: 0
    });
    document.getElementById('giftOverlay').style.display = 'none';
    renderGrid();
    saveCounters();
};

// ---- カスタム追加ポップアップ ----
window.openCustomPopup = function() {
    document.getElementById('customName').value = '';
    document.getElementById('customGoal').value = '';
    const presetArea = document.getElementById('presetBtns');
    presetArea.innerHTML = '';
    PRESETS.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'gc-preset-btn';
        btn.textContent = p;
        btn.onclick = () => { document.getElementById('customName').value = p; };
        presetArea.appendChild(btn);
    });
    document.getElementById('customOverlay').style.display = 'flex';
};

window.closeCustomPopup = function(e) {
    if (e && e.target !== document.getElementById('customOverlay')) return;
    document.getElementById('customOverlay').style.display = 'none';
};

const CUSTOM_ICONS = { '入室人数': '🚪', 'バッジ取得数': '🏅', 'コメント数': '💬', '新規フォロワー数': '➕' };

window.confirmAddCustom = function() {
    const name = document.getElementById('customName').value.trim();
    if (!name) { alert('名前を入力してください'); return; }
    const goalVal = document.getElementById('customGoal').value;
    const goal = goalVal ? parseInt(goalVal) : null;
    counters.push({
        id: crypto.randomUUID(),
        type: 'custom',
        name,
        icon: CUSTOM_ICONS[name] || '📊',
        goal,
        count: 0
    });
    document.getElementById('customOverlay').style.display = 'none';
    renderGrid();
    saveCounters();
};

// ---- 目標編集 ----
window.openGoalEdit = function(id) {
    editingId = id;
    const c = counters.find(x => x.id === id);
    document.getElementById('goalEditTitle').textContent = `「${c.name}」の目標を編集`;
    document.getElementById('goalEditInput').value = c.goal || '';
    document.getElementById('goalEditOverlay').style.display = 'flex';
};

window.closeGoalEdit = function(e) {
    if (e && e.target !== document.getElementById('goalEditOverlay')) return;
    document.getElementById('goalEditOverlay').style.display = 'none';
    editingId = null;
};

window.confirmGoalEdit = function() {
    const val = document.getElementById('goalEditInput').value;
    const c = counters.find(x => x.id === editingId);
    if (c) c.goal = val ? parseInt(val) : null;
    document.getElementById('goalEditOverlay').style.display = 'none';
    editingId = null;
    renderGrid();
    saveCounters();
};

async function init() {
    await loadGifts();
    await loadCounters();
    renderGrid();
}

document.addEventListener('DOMContentLoaded', init);
