import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js';

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

const FACES = [
    { key: 'あまい',     cls: 'sweet'  },
    { key: 'からい',     cls: 'spicy'  },
    { key: 'すっぱい',   cls: 'sour'   },
    { key: 'うまい',     cls: 'tasty'  },
    { key: 'にがい',     cls: 'bitter' },
    { key: 'しょっぱい', cls: 'salty'  },
];

let persons = [];
let consumed = {};
FACES.forEach(f => { consumed[f.key] = 0; });

// セッション管理
let currentSessionId = 'default';
let currentSessionLabel = 'デフォルト';
let sessions = []; // [{ id, label, updatedAt }]

const uid = localStorage.getItem('iriam_uid');

// ---- セッション操作 ----

async function loadSessionList() {
    sessions = [];
    if (uid) {
        try {
            const col = collection(db, 'users', uid, 'diceTally');
            const snap = await getDocs(col);
            snap.forEach(d => {
                const data = d.data();
                sessions.push({ id: d.id, label: data.label || d.id, updatedAt: data.updatedAt || 0 });
            });
            sessions.sort((a, b) => b.updatedAt - a.updatedAt);
        } catch (e) { console.warn('session list load failed', e); }
    }
    if (sessions.length === 0) {
        sessions = [{ id: 'default', label: 'デフォルト', updatedAt: 0 }];
    }
}

async function loadSession(sessionId) {
    currentSessionId = sessionId;
    const sess = sessions.find(s => s.id === sessionId);
    currentSessionLabel = sess ? sess.label : sessionId;
    document.getElementById('sessionName').textContent = currentSessionLabel;

    persons = [];
    FACES.forEach(f => { consumed[f.key] = 0; });

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
    if (data) {
        persons = data.persons || [];
        consumed = data.consumed || {};
        FACES.forEach(f => { if (!consumed[f.key]) consumed[f.key] = 0; });
    }
    renderPersons();
    renderTotal();
}

window.openSessionModal = async function() {
    await loadSessionList();
    renderSessionList();
    document.getElementById('sessionModal').classList.add('open');
};

window.closeSessionModal = function(e) {
    if (e && e.target !== document.getElementById('sessionModal')) return;
    document.getElementById('sessionModal').classList.remove('open');
};

function renderSessionList() {
    const list = document.getElementById('sessionList');
    if (sessions.length === 0) {
        list.innerHTML = '<div class="dt-session-empty">企画がありません</div>';
        return;
    }
    list.innerHTML = sessions.map(s => {
        const dateStr = s.updatedAt ? new Date(s.updatedAt).toLocaleString('ja-JP', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }) + ' 更新' : '';
        const isActive = s.id === currentSessionId;
        return `
            <div class="dt-session-item ${isActive ? 'active' : ''}" onclick="selectSession('${s.id}')">
                <div class="dt-session-item-info">
                    <div class="dt-session-item-name">${s.label}${isActive ? ' ✓' : ''}</div>
                    ${dateStr ? `<div class="dt-session-item-date">${dateStr}</div>` : ''}
                </div>
                ${!isActive ? `<button class="dt-session-item-del" onclick="deleteSession(event,'${s.id}')">×</button>` : ''}
            </div>
        `;
    }).join('');
}

window.selectSession = async function(id) {
    document.getElementById('sessionModal').classList.remove('open');
    await loadSession(id);
};

window.createSession = async function() {
    const inp = document.getElementById('newSessionName');
    const label = inp.value.trim();
    if (!label) return;
    const id = 'session_' + Date.now();
    const newSess = { id, label, updatedAt: Date.now() };
    // 空データで即保存
    const emptyData = { label, persons: [], consumed: {}, updatedAt: newSess.updatedAt };
    FACES.forEach(f => { emptyData.consumed[f.key] = 0; });
    if (uid) {
        try { await setDoc(doc(db, 'users', uid, 'diceTally', id), emptyData); } catch(e) {}
    }
    localStorage.setItem('diceTally_' + id, JSON.stringify(emptyData));
    sessions.unshift(newSess);
    inp.value = '';
    document.getElementById('sessionModal').classList.remove('open');
    await loadSession(id);
};

window.deleteSession = async function(e, id) {
    e.stopPropagation();
    if (!confirm('この企画を削除しますか？')) return;
    if (uid) {
        try { await deleteDoc(doc(db, 'users', uid, 'diceTally', id)); } catch(e) {}
    }
    localStorage.removeItem('diceTally_' + id);
    sessions = sessions.filter(s => s.id !== id);
    renderSessionList();
};

// ---- データ操作 ----

function getTotals() {
    const t = {};
    FACES.forEach(f => { t[f.key] = 0; });
    persons.forEach(p => FACES.forEach(f => { t[f.key] += p.counts[f.key] || 0; }));
    return t;
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
            <div class="dt-dice-counts">
                合計 <span>${total}</span> ／ 消費 <span>${cons}</span> ／ 残 <span>${rem}</span>
            </div>
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
    const data = { label: currentSessionLabel, persons, consumed, updatedAt: Date.now() };
    localStorage.setItem('diceTally_' + currentSessionId, JSON.stringify(data));
    if (uid) {
        try {
            await setDoc(doc(db, 'users', uid, 'diceTally', currentSessionId), data);
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

// 初期化
(async function init() {
    await loadSessionList();
    const lastId = localStorage.getItem('diceTally_lastSession') || (sessions[0] && sessions[0].id) || 'default';
    await loadSession(lastId);
    // 最後のセッションを記憶
    const origSave = window.saveData;
    window.saveData = async function() {
        localStorage.setItem('diceTally_lastSession', currentSessionId);
        await origSave();
    };
})();
