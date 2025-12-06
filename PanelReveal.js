// ▼ パネルに表示するミッションデータ
// ラフ画の内容を元に作成しました
const missions = [
    { cat: "～えらいカテゴリ～", text: "お見事！\n(500pt)\n5個" },
    { cat: "～ラブカテ～", text: "大好き\nor\n10000pt" },
    { cat: "～その他～", text: "お歌5曲" },
    { cat: "～ミライトギフト～", text: "ウィンクCP\n(500pt)\n5個" },
    { cat: "～ミライトギフト～", text: "セレブレーション\n(1000pt)\n3個" },
    { cat: "～ラブカテ～", text: "すこっていい？\n(500pt)\n2個" },
    { cat: "～専用ギフト～", text: "神推し\n(100pt)\n10個" },
    { cat: "～専用ギフト～", text: "のびのび猫\n(100pt)\n20個" },
    { cat: "～その他～", text: "コメント\n1000個" },
    
    // 足りない分はランダムや繰り返しで埋めるための予備データ
    { cat: "Free", text: "お好きなギフト\n1個" },
    { cat: "Chance", text: "リクエスト\n1曲" },
    { cat: "Bonus", text: "スクショ\nタイム" },
    { cat: "Mission", text: "セリフ枠\n実施" },
    { cat: "Mission", text: "延長\n30分" },
    { cat: "Mission", text: "初見さん\n挨拶" },
    { cat: "Mission", text: "定期\nツイート" }
];

// パステルカラーのパレット
const colors = [
    "#ffccbc", "#ffe0b2", "#ffecb3", "#dcedc8", "#b2dfdb",
    "#b3e5fc", "#e1bee7", "#f8bbd0", "#cfd8dc"
];

document.addEventListener('DOMContentLoaded', () => {
    initBoard();
    
    // 画像アップロード機能
    document.getElementById('imageInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('hidden-image').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
});

function initBoard() {
    const grid = document.getElementById('panel-grid');
    grid.innerHTML = '';

    // ミッションをシャッフル
    const shuffled = shuffle([...missions]);
    
    // 現在のCSSグリッド設定に合わせてパネル数を調整（例: 4x4=16枚）
    // CSSの grid-template-columns / rows に合わせて数を調整してください
    const totalPanels = 16; 

    // データが足りない場合はループさせる
    while (shuffled.length < totalPanels) {
        shuffled.push(...missions);
    }

    for (let i = 0; i < totalPanels; i++) {
        const data = shuffled[i];
        const panel = document.createElement('div');
        panel.className = 'panel-item';
        
        // ランダムな色付け
        const bg = colors[Math.floor(Math.random() * colors.length)];
        panel.style.backgroundColor = bg;

        // 改行コード(\n)を<br>に変換
        const formattedText = data.text.replace(/\n/g, '<br>');

        panel.innerHTML = `
            <div class="mission-cat">${data.cat}</div>
            <div class="mission-text">${formattedText}</div>
        `;

        // クリックで消えるイベント
        panel.addEventListener('click', function() {
            // クラスを付与して透明にする（完全に消すとレイアウトが崩れるためopacity:0にする）
            this.classList.add('cleared');
        });

        grid.appendChild(panel);
    }
}

function resetPanels() {
    if(confirm("パネルを全て元に戻しますか？")) {
        const panels = document.querySelectorAll('.panel-item');
        panels.forEach(p => p.classList.remove('cleared'));
        
        // 少し待ってから中身をシャッフルし直す
        setTimeout(initBoard, 500);
    }
}

// シャッフル関数
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
