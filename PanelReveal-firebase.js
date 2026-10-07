import { db } from './firebase-config.js';
import {
    collection, doc, getDoc, getDocs, addDoc, deleteDoc, serverTimestamp, orderBy, query
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import { lightPanels } from './PanelReveal-autosave.js';

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
                    <div style="font-size:0.8em; color:#aaa;">${date} &nbsp; ${(data.panels||[]).length ? (data.panels.length + 'パネル') : '<span style="color:#e53935;">空（読込不可）</span>'}</div>
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
        const state = window.getPanelState();
        if (state.panels.length === 0) {
            msg.style.color = '#e53935';
            msg.textContent = '保存するパネルがありません';
            return;
        }

        await addDoc(getPanelsCollection(), {
            name,
            panels: lightPanels(state.panels),
            boardW: state.boardW || 800,
            boardH: state.boardH || 600,
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
        const snap = await getDoc(doc(db, 'users', uid, 'panels', docId));
        if (!snap.exists()) { alert('データが見つかりません'); return; }
        const data = snap.data();
        if (!data.panels?.length) { alert('このデータにはパネルが入っていません（以前の不具合で空のまま保存されたデータです）'); return; }

        window.applyPanelState(data);
        window.savePanelState(); // 読み込んだ内容を現在の状態として保存
        document.getElementById('lastSavedTime').textContent = '読込: ' + data.name;

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
