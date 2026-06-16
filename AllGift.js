const categories = [
    "おもちゃ", "ネタ", "笑", "定番", "専用", "えらい", "挨拶", "ステージ", "LOVE", "ポイント別"
];

let gifts = [];
let sortMode = 'pt_asc'; // 'pt_asc' | 'pt_desc' | 'add_asc' | 'add_desc'

window.setSort = function(mode) {
    sortMode = mode;
    const activeBtn = document.querySelector('.tab-btn.active');
    if (activeBtn) showGifts(activeBtn.textContent);
};

async function loadGiftsFromFirestore() {
    gifts = [];
    try {
        const { db } = await import('./firebase-config.js');
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js");

        // 共通ギフト
        const sharedSnap = await getDocs(collection(db, 'gifts'));
        sharedSnap.forEach(d => {
            const g = d.data();
            const cats = Array.isArray(g.categories) ? g.categories : [g.category];
            const createdAt = g.createdAt?.toMillis?.() ?? 0;
            cats.forEach(cat => gifts.push({ name: g.name, category: cat, src: g.src, createdAt }));
        });

        // 専用ギフト（ログイン中ユーザー）
        const uid = localStorage.getItem('iriam_uid');
        if (uid) {
            const userSnap = await getDocs(collection(db, 'users', uid, 'gifts'));
            userSnap.forEach(d => {
                const g = d.data();
                const cats = Array.isArray(g.categories) ? g.categories : [g.category];
                const createdAt = g.createdAt?.toMillis?.() ?? 0;
                cats.forEach(cat => gifts.push({ name: g.name, category: cat, src: g.src, createdAt }));
            });
        }
    } catch(e) {
        console.warn('Firestore読込失敗:', e);
    }
}

async function init() {
    await loadGiftsFromFirestore();

    const tabContainer = document.getElementById('tabContainer');
    categories.forEach((cat, idx) => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn' + (idx === 0 ? ' active' : '');
        btn.textContent = cat;
        btn.onclick = () => selectTab(cat, btn);
        tabContainer.appendChild(btn);
    });
    showGifts(categories[0]);
}

document.addEventListener('DOMContentLoaded', init);

window.reloadGifts = async function() {
    await loadGiftsFromFirestore();
    const activeBtn = document.querySelector('.tab-btn.active');
    if (activeBtn) showGifts(activeBtn.textContent);
};

function selectTab(category, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    showGifts(category);
}

function ptValue(src) {
    const m = src.match(/_(\d+(?:,\d+)*)pt/i);
    return m ? parseInt(m[1].replace(/,/g, '')) : 0;
}

function renderGift(gift) {
    const match = gift.src.match(/_(\d+(?:,\d+)*)pt/i);
    const points = match ? match[1] + 'pt' : '';
    const card = document.createElement('div');
    card.className = 'gift-card';
    card.innerHTML = `
        <div class="gift-img-wrap">
            <img src="${gift.src}" alt="${gift.name}" loading="lazy">
        </div>
        <div class="gift-name">${gift.name}</div>
        <div class="gift-pts"><span class="coin-icon"></span>${points}</div>
    `;
    return card;
}

function showGifts(category) {
    const giftList = document.getElementById('giftList');
    giftList.className = 'gift-grid';
    giftList.innerHTML = '';

    if (category === 'ポイント別') {
        const map = new Map();
        gifts.filter(g => ptValue(g.src) >= 100).forEach(g => {
            if (map.has(g.name)) {
                map.get(g.name).cats.push(g.category);
            } else {
                map.set(g.name, { ...g, cats: [g.category] });
            }
        });
        const filtered = [...map.values()].sort((a, b) => ptValue(a.src) - ptValue(b.src));
        if (filtered.length === 0) {
            giftList.innerHTML = '<div style="text-align:center;color:#aaa;grid-column:1/-1;">該当するギフトはありません。</div>';
            return;
        }
        filtered.forEach(gift => {
            const match = gift.src.match(/_(\d+(?:,\d+)*)pt/i);
            const points = match ? match[1] + 'pt' : '';
            const card = document.createElement('div');
            card.className = 'gift-card';
            card.innerHTML = `
                <div class="gift-img-wrap"><img src="${gift.src}" alt="${gift.name}" loading="lazy"></div>
                <div class="gift-name">${gift.name}<br><span style="font-size:10px;color:#999;">[${gift.cats.join('、')}]</span></div>
                <div class="gift-pts"><span class="coin-icon"></span>${points}</div>
            `;
            giftList.appendChild(card);
        });
        return;
    }

    let filtered = gifts.filter(g => g.category === category);
    if (filtered.length === 0) {
        giftList.innerHTML = '<div style="text-align:center;color:#aaa;grid-column:1/-1;">このカテゴリのギフトはありません。</div>';
        return;
    }
    if (sortMode === 'pt_asc') {
        filtered = filtered.slice().sort((a, b) => ptValue(a.src) - ptValue(b.src));
    } else if (sortMode === 'pt_desc') {
        filtered = filtered.slice().sort((a, b) => ptValue(b.src) - ptValue(a.src));
    } else if (sortMode === 'add_asc') {
        filtered = filtered.slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    } else {
        filtered = filtered.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    filtered.forEach(gift => giftList.appendChild(renderGift(gift)));
}
