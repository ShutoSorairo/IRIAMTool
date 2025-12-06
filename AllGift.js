// カテゴリ一覧
const categories = [
    "ネタ", "笑", "定番", "専用", "えらい", "挨拶", "ステージ", "LOVE", "プチギフ", "ポイント別"
];

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    loadGifts();
});

async function loadGifts() {
    try {
        const response = await fetch('gifts.json');
        if (!response.ok) throw new Error("JSON not found");
        const gifts = await response.json();
        window.allGiftsData = gifts;
        showGifts(categories[0]);
    } catch (error) {
        console.error("Load Error:", error);
        document.getElementById('giftList').innerHTML = '<p>データの読み込みに失敗しました。</p>';
    }
}

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

function selectTab(category, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    showGifts(category);
}

function showGifts(category) {
    const giftList = document.getElementById('giftList');
    giftList.innerHTML = '';
    
    if (!window.allGiftsData) return;

    let filtered = [];

    // ▼ ポイント別 (100pt以上)
    if (category === "ポイント別") {
        const candidates = window.allGiftsData.filter(g => getPointValue(g.src) >= 100);
        filtered = removeDuplicates(candidates);
    } 
    // ▼ プチギフ (100pt未満)
    else if (category === "プチギフ") {
        const candidates = window.allGiftsData.filter(g => getPointValue(g.src) < 100);
        filtered = removeDuplicates(candidates);
    } 
    // ▼ 通常カテゴリ (複数対応版)
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

    // ポイント順に並び替え
    filtered.sort((a, b) => {
        return getPointValue(a.src) - getPointValue(b.src);
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
                <img src="${gift.src}" alt="${gift.name}" class="gift-img" loading="lazy">
            </div>
            <div class="gift-name">${gift.name}</div>
            <div class="gift-points">${pointsStr}</div>
        `;
        giftList.appendChild(item);
    });
}

function removeDuplicates(list) {
    const seen = new Set();
    return list.filter(item => {
        if (seen.has(item.src)) return false;
        seen.add(item.src);
        return true;
    });
}

function getPointValue(src) {
    const match = src.match(/_(\d+(?:,\d+)*)pt/i);
    return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
}
