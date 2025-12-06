// カテゴリ一覧
const categories = [
    "ネタ", "笑", "定番", "専用", "えらい", "挨拶", "ステージ", "LOVE", "プチギフ", "ポイント別"
];

// メイン処理
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    loadGifts();
});

// JSON読み込み
async function loadGifts() {
    try {
        const response = await fetch('gifts.json');
        if (!response.ok) throw new Error("JSON not found");
        
        const gifts = await response.json();
        window.allGiftsData = gifts; // データを保存
        
        showGifts(categories[0]); // 初期表示

    } catch (error) {
        console.error("Load Error:", error);
        document.getElementById('giftList').innerHTML = '<p>データの読み込みに失敗しました。</p>';
    }
}

// タブ作成
function setupTabs() {
    const tabContainer = document.getElementById('tabContainer');
    tabContainer.innerHTML = '';
    categories.forEach((cat, idx) => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn' + (idx === 0 ? ' active' : '');
        btn.textContent = cat;
        btn.onclick = () => selectTab(cat, btn);
        tabContainer.appendChild(btn);
    });
}

// タブ切り替え
function selectTab(category, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    showGifts(category);
}

// ギフト表示
function showGifts(category) {
    const giftList = document.getElementById('giftList');
    giftList.innerHTML = '';
    
    if (!window.allGiftsData) return;

    let filtered = [];

    // ▼ ポイント別 (100pt以上) ※重複削除なし
    if (category === "ポイント別") {
        filtered = window.allGiftsData.filter(g => {
            return getPointValue(g.src) >= 100;
        });
    } 
    // ▼ プチギフ (100pt未満) ※重複削除なし
    else if (category === "プチギフ") {
        filtered = window.allGiftsData.filter(g => {
            return getPointValue(g.src) < 100;
        });
    } 
    // ▼ 通常カテゴリ
    else {
        filtered = window.allGiftsData.filter(g => {
            // 新仕様: categories配列を持っている場合
            if (Array.isArray(g.categories)) {
                return g.categories.includes(category);
            }
            // 旧仕様: category文字列の場合
            return g.category === category;
        });
    }

    // ポイント順に並び替え (昇順)
    filtered.sort((a, b) => {
        const ptA = getPointValue(a.src);
        const ptB = getPointValue(b.src);
        return ptA - ptB; 
    });
    
    if (filtered.length === 0) {
        giftList.innerHTML = '<div style="text-align:center; color:#aaa; padding:20px;">該当するギフトはありません。</div>';
        return;
    }

    // HTML生成
    filtered.forEach(gift => {
        const match = gift.src.match(/_(\d+(?:,\d+)*)pt/i);
        const pointsStr = match ? match[1] + 'pt' : '';

        const item = document.createElement('div');
        item.className = 'gift-item';
        item.innerHTML = `
            <div class="gift-icon">
                <img src="${gift.src}" alt="${gift.name}" class="gift-img" loading="lazy" style="width:40px;height:40px;">
            </div>
            <div class="gift-name">${gift.name}</div>
            <div class="gift-points">${pointsStr}</div>
        `;
        giftList.appendChild(item);
    });
}

// ポイント取得関数
function getPointValue(src) {
    const match = src.match(/_(\d+(?:,\d+)*)pt/i);
    if (match) {
        return parseInt(match[1].replace(/,/g, ''), 10);
    }
    return 0;
}
