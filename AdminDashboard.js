import { db } from './firebase-config.js';
import {
    collection, doc, getDocs, addDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

// ---- ユーザー別専用ギフト管理 ----
async function loadUsers() {
    const snap = await getDocs(collection(db, 'users'));
    const sel = document.getElementById('user-select');
    sel.innerHTML = '<option value="">ユーザーを選択...</option>';
    snap.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.data().displayName || d.id;
        sel.appendChild(opt);
    });
}

window.loadUserGifts = async function() {
    const uid = document.getElementById('user-select').value;
    const area = document.getElementById('user-gift-area');
    if (!uid) { area.style.display = 'none'; return; }
    area.style.display = 'block';
    const list = document.getElementById('user-gift-list');
    list.innerHTML = '<p style="text-align:center;color:#aaa;padding:12px;">読み込み中...</p>';

    const snap = await getDocs(collection(db, 'users', uid, 'gifts'));
    list.innerHTML = '';
    if (snap.empty) {
        list.innerHTML = '<p style="text-align:center;color:#aaa;padding:12px;">専用ギフトはありません</p>';
        return;
    }
    snap.forEach(d => {
        const g = d.data();
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <div class="list-info"><b>${g.name}</b><br><small style="color:#aaa;">${g.src}</small></div>
            <button onclick="deleteUserGift('${uid}','${d.id}',this)" class="btn-delete">削除</button>
        `;
        list.appendChild(div);
    });
};

window.updateUgPreview = function() {
    const f = document.getElementById('ug-file').value || 'ファイル名';
    const p = document.getElementById('ug-pt').value || 'PT';
    document.getElementById('ug-preview').textContent = `ギフト/専用/${f}_${p}pt.PNG`;
};

window.addUserGift = async function() {
    const uid = document.getElementById('user-select').value;
    const name = document.getElementById('ug-name').value.trim();
    const file = document.getElementById('ug-file').value.trim();
    const pt   = document.getElementById('ug-pt').value.trim();
    if (!uid || !name || !file || !pt) { alert('ユーザーとギフト情報をすべて入力してください'); return; }
    const src = `ギフト/専用/${file}_${pt}pt.PNG`;
    await addDoc(collection(db, 'users', uid, 'gifts'), {
        name, categories: ['専用'], src, createdAt: serverTimestamp()
    });
    document.getElementById('ug-name').value = '';
    document.getElementById('ug-file').value = '';
    document.getElementById('ug-pt').value = '';
    window.updateUgPreview();
    await window.loadUserGifts();
};

window.deleteUserGift = async function(uid, docId, btn) {
    if (!confirm('削除しますか？')) return;
    await deleteDoc(doc(db, 'users', uid, 'gifts', docId));
    btn.closest('.list-item').remove();
};

const folderMap = {
    "おもちゃ": "おもちゃ", "ネタ": "ネタ", "笑": "笑", "定番": "定番",
    "専用": "専用", "えらい": "えらい", "挨拶": "挨拶", "ステージ": "ステージ", "LOVE": "Love"
};

let currentGifts = [];
const uid = localStorage.getItem('iriam_uid');

window.onload = async function() {
    if (!sessionStorage.getItem('iriam_admin_logged_in')) {
        alert("ログインしてください");
        window.location.href = "AdminLogin.html";
        return;
    }
    await loadGifts();
    await loadUsers();
    updatePreview();
};

async function loadGifts() {
    currentGifts = [];

    // 共通ギフト
    const sharedSnap = await getDocs(collection(db, 'gifts'));
    sharedSnap.forEach(d => currentGifts.push({ id: d.id, scope: 'shared', ...d.data() }));

    // 専用ギフト（ログイン中ユーザー）
    if (uid) {
        const userSnap = await getDocs(collection(db, 'users', uid, 'gifts'));
        userSnap.forEach(d => currentGifts.push({ id: d.id, scope: 'user', ...d.data() }));
    }

    document.getElementById('current-count').textContent = currentGifts.length;
    renderGiftList();
}

window.updatePreview = function() {
    const folderKey = document.getElementById('g-folder').value;
    const folder = folderMap[folderKey] || folderKey;
    const filebase = document.getElementById('g-filebase').value;
    const points = document.getElementById('g-points').value;
    const fullPath = `ギフト/${folder}/${filebase}_${points}pt.PNG`;
    document.getElementById('path-preview').textContent = fullPath;
};

window.addGift = async function() {
    const name = document.getElementById('g-name').value;
    const filebase = document.getElementById('g-filebase').value;
    const points = document.getElementById('g-points').value;
    const checkboxes = document.querySelectorAll('input[name="cats"]:checked');
    const selectedCats = Array.from(checkboxes).map(cb => cb.value);

    if (!name || !filebase || !points) { alert("名前、ファイル名、ポイントを入力してください"); return; }
    if (selectedCats.length === 0) { alert("カテゴリを最低1つ選択してください"); return; }

    const folderKey = document.getElementById('g-folder').value;
    const folder = folderMap[folderKey] || folderKey;
    const fullPath = `ギフト/${folder}/${filebase}_${points}pt.PNG`;

    const isUserOnly = selectedCats.length === 1 && selectedCats[0] === '専用';
    const ref = isUserOnly && uid
        ? collection(db, 'users', uid, 'gifts')
        : collection(db, 'gifts');

    try {
        await addDoc(ref, {
            name, categories: selectedCats, src: fullPath, createdAt: serverTimestamp()
        });
        await loadGifts();
        clearForm();
        alert(`「${name}」を追加しました。\n保存先: ${isUserOnly ? 'ユーザー専用' : '共通'}`);
    } catch(e) {
        alert('保存に失敗しました: ' + e.message);
    }
};

window.deleteGift = async function(docId, scope, name) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    try {
        const ref = scope === 'user' && uid
            ? doc(db, 'users', uid, 'gifts', docId)
            : doc(db, 'gifts', docId);
        await deleteDoc(ref);
        await loadGifts();
    } catch(e) {
        alert('削除に失敗しました: ' + e.message);
    }
};

function renderGiftList() {
    const container = document.getElementById('gift-list-container');
    const searchText = document.getElementById('search-box').value.toLowerCase();
    container.innerHTML = '';

    currentGifts.forEach(gift => {
        if (!gift.name.toLowerCase().includes(searchText)) return;
        const catDisplay = Array.isArray(gift.categories) ? gift.categories.join(', ') : (gift.category || 'なし');
        const scopeLabel = gift.scope === 'user'
            ? '<span style="color:#e65100; font-size:0.8em;">専用</span>'
            : '<span style="color:#1976d2; font-size:0.8em;">共通</span>';
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <div class="list-info">
                <b>${gift.name}</b> ${scopeLabel} <span style="color:#888; font-size:0.85em;">[${catDisplay}]</span><br>
                <small style="color:#aaa;">${gift.src}</small>
            </div>
            <button onclick="deleteGift('${gift.id}', '${gift.scope}', '${gift.name}')" class="btn-delete">削除</button>
        `;
        container.appendChild(div);
    });
}

window.filterGifts = renderGiftList;

function clearForm() {
    document.getElementById('g-name').value = '';
    document.getElementById('g-filebase').value = '';
    document.getElementById('g-points').value = '';
    document.querySelectorAll('input[name="cats"]').forEach(cb => cb.checked = false);
    updatePreview();
}
