import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js';
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js';

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

const FACES = ['あまい','からい','すっぱい','うまい','にがい','しょっぱい'];

let sessions = [];

async function loadSessions() {
    sessions = [];

    if (uid) {
        try {
            const snap = await getDocs(collection(db, 'users', uid, 'diceTally'));
            snap.forEach(d => {
                const data = d.data();
                sessions.push({
                    id: d.id,
                    label: data.label || d.id,
                    updatedAt: data.updatedAt || 0,
                    summary: data.summary || computeSummary(data)
                });
            });
        } catch (e) { console.warn('load failed', e); }
    }

    // localStorageフォールバック
    if (sessions.length === 0) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key.startsWith('diceTally_')) continue;
            const id = key.replace('diceTally_', '');
            try {
                const data = JSON.parse(localStorage.getItem(key));
                sessions.push({
                    id,
                    label: data.label || id,
                    updatedAt: data.updatedAt || 0,
                    summary: data.summary || computeSummary(data)
                });
            } catch (_) {}
        }
    }

    sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    render();
}

function computeSummary(data) {
    const persons = data.persons || [];
    const consumed = data.consumed || {};
    const totals = {};
    FACES.forEach(f => { totals[f] = 0; });
    persons.forEach(p => FACES.forEach(f => { totals[f] += (p.counts && p.counts[f]) || 0; }));
    const total = FACES.reduce((s, f) => s + totals[f], 0);
    const consumedTotal = FACES.reduce((s, f) => s + (consumed[f] || 0), 0);
    return { total, consumed: consumedTotal, remaining: total - consumedTotal, personCount: persons.length };
}

function render() {
    const list = document.getElementById('sessionList');
    if (sessions.length === 0) {
        list.innerHTML = '<div class="dt-empty">企画がまだありません<br>上のボタンから作成してください</div>';
        return;
    }
    list.innerHTML = sessions.map(s => {
        const sm = s.summary || {};
        const dateStr = s.updatedAt
            ? new Date(s.updatedAt).toLocaleString('ja-JP', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }) + ' 更新'
            : '';
        return `
            <div class="dt-session-card" onclick="openSession('${s.id}')">
                <div class="dt-sc-row">
                    <div class="dt-sc-info">
                        <div class="dt-sc-name">${s.label}</div>
                        ${dateStr ? `<div class="dt-sc-date">${dateStr}</div>` : ''}
                    </div>
                    <button class="dt-sc-del" onclick="deleteSession(event,'${s.id}')">×</button>
                </div>
                <div class="dt-sc-stats">
                    <span class="dt-sc-stat">合計 <b>${sm.total ?? 0}回</b></span>
                    <span class="dt-sc-stat">消費済み <b>${sm.consumed ?? 0}回</b></span>
                    <span class="dt-sc-stat">未消費 <b>${sm.remaining ?? 0}回</b></span>
                    <span class="dt-sc-stat">参加者 <b>${sm.personCount ?? 0}人</b></span>
                </div>
            </div>
        `;
    }).join('');
}

window.openSession = function(id) {
    location.href = `DiceTallyMain.html?id=${encodeURIComponent(id)}`;
};

window.openCreateModal = function() {
    document.getElementById('newSessionName').value = '';
    document.getElementById('createModal').classList.add('open');
    setTimeout(() => document.getElementById('newSessionName').focus(), 200);
};

window.closeCreateModal = function(e) {
    if (e && e.target !== document.getElementById('createModal')) return;
    document.getElementById('createModal').classList.remove('open');
};

window.createSession = async function() {
    const inp = document.getElementById('newSessionName');
    const label = inp.value.trim();
    if (!label) { inp.focus(); return; }
    const id = 'session_' + Date.now();
    const data = {
        label,
        persons: [],
        consumed: Object.fromEntries(FACES.map(f => [f, 0])),
        updatedAt: Date.now(),
        summary: { total: 0, consumed: 0, remaining: 0, personCount: 0 }
    };
    localStorage.setItem('diceTally_' + id, JSON.stringify(data));
    if (uid) {
        try { await setDoc(doc(db, 'users', uid, 'diceTally', id), data); } catch(e) {}
    }
    location.href = `DiceTallyMain.html?id=${encodeURIComponent(id)}`;
};

window.deleteSession = async function(e, id) {
    e.stopPropagation();
    if (!confirm('この企画を削除しますか？')) return;
    localStorage.removeItem('diceTally_' + id);
    if (uid) {
        try { await deleteDoc(doc(db, 'users', uid, 'diceTally', id)); } catch(e) {}
    }
    sessions = sessions.filter(s => s.id !== id);
    render();
};

// Enterキーで作成
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('newSessionName').addEventListener('keydown', e => {
        if (e.key === 'Enter') window.createSession();
    });
    loadSessions();
});
