// ▼ マップ定義
const folderMap = {
    "ネタ": "ネタ", "笑": "笑", "定番": "定番",
    "専用": "専用", "えらい": "えらい", "挨拶": "挨拶", "ステージ": "ステージ", "LOVE": "Love"
};

let currentGifts = [];

// 初期化処理
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

// プレビュー更新
function updatePreview() {
    const cat = document.getElementById('g-category').value;
    const filebase = document.getElementById('g-filebase').value;
    const points = document.getElementById('g-points').value;
    const folder = folderMap[cat] || cat;
    const ptStr = points ? points : ""; 
    const fullPath = `ギフト/${folder}/${filebase}_${ptStr}pt.PNG`;
    document.getElementById('path-preview').textContent = fullPath;
}

// 追加機能
function addGift() {
    const name = document.getElementById('g-name').value;
    const cat = document.getElementById('g-category').value;
    const filebase = document.getElementById('g-filebase').value;
    const points = document.getElementById('g-points').value;

    if(!name || !filebase || !points) {
        alert("すべての項目を入力してください");
        return;
    }

    const folder = folderMap[cat] || cat;
    const fullPath = `ギフト/${folder}/${filebase}_${points}pt.PNG`;

    currentGifts.push({
        name: name,
        category: cat,
        src: fullPath
    });

    afterUpdate(`「${name}」を追加しました。`);
}

// 削除機能
function deleteGift(index) {
    const target = currentGifts[index];
    if(confirm(`「${target.name}」を本当に削除しますか？`)) {
        currentGifts.splice(index, 1);
        afterUpdate(`「${target.name}」を削除しました。`);
    }
}

// リスト描画
function renderGiftList() {
    const container = document.getElementById('gift-list-container');
    const searchText = document.getElementById('search-box').value.toLowerCase();
    container.innerHTML = '';

    currentGifts.forEach((gift, index) => {
        if (gift.name.toLowerCase().includes(searchText)) {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <div class="list-info">
                    <b>${gift.name}</b> <span style="color:#888; font-size:0.8em;">(${gift.category})</span><br>
                    <small style="color:#888;">${gift.src}</small>
                </div>
                <button onclick="deleteGift(${index})" class="btn-delete">削除</button>
            `;
            container.appendChild(div);
        }
    });
}

// 更新後の共通処理
function afterUpdate(msg) {
    document.getElementById('current-count').textContent = currentGifts.length;
    document.getElementById('g-name').value = '';
    document.getElementById('g-filebase').value = '';
    document.getElementById('g-points').value = '';
    updatePreview();
    renderGiftList();
    
    // スクロールしてメッセージ表示
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        alert(msg + "\n必ず一番上のボタンからJSONをダウンロードして保存してください。");
    }, 100);
}

// ダウンロード機能
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
