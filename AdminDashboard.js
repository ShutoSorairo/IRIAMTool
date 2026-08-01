import { db } from './firebase-config.js';
import {
    collection, doc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

function ptValueFromSrc(src) {
    const m = (src || '').match(/_(\d+(?:,\d+)*)pt/i);
    return m ? m[1].replace(/,/g, '') : '';
}

function replacePointsInSrc(src, newPoints) {
    if (/_(\d+(?:,\d+)*)pt/i.test(src)) {
        return src.replace(/_(\d+(?:,\d+)*)pt/i, `_${newPoints}pt`);
    }
    return src;
}

function buildListItem({ name, metaHtml, isEditing, pts, onEdit, onDelete, onSave, onCancel }) {
    const div = document.createElement('div');
    div.className = 'list-item';

    if (isEditing) {
        const info = document.createElement('div');
        info.className = 'list-info edit-row';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = name;
        nameInput.placeholder = 'ギフト名';
        nameInput.className = 'edit-name';

        const ptsInput = document.createElement('input');
        ptsInput.type = 'number';
        ptsInput.value = pts;
        ptsInput.placeholder = 'PT';
        ptsInput.className = 'edit-pts';

        info.appendChild(nameInput);
        info.appendChild(ptsInput);
        div.appendChild(info);

        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-save';
        saveBtn.textContent = '保存';
        saveBtn.onclick = () => onSave(nameInput.value.trim(), ptsInput.value.trim());
        btnGroup.appendChild(saveBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-cancel';
        cancelBtn.textContent = 'キャンセル';
        cancelBtn.onclick = onCancel;
        btnGroup.appendChild(cancelBtn);

        div.appendChild(btnGroup);
    } else {
        const info = document.createElement('div');
        info.className = 'list-info';
        info.innerHTML = metaHtml;
        div.appendChild(info);

        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.textContent = '編集';
        editBtn.onclick = onEdit;
        btnGroup.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.className = 'btn-delete';
        delBtn.textContent = '削除';
        delBtn.onclick = onDelete;
        btnGroup.appendChild(delBtn);

        div.appendChild(btnGroup);
    }

    return div;
}

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

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

let currentUserGifts = [];
let editingUserGiftId = null;

window.loadUserGifts = async function() {
    const selectedUid = document.getElementById('user-select').value;
    const area = document.getElementById('user-gift-area');
    if (!selectedUid) { area.style.display = 'none'; return; }
    area.style.display = 'block';
    const list = document.getElementById('user-gift-list');
    list.innerHTML = '<p style="text-align:center;color:#aaa;padding:12px;">読み込み中...</p>';

    const snap = await getDocs(collection(db, 'users', selectedUid, 'gifts'));
    currentUserGifts = [];
    snap.forEach(d => currentUserGifts.push({ id: d.id, ...d.data() }));
    editingUserGiftId = null;
    renderUserGiftList();
};

function renderUserGiftList() {
    const selectedUid = document.getElementById('user-select').value;
    const list = document.getElementById('user-gift-list');
    list.innerHTML = '';

    if (currentUserGifts.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#aaa;padding:12px;">専用ギフトはありません</p>';
        return;
    }

    currentUserGifts.forEach(g => {
        const item = buildListItem({
            name: g.name,
            pts: ptValueFromSrc(g.src),
            isEditing: editingUserGiftId === g.id,
            metaHtml: `<b>${escapeHtml(g.name)}</b><br><small style="color:#aaa;">${escapeHtml(g.src)}</small>`,
            onEdit: () => { editingUserGiftId = g.id; renderUserGiftList(); },
            onCancel: () => { editingUserGiftId = null; renderUserGiftList(); },
            onDelete: () => deleteUserGift(selectedUid, g.id),
            onSave: (name, points) => saveUserGiftEdit(selectedUid, g.id, name, points)
        });
        list.appendChild(item);
    });
}

async function saveUserGiftEdit(selectedUid, id, name, points) {
    if (!name || !points) { alert('名前とポイントを入力してください'); return; }
    const gift = currentUserGifts.find(g => g.id === id);
    if (!gift) return;
    const newSrc = replacePointsInSrc(gift.src, points);
    try {
        await updateDoc(doc(db, 'users', selectedUid, 'gifts', id), { name, src: newSrc });
        editingUserGiftId = null;
        await window.loadUserGifts();
        await loadGifts();
    } catch (e) {
        alert('更新に失敗しました: ' + e.message);
    }
}

async function deleteUserGift(selectedUid, docId) {
    if (!confirm('削除しますか？')) return;
    await deleteDoc(doc(db, 'users', selectedUid, 'gifts', docId));
    await window.loadUserGifts();
    await loadGifts();
}

window.updateUgPreview = function() {
    const f = document.getElementById('ug-file').value || 'ファイル名';
    const p = document.getElementById('ug-pt').value || 'PT';
    document.getElementById('ug-preview').textContent = `ギフト/専用/${f}_${p}pt.PNG`;
};

window.addUserGift = async function() {
    const selectedUid = document.getElementById('user-select').value;
    const name = document.getElementById('ug-name').value.trim();
    const file = document.getElementById('ug-file').value.trim();
    const pt   = document.getElementById('ug-pt').value.trim();
    if (!selectedUid || !name || !file || !pt) { alert('ユーザーとギフト情報をすべて入力してください'); return; }
    const src = `ギフト/専用/${file}_${pt}pt.PNG`;
    await addDoc(collection(db, 'users', selectedUid, 'gifts'), {
        name, categories: ['専用'], src, createdAt: serverTimestamp()
    });
    document.getElementById('ug-name').value = '';
    document.getElementById('ug-file').value = '';
    document.getElementById('ug-pt').value = '';
    window.updateUgPreview();
    await window.loadUserGifts();
    await loadGifts();
};

// ---- 共通ギフト管理 ----
const folderMap = {
    "おもちゃ": "おもちゃ", "ネタ": "ネタ", "笑": "笑", "定番": "定番",
    "専用": "専用", "えらい": "えらい", "挨拶": "挨拶", "ステージ": "ステージ", "LOVE": "Love"
};

let currentGifts = [];
let editingGiftId = null;
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
    editingGiftId = null;
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

async function deleteGift(docId, scope, name) {
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
}

async function saveGiftEdit(id, scope, name, points) {
    if (!name || !points) { alert('名前とポイントを入力してください'); return; }
    const gift = currentGifts.find(g => g.id === id);
    if (!gift) return;
    const newSrc = replacePointsInSrc(gift.src, points);
    const ref = scope === 'user' && uid
        ? doc(db, 'users', uid, 'gifts', id)
        : doc(db, 'gifts', id);
    try {
        await updateDoc(ref, { name, src: newSrc });
        editingGiftId = null;
        await loadGifts();
    } catch(e) {
        alert('更新に失敗しました: ' + e.message);
    }
}

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

        const item = buildListItem({
            name: gift.name,
            pts: ptValueFromSrc(gift.src),
            isEditing: editingGiftId === gift.id,
            metaHtml: `
                <b>${escapeHtml(gift.name)}</b> ${scopeLabel} <span style="color:#888; font-size:0.85em;">[${escapeHtml(catDisplay)}]</span><br>
                <small style="color:#aaa;">${escapeHtml(gift.src)}</small>
            `,
            onEdit: () => { editingGiftId = gift.id; renderGiftList(); },
            onCancel: () => { editingGiftId = null; renderGiftList(); },
            onDelete: () => deleteGift(gift.id, gift.scope, gift.name),
            onSave: (name, points) => saveGiftEdit(gift.id, gift.scope, name, points)
        });
        container.appendChild(item);
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
