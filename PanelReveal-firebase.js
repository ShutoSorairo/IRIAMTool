import { db } from './firebase-config.js';
import {
    collection, doc, getDocs, addDoc, deleteDoc, serverTimestamp, orderBy, query
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

const uid = localStorage.getItem('iriam_uid');

function getPanelsCollection() {
    if (!uid) return null;
    return collection(db, 'users', uid, 'panels');
}

window.openCloudSaveModal = function() {
    if (!uid) { alert('ログインしてください'); return; }
    document.getElementById('cloud-save-name').value = '';
    document.getElementById('cloud-save-msg').textContent = '';
    document.getElementById('cloud-save-modal').style.display = 'flex';
};

window.openCloudLoadModal = async function() {
    if (!uid) { alert('ログインしてください'); return; }
    document.getElementById('cloud-load-modal').style.display = 'flex';
    document.getElementById('cloud-load-list').innerHTML = '<p style="color:#aaa;text-align:center;">読み込み中...</p>';
    document.getElementById('cloud-load-msg').textContent = '';

    try {
        const col = getPanelsCollection();
        const snap = await getDocs(query(col, orderBy('updatedAt', 'desc')));
        const list = document.getElementById('cloud-load-list');
        list.innerHTML = '';

        if (snap.empty) {
            list.innerHTML = '<p style="color:#aaa;text-align:center;">保存されたパネルはありません</p>';
            return;
        }

        snap.forEach(d => {
            const data = d.data();
            const date = data.updatedAt?.toDate?.()?.toLocaleString() ?? '';
            const row = document.createElement('div');
            row.style = 'display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;';
            row.innerHTML = `
                <div>
                    <div style="font-weight:bold;">${data.name}</div>
                    <div style="font-size:0.8em; color:#aaa;">${date} &nbsp; ${(data.panels||[]).length}パネル</div>
                </div>
                <div style="display:flex; gap:6px;">
                    <button onclick="cloudLoadPanel('${d.id}')" style="padding:6px 12px; background:#4f8cff; color:#fff; border:none; border-radius:6px; cursor:pointer;">読込</button>
                    <button onclick="cloudDeletePanel('${d.id}', this)" style="padding:6px 12px; background:#ef5350; color:#fff; border:none; border-radius:6px; cursor:pointer;">削除</button>
                </div>
            `;
            list.appendChild(row);
        });
    } catch(e) {
        document.getElementById('cloud-load-list').innerHTML = '<p style="color:#e53935;text-align:center;">読み込みに失敗しました</p>';
        console.error(e);
    }
};

window.cloudSavePanel = async function() {
    const name = document.getElementById('cloud-save-name').value.trim();
    if (!name) { document.getElementById('cloud-save-msg').textContent = '名前を入力してください'; return; }

    const msg = document.getElementById('cloud-save-msg');
    msg.style.color = '#888';
    msg.textContent = '保存中...';

    try {
        const light = (window.panels || []).map(p => ({
            id: p.id, name: p.name, giftValue: p.giftValue,
            currentTarget: p.currentTarget, currentCount: p.currentCount,
            x: p.x, y: p.y, width: p.width, height: p.height,
            shape: p.shape, color: p.color, isRevealed: p.isRevealed
        }));

        await addDoc(getPanelsCollection(), {
            name,
            panels: light,
            boardW: window.boardW || 800,
            boardH: window.boardH || 600,
            updatedAt: serverTimestamp()
        });

        msg.style.color = '#2e7d32';
        msg.textContent = '✓ 保存しました！';
        setTimeout(() => { document.getElementById('cloud-save-modal').style.display = 'none'; }, 1000);
    } catch(e) {
        msg.style.color = '#e53935';
        msg.textContent = '保存に失敗しました: ' + e.message;
    }
};

window.cloudLoadPanel = async function(docId) {
    if (!confirm('現在のパネルを上書きして読み込みますか？')) return;
    try {
        const col = getPanelsCollection();
        const snap = await getDocs(col);
        let data = null;
        snap.forEach(d => { if (d.id === docId) data = d.data(); });
        if (!data) { alert('データが見つかりません'); return; }

        window.panels = data.panels || [];
        window.boardW = data.boardW || 800;
        window.boardH = data.boardH || 600;

        const svg = document.getElementById('panel-svg');
        svg.setAttribute('viewBox', `0 0 ${window.boardW} ${window.boardH}`);
        document.getElementById('no-image-text').style.display = 'none';
        document.getElementById('lastSavedTime').textContent = '読込: ' + data.name;
        window.renderCanvas();

        document.getElementById('cloud-load-modal').style.display = 'none';
    } catch(e) {
        alert('読み込みに失敗しました: ' + e.message);
    }
};

window.cloudDeletePanel = async function(docId, btn) {
    if (!confirm('このパネルデータを削除しますか？')) return;
    try {
        await deleteDoc(doc(db, 'users', uid, 'panels', docId));
        btn.closest('div[style]').remove();
    } catch(e) {
        alert('削除に失敗しました: ' + e.message);
    }
};
