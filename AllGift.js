// カテゴリ一覧
const categories = [
    "New", "季節", "ネタ", "笑", "定番", "えらい", "挨拶", "ステージ", "LOVE"
];

// 仮のギフトデータ（カテゴリ追加）
const gifts = [
    
    // ネタカテゴリ
    { name: 'もういっかい！', icon: '', category: 'ネタ' },
    { name: 'ダウト', icon: '', category: 'ネタ' },
    { name: 'ざわ…ざわ…', icon: '', category: 'ネタ' },
    { name: 'ファイヤー', icon: '🔥', category: 'ネタ' },
    { name: '非常口', icon: '', category: 'ネタ' },
    { name: 'いつもので', icon: '', category: 'ネタ' },
    { name: 'かー', icon: '', category: 'ネタ' },
    { name: 'つー', icon: '🎤', category: 'ネタ' },
    { name: '一体感', icon: '', category: 'ネタ' },
    { name: '乗りなッ！', icon: '', category: 'ネタ' },
    { name: '降りろ…', icon: '', category: 'ネタ' },
    { name: '一体感', icon: '', category: 'ネタ' },
    { name: 'しーっ', icon: '', category: 'ネタ' },
    { name: 'はて…？', icon: '', category: 'ネタ' },
    { name: 'やれやれ', icon: '', category: 'ネタ' },
    { name: 'ばぁ。', icon: '', category: 'ネタ' },
    { name: '完全燃焼', icon: '', category: 'ネタ' },
    { name: '激熱', icon: '', category: 'ネタ' },
    { name: 'まぶしい', icon: '', category: 'ネタ' },
    { name: '世界一', icon: '', category: 'ネタ' },
    { name: '祭うちわ', icon: '', category: 'ネタ' },
    { name: 'ええやん', icon: '', category: 'ネタ' },
    { name: '最強', icon: '', category: 'ネタ' },
    { name: 'スリスリ', icon: '', category: 'ネタ' },
    { name: '中二病', icon: '', category: 'ネタ' },
    { name: '拳', icon: '🤛', category: 'ネタ' },
    { name: 'ふぅー！！', icon: '', category: 'ネタ' },
    { name: 'メシウマ', icon: '', category: 'ネタ' },
    { name: 'アニキー！', icon: '', category: 'ネタ' },
    { name: '仰せのままに', icon: '', category: 'ネタ' },
    { name: '漢', icon: '', category: 'ネタ' },
    { name: '鉄アレイ', icon: '', category: 'ネタ' },
    { name: 'しおしお…', icon: '', category: 'ネタ' },
    { name: 'ヒャッホー！', icon: '', category: 'ネタ' },
    { name: 'あざとい', icon: '', category: 'ネタ' },
    { name: 'おもしれーやつ', icon: '', category: 'ネタ' },
    { name: '沼', icon: '', category: 'ネタ' },
    { name: '鳥肌注意', icon: '', category: 'ネタ' },
    { name: 'スヤァ…', icon: '', category: 'ネタ' },
    { name: 'やりおる', icon: '', category: 'ネタ' },
    { name: 'あとは頼んだ', icon: '', category: 'ネタ' },
    { name: 'おねぎします。', icon: '', category: 'ネタ' },
    { name: 'まかセロリ', icon: '', category: 'ネタ' },
    { name: 'ドヤッ', icon: '', category: 'ネタ' },
    { name: 'ぱぁ', icon: '', category: 'ネタ' },
    { name: 'チャージ！', icon: '', category: 'ネタ' },
    { name: 'ひんやり', icon: '', category: 'ネタ' },
    { name: 'アヂッ', icon: '', category: 'ネタ' },
    { name: 'つむっ！！', icon: '', category: 'ネタ' },
    { name: 'しらすまん', icon: '', category: 'ネタ' },
    { name: 'ダウト(200pt)', icon: '', category: 'ネタ' },
    { name: '爆弾', icon: '', category: 'ネタ' },

    // LOVEカテゴリ
    { name: '好物', category: 'LOVE' },
    { name: 'ハート', category: 'LOVE' },
    { name: 'かわいい', icon: '', category: 'LOVE' },
    { name: '照', category: 'LOVE' },
    { name: 'キャーッ！', category: 'LOVE' },
    { name: 'あざとい', category: 'LOVE' },
    { name: 'かわぼ', category: 'LOVE' },
    { name: '呼んだ？', category: 'LOVE' },
    { name: 'ハート(200pt)', category: 'LOVE' },
    { name: 'すこっていい？', category: 'LOVE' },
    { name: '嫁に来ないか', category: 'LOVE' }, 
    { name: 'ずっきゅーん', category: 'LOVE' },
    { name: '唐突な愛', category: 'LOVE' },
    { name: 'ウィンクタイム', category: 'LOVE' },
    { name: 'すこ', category: 'LOVE' },    
    { name: 'かわいい！(3,000pt)', category: 'LOVE' },
    { name: '尊い', category: 'LOVE' },
    { name: 'なでなで', category: 'LOVE' },
    { name: 'だいすき', category: 'LOVE' },
    { name: 'あふれる想い', category: 'LOVE' }
];

// ギフト名と画像ファイル名の対応リスト
const loveGiftImages = [
    { keyword: '好物', src: 'ギフト/Love/01_好物.PNG', alt: '好物' },
    { keyword: 'ハート', src: 'ギフト/Love/02_ハート.PNG', alt: 'ハート' },
    { keyword: 'かわいい', src: 'ギフト/Love/03_かわいい.PNG', alt: 'かわいい' },
    { keyword: '照', src: 'ギフト/Love/04_照れ.PNG', alt: '照' },
    { keyword: 'キャーッ！', src: 'ギフト/Love/05_キャーッ.jpg', alt: 'キャーッ！' },
    { keyword: 'あざとい', src: 'ギフト/Love/06_あざとい.jpg', alt: 'あざとい' },
    { keyword: 'かわぼ', src: 'ギフト/Love/07_かわぼ.jpg', alt: 'かわぼ' },
    { keyword: '呼んだ？', src: 'ギフト/Love/08_呼んだ？.jpg', alt: '呼んだ？' },
    { keyword: 'ハート(200pt)', src: 'ギフト/Love/09_ハート(大)_200pt.PNG', alt: 'ハート(200pt)' },
    { keyword: 'すこっていい？', src: 'ギフト/Love/10_すっこていい？_500pt.PNG', alt: '呼んだ？' },
    { keyword: '嫁に来ないか', src: 'ギフト/Love/11_嫁に来ないか・・・？_500pt.PNG', alt: '嫁に来ないか' },
    { keyword: 'ずっきゅーん', src: 'ギフト/Love/12_ズキューン_500pt.PNG', alt: 'ずっきゅーん' },
    { keyword: '唐突な愛', src: 'ギフト/Love/13_唐突な愛.jpg', alt: '唐突な愛' },
    { keyword: 'ウィンクタイム', src: 'ギフト/Love/14_ウィンクタイム.jpg', alt: 'ウィンクタイム' },
    { keyword: 'すこ', src: 'ギフト/Love/15_すこ_1,000pt.PNG', alt: 'すこ' }, 
    { keyword:'かわいい！(3,000pt)', src: 'ギフト/Love/16_かわいい_3,000pt.PNG', alt: 'かわいい！(3,000pt)' },
    { keyword: '尊い', src: 'ギフト/Love/17_尊い_5,000pt.PNG', alt: '尊い' },
    { keyword: 'なでなで', src: 'ギフト/Love/18_なでなで_7,000pt.PNG', alt: 'なでなで' },
    { keyword: 'だいすき', src: 'ギフト/Love/19_だいすき_10,000pt.PNG', alt: 'だいすき' },
    { keyword: 'あふれる想い', src: 'ギフト/Love/20_あふれる想い_30,000pt.PNG', alt: 'あふれる想い' }   
];

// タブ生成
const tabContainer = document.getElementById('tabContainer');
categories.forEach((cat, idx) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (idx === 0 ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => selectTab(cat, btn);
    tabContainer.appendChild(btn);
});

// タブ選択時の処理
function selectTab(category, btn) {
    // タブのactive切り替え
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // ギフト表示
    showGifts(category);
}

// ギフト表示
function showGifts(category) {
    const giftList = document.getElementById('giftList');
    giftList.innerHTML = '';
    const filtered = gifts.filter(g => g.category === category);
    if (filtered.length === 0) {
        giftList.innerHTML = '<div style="text-align:center; color:#aaa;">このカテゴリのギフトはありません。</div>';
        return;
    }
    filtered.forEach(gift => {
        let iconHtml = gift.icon;
        // LOVEカテゴリで画像対応（完全一致のみ）
        if (category === 'LOVE') {
            const found = loveGiftImages.find(img => gift.name === img.keyword);
            if (found) {
                iconHtml = `<img src="${found.src}" alt="${found.alt}" class="gift-img" style="width:40px;height:40px;">`;
            }
        }
        const item = document.createElement('div');
        item.className = 'gift-item';
        item.innerHTML = `
            <div class="gift-icon">${iconHtml}</div>
            <div class="gift-name">${gift.name}</div>
        `;
        giftList.appendChild(item);
    });
}

// 初期表示

showGifts(categories[0]);

