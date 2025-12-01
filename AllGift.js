// カテゴリ一覧
const categories = [
    "ミライト復刻", "季節", "ネタ", "笑", "定番", "専用", "えらい", "挨拶", "ステージ", "LOVE"
];

// メイン処理
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    loadGifts(); // データを読み込み開始
});

// JSONを読み込んで表示する関数
async function loadGifts() {
    try {
        // gifts.json を取得
        const response = await fetch('gifts.json');
        if (!response.ok) {
            throw new Error("JSONデータの読み込みに失敗しました");
        }
        
        // JSONデータをJavaScriptの配列に変換
        const gifts = await response.json();

        // 最初のタブを表示（データ渡し）
        showGifts(categories[0], gifts);
        
        // タブ切り替え時のためにデータを保持しておく仕組みが必要なら
        // グローバル変数に入れるか、都度フィルタリングします
        window.allGiftsData = gifts; 

    } catch (error) {
        console.error(error);
        document.getElementById('giftList').innerHTML = '<p>データの読み込みに失敗しました。</p>';
    }
}

function setupTabs() {
    const tabContainer = document.getElementById('tabContainer');
    categories.forEach((cat, idx) => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn' + (idx === 0 ? ' active' : '');
        btn.textContent = cat;
        btn.onclick = () => selectTab(cat, btn);
        tabContainer.appendChild(btn);
    });
}

function selectTab(category, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // 読み込み済みのデータを使って再表示
    if (window.allGiftsData) {
        showGifts(category, window.allGiftsData);
    }
}

function showGifts(category, giftsData) {
    const giftList = document.getElementById('giftList');
    giftList.innerHTML = '';
    
    // カテゴリでフィルタリング
    const filtered = giftsData.filter(g => g.category === category);
    
    if (filtered.length === 0) {
        giftList.innerHTML = '<div style="text-align:center; color:#aaa;">このカテゴリのギフトはありません。</div>';
        return;
    }

    filtered.forEach(gift => {
        // src から "_◯pt" を抽出
        const match = gift.src.match(/_(\d+(?:,\d+)*)pt/i);
        const points = match ? match[1] + 'pt' : '';

        const item = document.createElement('div');
        item.className = 'gift-item';
        item.innerHTML = `
            <div class="gift-icon">
                <img src="${gift.src}" alt="${gift.name}" class="gift-img" style="width:40px;height:40px;">
            </div>
            <div class="gift-name">${gift.name}</div>
            <div class="gift-points">${points}</div>
        `;
        giftList.appendChild(item);
    });
}
