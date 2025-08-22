// 楽曲データを隠しファイル（.musicData.js）に保存・取得する関数例

// 保存
function saveMusicData(data) {
    window.musicData = data;
}

// 取得
function getMusicData() {
    return window.musicData || [];
}

// 初期化（必要なら）
if (!window.musicData) {
    window.musicData = [];
}