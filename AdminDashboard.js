// フォルダマップ (画像パス生成用)
// ※カテゴリ選択とは独立して、画像をどこに置くか決めるために使います
const folderMap = {
    "ネタ": "ネタ", "笑": "笑", "定番": "定番",
    "専用": "専用", "えらい": "えらい", "挨拶": "挨拶", "ステージ": "ステージ", "LOVE": "Love"
};

let currentGifts = [];

window.onload = async function() {
    if (!sessionStorage.getItem('iriam_admin_logged_in')) {
        alert("ログインしてください");
        window.location.href = "AdminLogin.html";
        return;
    }
    try {
        const res = await fetch('gifts.json');
        if(res.ok) {
            currentGifts = await res.json();
            document.getElementById('current-count').textContent = currentGifts.length;
            renderGiftList();
        }
    } catch(e) { console.error("JSON読込エラー", e); }
    updatePreview();
};

function updatePreview() {
    const folderKey = document.getElementById('g-folder').value;
    const folder = folderMap[folderKey] || folderKey;
    
    const filebase = document.getElementById('g-filebase').value;
    const points = document.getElementById('g-points').value;
    const ptStr = points ? points : ""; 
    
    const fullPath = `ギフト/${folder}/${filebase}_${ptStr}pt.PNG`;
    document.getElementById('path-preview').textContent = fullPath;
}

function addGift() {
    const name = document.getElementById('g-name').value;
    const filebase = document.getElementById('g-filebase').value;
    const points = document.getElementById('g-points').value;
    
    // チェックボックスからカテゴリを取得
    const checkboxes = document.querySelectorAll('input[name="cats"]:checked');
    const selectedCats = Array.from(checkboxes).map(cb => cb.value);

    if(!name || !filebase || !points) {
        alert("名前、ファイル名、ポイントを入力してください");
        return;
    }
    if(selectedCats.length === 0) {
        alert("カテゴリを最低1つ選択してください");
        return;
    }

    // パス生成
    const folderKey = document.getElementById('g-folder').value;
    const folder = folderMap[folderKey] || folderKey;
    const fullPath = `ギフト/${folder}/${filebase}_${points}pt.PNG`;

    // ★ここが変更点: categories 配列として保存
    currentGifts.push({
        name: name,
        categories: selectedCats, // 配列
        src: fullPath
    });

    afterUpdate(`「${name}」を追加しました。\nカテゴリ: ${selectedCats.join(', ')}`);
}

function deleteGift(index) {
    const target = currentGifts[index];
    if(confirm(`「${target.name}」を削除しますか？`)) {
        currentGifts.splice(index, 1);
        afterUpdate(`「${target.name}」を削除しました。`);
    }
}

function renderGiftList() {
    const container = document.getElementById('gift-list-container');
    const searchText = document.getElementById('search-box').value.toLowerCase();
    container.innerHTML = '';

    currentGifts.forEach((gift, index) => {
        if (gift.name.toLowerCase().includes(searchText)) {
            // カテゴリ表示の処理 (配列か文字列かで分岐)
            let catDisplay = "";
            if (Array.isArray(gift.categories)) {
                catDisplay = gift.categories.join(", ");
            } else {
                catDisplay = gift.category || "なし";
            }

            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <div class="list-info">
                    <b>${gift.name}</b> <span style="color:#1976d2; font-size:0.85em;">[${catDisplay}]</span><br>
                    <small style="color:#888;">${gift.src}</small>
                </div>
                <button onclick="deleteGift(${index})" class="btn-delete">削除</button>
            `;
            container.appendChild(div);
        }
    });
}

function afterUpdate(msg) {
    document.getElementById('current-count').textContent = currentGifts.length;
    // 入力クリア
    document.getElementById('g-name').value = '';
    document.getElementById('g-filebase').value = '';
    document.getElementById('g-points').value = '';
    // チェックボックスもクリア
    document.querySelectorAll('input[name="cats"]').forEach(cb => cb.checked = false);
    
    updatePreview();
    renderGiftList();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        alert(msg + "\n忘れずにJSONをダウンロードしてください。");
    }, 100);
}

function downloadJSON() {
    const jsonStr = JSON.stringify(currentGifts, null, 2);
    const blob = new Blob([jsonStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "gifts.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
