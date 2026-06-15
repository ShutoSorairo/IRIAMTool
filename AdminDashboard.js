import { db } from './firebase-config.js';
import {
    collection, doc, getDocs, addDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

const folderMap = {
    "おもちゃ": "おもちゃ", "ネタ": "ネタ", "笑": "笑", "定番": "定番",
    "専用": "専用", "えらい": "えらい", "挨拶": "挨拶", "ステージ": "ステージ", "LOVE": "Love"
};

let currentGifts = [];

window.onload = async function() {
    if (!sessionStorage.getItem('iriam_admin_logged_in')) {
        alert("ログインしてください");
        window.location.href = "AdminLogin.html";
        return;
    }
    await loadGifts();
    updatePreview();
};

async function loadGifts() {
    currentGifts = [];
    const snap = await getDocs(collection(db, 'gifts'));
    snap.forEach(d => currentGifts.push({ id: d.id, ...d.data() }));
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

    try {
        await addDoc(collection(db, 'gifts'), {
            name, categories: selectedCats, src: fullPath, createdAt: serverTimestamp()
        });
        await loadGifts();
        clearForm();
        alert(`「${name}」を追加しました。`);
    } catch(e) {
        alert('保存に失敗しました: ' + e.message);
    }
};

window.deleteGift = async function(docId, name) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    try {
        await deleteDoc(doc(db, 'gifts', docId));
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
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <div class="list-info">
                <b>${gift.name}</b> <span style="color:#1976d2; font-size:0.85em;">[${catDisplay}]</span><br>
                <small style="color:#888;">${gift.src}</small>
            </div>
            <button onclick="deleteGift('${gift.id}', '${gift.name}')" class="btn-delete">削除</button>
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
