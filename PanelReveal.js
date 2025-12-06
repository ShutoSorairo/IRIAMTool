// ▼ パネルの裏に隠す景品データ（ラフ画を元に作成）
// 必要な数だけデータを追加・編集してください。
const panelData = [
    // ~えらいカテゴリ~ お見事！(500pt) × 5個
    ...Array(5).fill({ cat: "えらい", name: "お見事！", pt: 500 }),
    // ~ラブカテ~ 大好き or 10000pt × 1個
    { cat: "LOVE", name: "大好き or 1万pt", pt: 10000 },
    // お歌5曲 × 1個
    { cat: "その他", name: "お歌5曲", pt: 0 },
    // ~ミライトギフト~ ウィンクチャレンジ(500pt) × 5個
    ...Array(5).fill({ cat: "ミライト", name: "ウィンクCP", pt: 500 }),
    // ~ミライトギフト~ セレブレーション(1000pt) × 3個
    ...Array(3).fill({ cat: "ミライト", name: "セレブレーション", pt: 1000 }),
    // ~ラブカテ~ すこっていい？(500pt) × 2個
    ...Array(2).fill({ cat: "LOVE", name: "すこっていい？", pt: 500 }),
    // ~専用ギフト~ 神推し(100pt) × 10個
    ...Array(10).fill({ cat: "専用", name: "神推し", pt: 100 }),
    // ~専用ギフト~ のびのび猫(100pt) × 15個 (※数が多すぎたので調整しました)
    ...Array(15).fill({ cat: "専用", name: "のびのび猫", pt: 100 }),
    // コメント1000 × 1個
    { cat: "その他", name: "コメント1000", pt: 0 },
    // 調整用（空白のパネル）
    ...Array(5).fill({ cat: "-", name: "(ハズレ)", pt: 0 })
];

// パステルカラーのパレット（ラフ画の雰囲気）
const colorPalette = [
    "#ff9a9e", "#fad0c4", "#a18cd1", "#fbc2eb", "#8fd3f4", 
    "#84fab0", "#fccb90", "#d299c2", "#a8edea", "#fed6e3"
];

// 起動時の処理
document.addEventListener('DOMContentLoaded', () => {
    initPanels();
});

// パネルの初期化と生成
function initPanels() {
    const grid = document.getElementById('panel-grid');
    grid.innerHTML = ''; // 一旦空にする

    // データをシャッフル（順番をランダムにする）
    const shuffledData = shuffleArray([...panelData]);

    // データに基づいてパネル要素を作成
    shuffledData.forEach((data, index) => {
        const panel = document.createElement('div');
        panel.className = 'panel-item';
        
        // ランダムな色と形を適用
        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        const clipStyle = generateRandomClipPath();

        panel.innerHTML = `
            <div class="panel-inner">
                <div class="panel-front" style="background:${color}; ${clipStyle}">
                    <span style="opacity:0.7;">?</span>
                </div>
                <div class="panel-back">
                    <div class="prize-content">
                        <span class="prize-category">${data.cat}</span>
                        <span class="prize-name">${data.name}</span>
                        ${data.pt > 0 ? `<span class="prize-points">${data.pt}pt</span>` : ''}
                    </div>
                </div>
            </div>
        `;

        // クリックイベント（開く処理）
        panel.addEventListener('click', function() {
            this.classList.add('opened');
        });

        grid.appendChild(panel);
    });
}

// パネルを元に戻す（リセット）
function resetPanels() {
    if(confirm("すべてのパネルを閉じて、配置をシャッフルしますか？")) {
        const panels = document.querySelectorAll('.panel-item');
        panels.forEach(p => p.classList.remove('opened'));
        
        // アニメーション完了後に再生成
        setTimeout(() => {
            initPanels();
        }, 600);
    }
}

// 配列をシャッフルする関数（フィッシャー–イェーツ法）
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ランダムな多角形のスタイルを生成する関数
function generateRandomClipPath() {
    // 4隅の座標を少しランダムにずらす
    const tl = `${rnd(0,15)}% ${rnd(0,15)}%`;   // 左上
    const tr = `${rnd(85,100)}% ${rnd(0,15)}%`; // 右上
    const br = `${rnd(85,100)}% ${rnd(85,100)}%`; // 右下
    const bl = `${rnd(0,15)}% ${rnd(85,100)}%`;   // 左下
    
    // polygon関数で多角形を定義
    return `clip-path: polygon(${tl}, ${tr}, ${br}, ${bl});`;
}

// 指定範囲のランダムな整数を返す補助関数
function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
