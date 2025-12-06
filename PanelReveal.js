// パネルの設定データ
// ※自由な形にしたい場合は、ここの width/height/top/left を手動で編集可能です
let panels = [];

document.addEventListener('DOMContentLoaded', () => {
    // 画像アップロード処理
    const input = document.getElementById('imageInput');
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('file-name').textContent = file.name;
            const reader = new FileReader();
            reader.onload = function(evt) {
                const img = document.getElementById('hidden-image');
                img.src = evt.target.result;
                img.onload = () => adjustBoardSize(img);
                document.getElementById('no-image-text').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });
});

// 画像の比率に合わせてボードサイズを調整
function adjustBoardSize(img) {
    const wrapper = document.getElementById('board-wrapper');
    const aspect = img.naturalWidth / img.naturalHeight;
    // CSSのaspect-ratioを設定して比率を固定
    wrapper.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
    
    // パネルを再生成
    generateGrid();
}

// グリッド生成（または自由定義データの読み込み）
function generateGrid() {
    const layer = document.getElementById('panel-layer');
    layer.innerHTML = '';
    panels = [];

    const cols = parseInt(document.getElementById('grid-cols').value);
    const rows = parseInt(document.getElementById('grid-rows').value);
    const defaultTarget = parseInt(document.getElementById('default-target').value);

    const widthPct = 100 / cols;
    const heightPct = 100 / rows;

    // パネルを生成して配置
    let idCounter = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const panelData = {
                id: idCounter++,
                top: r * heightPct,
                left: c * widthPct,
                width: widthPct,
                height: heightPct,
                current: 0,
                target: defaultTarget,
                label: `No.${idCounter}` // 必要に応じて "お見事" などに変更可
            };
            panels.push(panelData);
            createPanelElement(panelData, layer);
        }
    }
}

// パネルのDOM要素を作成
function createPanelElement(data, container) {
    const div = document.createElement('div');
    div.className = 'panel-item';
    // 位置とサイズ指定 (％指定なので画像サイズが変わっても追従します)
    div.style.top = data.top + '%';
    div.style.left = data.left + '%';
    div.style.width = data.width + '%';
    div.style.height = data.height + '%';
    div.id = `p-${data.id}`;

    // 中身のHTML
    div.innerHTML = `
        <div class="panel-info">
            <div id="label-${data.id}">${data.label}</div>
            <div id="count-${data.id}">0 / ${data.target}</div>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" id="bar-${data.id}"></div>
        </div>
        <button class="counter-btn" onclick="increment(${data.id})">＋</button>
        
        <button class="open-btn" id="btn-${data.id}" onclick="openPanel(${data.id})">
            OPEN
            <span>Click!</span>
        </button>
    `;

    container.appendChild(div);
}

// カウントアップ処理
function increment(id) {
    const panel = panels.find(p => p.id === id);
    if (!panel) return;

    panel.current++;
    updatePanelUI(panel);
}

// UI更新 & 達成判定
function updatePanelUI(panel) {
    // 表示更新
    document.getElementById(`count-${panel.id}`).textContent = `${panel.current} / ${panel.target}`;
    
    // バー更新
    const pct = Math.min(100, (panel.current / panel.target) * 100);
    document.getElementById(`bar-${panel.id}`).style.width = pct + '%';

    // 達成チェック
    if (panel.current >= panel.target) {
        const btn = document.getElementById(`btn-${panel.id}`);
        btn.style.display = 'flex'; // OPENボタンを表示
    }
}

// パネルを開く（消す）処理
function openPanel(id) {
    const el = document.getElementById(`p-${id}`);
    el.classList.add('cleared'); // CSSアニメーションで消す
}
