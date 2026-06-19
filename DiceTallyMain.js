import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyC2bGfFLjMa80BklV0dpAT__9p8PUj4Q9E",
    authDomain: "iriamtool.firebaseapp.com",
    projectId: "iriamtool",
    storageBucket: "iriamtool.appspot.com",
    messagingSenderId: "826475624020",
    appId: "1:826475624020:web:fc80b62f4b7cd3da45cfce"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const uid = localStorage.getItem('iriam_uid');

const FACES = [
    { key: 'あまい',     cls: 'sweet'  },
    { key: 'からい',     cls: 'spicy'  },
    { key: 'すっぱい',   cls: 'sour'   },
    { key: 'うまい',     cls: 'tasty'  },
    { key: 'にがい',     cls: 'bitter' },
    { key: 'しょっぱい', cls: 'salty'  },
];

const params = new URLSearchParams(location.search);
const sessionId = params.get('id') || 'default';

let sessionLabel = '';
let persons = [];
let consumed = {};
FACES.forEach(f => { consumed[f.key] = 0; });

function getTotals() {
    const t = {};
    FACES.forEach(f => { t[f.key] = 0; });
    persons.forEach(p => FACES.forEach(f => { t[f.key] += (p.counts[f.key] || 0); }));
    return t;
}

function computeSummary() {
    const totals = getTotals();
    const total = FACES.reduce((s, f) => s + totals[f.key], 0);
    const consumedTotal = FACES.reduce((s, f) => s + (consumed[f.key] || 0), 0);
    return { total, consumed: consumedTotal, remaining: total - consumedTotal, personCount: persons.length };
}

function renderTotal() {
    const totals = getTotals();
    const totalAll = FACES.reduce((s, f) => s + totals[f.key], 0);
    const consumedAll = FACES.reduce((s, f) => s + (consumed[f.key] || 0), 0);
    document.getElementById('s-total').textContent = totalAll + '回';
    document.getElementById('s-consumed').textContent = consumedAll + '回';
    document.getElementById('s-remaining').textContent = (totalAll - consumedAll) + '回';

    const grid = document.getElementById('totalGrid');
    grid.innerHTML = '';
    FACES.forEach(f => {
        const total = totals[f.key] || 0;
        const cons = consumed[f.key] || 0;
        const rem = total - cons;
        const card = document.createElement('div');
        card.className = `dt-dice-card ${f.cls}`;
        card.innerHTML = `
            <div class="dt-dice-face">${f.key}</div>
            <div class="dt-dice-counts">合計 <span>${total}</span> ／ 消費 <span>${cons}</span> ／ 残 <span>${rem}</span></div>
            <button class="dt-consume-btn" ${rem <= 0 ? 'disabled' : ''} onclick="window._consume('${f.key}')">消費 ＋1</button>
        `;
        grid.appendChild(card);
    });
}

window._consume = function(key) {
    const totals = getTotals();
    if ((consumed[key] || 0) >= (totals[key] || 0)) return;
    consumed[key] = (consumed[key] || 0) + 1;
    renderTotal();
};

function renderPersons() {
    const list = document.getElementById('personList');
    list.innerHTML = '';
    persons.forEach(p => {
        const total = FACES.reduce((s, f) => s + (p.counts[f.key] || 0), 0);
        const card = document.createElement('div');
        card.className = 'dt-person-card';
        card.innerHTML = `
            <div class="dt-person-header">
                <span class="dt-person-name">${p.name}</span>
                <span class="dt-person-total">合計 ${total}回</span>
                <button class="dt-person-del" onclick="window._deletePerson('${p.id}')">×</button>
            </div>
            <div class="dt-person-faces">
                ${FACES.map(f => `
                    <div class="dt-face-cell">
                        <span class="dt-face-label">${f.key}</span>
                        <div class="dt-face-ctrl">
                            <button class="dt-face-btn" onclick="window._changeFace('${p.id}','${f.key}',-1)">−</button>
                            <span class="dt-face-count">${p.counts[f.key] || 0}</span>
                            <button class="dt-face-btn" onclick="window._changeFace('${p.id}','${f.key}',1)">＋</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        list.appendChild(card);
    });
}

window._changeFace = function(id, key, delta) {
    const p = persons.find(x => x.id === id);
    if (!p) return;
    p.counts[key] = Math.max(0, (p.counts[key] || 0) + delta);
    renderPersons();
    renderTotal();
};

window._deletePerson = function(id) {
    persons = persons.filter(x => x.id !== id);
    renderPersons();
    renderTotal();
};

window.addPerson = function() {
    const inp = document.getElementById('personName');
    const name = inp.value.trim();
    if (!name) return;
    const counts = {};
    FACES.forEach(f => { counts[f.key] = 0; });
    persons.push({ id: Date.now().toString(), name, counts });
    inp.value = '';
    renderPersons();
    renderTotal();
};

window.switchTab = function(tab) {
    document.getElementById('view-total').style.display = tab === 'total' ? '' : 'none';
    document.getElementById('view-person').style.display = tab === 'person' ? '' : 'none';
    document.getElementById('tab-total').classList.toggle('active', tab === 'total');
    document.getElementById('tab-person').classList.toggle('active', tab === 'person');
};

window.saveData = async function() {
    const summary = computeSummary();
    const data = { label: sessionLabel, persons, consumed, updatedAt: Date.now(), summary };
    localStorage.setItem('diceTally_' + sessionId, JSON.stringify(data));
    if (uid) {
        try {
            await setDoc(doc(db, 'users', uid, 'diceTally', sessionId), data);
        } catch (e) { console.warn('Firestore save failed', e); }
    }
    showToast('💾 保存しました');
};

window.confirmReset = function() {
    if (!confirm('リセットしますか？すべての集計がクリアされます。')) return;
    persons = [];
    FACES.forEach(f => { consumed[f.key] = 0; });
    renderPersons();
    renderTotal();
};

function showToast(msg) {
    let el = document.getElementById('dt-toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'dt-toast';
        el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:20px;font-size:0.9em;z-index:9999;transition:opacity 0.3s;';
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = '0'; }, 2000);
}

async function init() {
    if (!sessionId || sessionId === 'null') {
        location.href = 'DiceTally.html';
        return;
    }

    let data = null;
    if (uid) {
        try {
            const snap = await getDoc(doc(db, 'users', uid, 'diceTally', sessionId));
            if (snap.exists()) data = snap.data();
        } catch (e) { console.warn('Firestore load failed', e); }
    }
    if (!data) {
        const local = localStorage.getItem('diceTally_' + sessionId);
        if (local) data = JSON.parse(local);
    }
    if (!data) {
        location.href = 'DiceTally.html';
        return;
    }

    sessionLabel = data.label || sessionId;
    persons = data.persons || [];
    consumed = data.consumed || {};
    FACES.forEach(f => { if (consumed[f.key] == null) consumed[f.key] = 0; });

    document.getElementById('sessionName').textContent = sessionLabel;
    document.title = sessionLabel + ' - 味見ダイス';

    renderPersons();
    renderTotal();
}

document.getElementById('personName').addEventListener('keydown', e => {
    if (e.key === 'Enter') window.addPerson();
});

init();
