let deleteMode = false;

// ページ読み込み時にテーブル描画
window.addEventListener('DOMContentLoaded', function() {
    renderTable();
});

document.getElementById('delete-mode-btn').addEventListener('click', function() {
    deleteMode = !deleteMode;
    // ボタンの見た目変更
    if (deleteMode) {
        this.title = "削除モード解除";
        this.style.background = "#e53935";
        this.querySelector('svg').style.fill = "#fff";
    } else {
        this.title = "削除モード";
        this.style.background = "";
        this.querySelector('svg').style.fill = "#888";
    }
    document.getElementById('delete-header').style.display = deleteMode ? "" : "none";
    renderTable();
});

function getMusicData() {
    return JSON.parse(localStorage.getItem('musicData') || '[]');
}

function saveMusicData(data) {
    localStorage.setItem('musicData', JSON.stringify(data));
}

function renderTable() {
    const tbody = document.getElementById('music-table-body');
    tbody.innerHTML = '';
    const data = getMusicData();
    data.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.source}</td>
            <td>${item.code}</td>
            <td>${item.title}</td>
            <td>${item.artist}</td>
            <td>${item.lyricist}</td>
            <td>${item.composer}</td>
            ${deleteMode ? `<td><button type="button" onclick="deleteRow(${idx})" class="trash-btn" title="削除">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#888" viewBox="0 0 24 24">
                    <path d="M3 6h18v2H3V6zm2 3h14l-1.5 13h-11L5 9zm5 2v8h2v-8h-2zm-4 0v8h2v-8H6zm8 0v8h2v-8h-2z"/>
                </svg>
            </button></td>` : ""}
        `;
        tbody.appendChild(tr);
    });
}

window.deleteRow = function(idx) {
    if (confirm("本当にこの行を削除しますか？")) {
        const data = getMusicData();
        data.splice(idx, 1);
        saveMusicData(data);
        renderTable();
    }
};

function isValidCode(source, code) {
    if (source === "JASRAC") {
        return /^\d{3}-\d{4}-\d{1}$/.test(code);
    } else if (source === "NexTone") {
        return /^N\d{8}$/.test(code);
    }
    return false;
}

document.getElementById('music-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const source = document.getElementById('source').value;
    const code = document.getElementById('code').value;
    const title = document.getElementById('title').value;
    const artist = document.getElementById('artist').value;
    const lyricist = document.getElementById('lyricist').value;
    const composer = document.getElementById('composer').value;

    if (!isValidCode(source, code)) {
        if (source === "JASRAC") {
            alert('JASRACの作品コード形式が正しくありません。\n例: 123-4567-8');
        } else if (source === "NexTone") {
            alert('NexToneの作品コード形式が正しくありません。\n例: N12345678');
        } else {
            alert('管理元を選択してください。');
        }
        return;
    }

    const data = getMusicData();
    data.push({ source, code, title, artist, lyricist, composer });
    saveMusicData(data);
    renderTable();
    this.reset(); // 追加後にフォーム内のデータを削除
});