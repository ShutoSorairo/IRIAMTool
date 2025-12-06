// カテゴリ一覧
const categories = [
   "ネタ", "笑", "定番", "専用", "えらい", "挨拶", "ステージ", "LOVE"
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

// ギフト表示（★ここを修正しました）
function showGifts(category) {
    const giftList = document.getElementById('giftList');
    giftList.innerHTML = '';
    
    if (!window.allGiftsData) return;

    // 1. カテゴリで絞り込み
    let filtered = window.allGiftsData.filter(g => g.category === category);

    // 2. ポイント順に並び替え (ポイントが同じなら元の順序を維持)
    filtered.sort((a, b) => {
        const ptA = getPointValue(a.src);
        const ptB = getPointValue(b.src);
        
        // ptA - ptB だと「低い順 (昇順)」
        // ptB - ptA だと「高い順 (降順)」になります
        return ptA - ptB; 
    });
    
    if (filtered.length === 0) {
        giftList.innerHTML = '<div style="text-align:center; color:#aaa; padding:20px;">このカテゴリのギフトはありません。</div>';
        return;
    }

    // 3. HTML生成
    filtered.forEach(gift => {
        // 表示用のポイント文字列を取得
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

// ★追加: ファイルパスから数値としてのポイントを取得する関数
function getPointValue(src) {
    // "_1,000pt" のような部分を探す
    const match = src.match(/_(\d+(?:,\d+)*)pt/i);
    if (match) {
        // カンマを除去して数値に変換 (例: "1,000" -> 1000)
        return parseInt(match[1].replace(/,/g, ''), 10);
    }
    return 0; // ポイント表記がない場合は0として扱う
}


