// --- データ管理 ---
let panels = []; 
let editPoints = []; 
let isEditMode = false;
let currentMousePos = null; 

// 背景画像保持用
let backgroundImage = new Image();

// ギフトデータ用（必要に応じて）
let allGifts = [];

// --- ページ読み込み時の初期化 ---
window.onload = function() {
    // PSD読み込みイベントの登録
    const psdInput = document.getElementById('psd-upload');
    if (psdInput) {
        psdInput.addEventListener('change', handlePSDInput);
    }

    // 既存の背景アップロード（通常の画像）
    const bgUpload = document.getElementById('bg-upload');
    if (bgUpload) {
        bgUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = document.getElementById('hidden-image');
                    img.src = ev.target.result;
                    backgroundImage.src = ev.target.result;
                    document.getElementById('no-image-text').style.display = 'none';
                    renderCanvas();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // パネルリセットボタン
    const resetBtn = document.getElementById('reset-panels');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("すべてのパネルを削除しますか？")) {
                panels = [];
                renderCanvas();
                renderControlList();
            }
        });
    }
};

/**
 * PSDファイルを解析してパネルと背景を一括設定する
 */
function handlePSDInput(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const buffer = event.target.result;
        
        // ブラウザ版 PSD.js の取得
        const PSD = window.require ? window.require("psd") : window.PSD;
        if (!PSD) {
            alert("PSD.js ライブラリが読み込まれていません。");
            return;
        }

        const psd = new PSD(new Uint8Array(buffer));
        
        try {
            psd.parse();
        } catch (err) {
            alert("PSDの解析に失敗しました。ファイルが破損しているか、対応していない形式（RGBモード以外など）の可能性があります。");
            console.error(err);
            return;
        }

        // 1. 全レイヤーを取得（グループを除外し、実際のレイヤーのみを抽出）
        // descendants() は重なり順の「上から順」に取得される
        let allLayers = psd.tree().descendants().filter(n => n.isLayer());
        
        if (allLayers.length < 2) {
            alert("背景とパネル、最低2枚のレイヤーが必要です。");
            return;
        }

        // 2. 背景の処理（一番下のレイヤーを抽出）
        // pop() は配列の最後の要素（＝一番下のレイヤー）を取り出す
        const bgNode = allLayers.pop(); 
        const bgImageBase64 = bgNode.layer.image.toPng().src;
        
        const hiddenImg = document.getElementById('hidden-image');
        hiddenImg.src = bgImageBase64;
        backgroundImage.src = bgImageBase64;
        document.getElementById('no-image-text').style.display = 'none';

        // 3. パネルの処理（残りのレイヤーをすべてパネルに変換）
        panels = allLayers.map(layer => {
            const node = layer.export();
            return {
                id: 'panel-' + Date.now() + Math.random().toString(36).substr(2, 9),
                name: node.name,
                x: node.left,
                y: node.top,
                width: node.width,
                height: node.height,
                isRevealed: false,
                assignedGift: null,
                // PSDの座標情報を維持した多角形データ（長方形として生成）
                points: [
                    {x: node.left, y: node.top},
                    {x: node.left + node.width, y: node.top},
                    {x: node.left + node.width, y: node.top + node.height},
                    {x: node.left, y: node.top + node.height}
                ]
            };
        });

        // 背景の読み込み完了を待ってから再描画
        backgroundImage.onload = () => {
            renderCanvas(); 
            renderControlList();
            alert(`背景をセットし、${panels.length}枚のパネルを読み込みました。`);
        };
    };
    reader.readAsArrayBuffer(file);
}

/**
 * キャンバス（SVGエリア）の描画更新
 */
function renderCanvas() {
    const svg = document.getElementById('panel-svg');
    if (!svg) return;
    svg.innerHTML = '';

    panels.forEach(panel => {
        if (panel.isRevealed) return; // 開けられたパネルは描画しない

        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const pointsStr = panel.points.map(p => `${p.x},${p.y}`).join(' ');
        
        polygon.setAttribute("points", pointsStr);
        polygon.setAttribute("fill", "#1976d2"); // パネルの色
        polygon.setAttribute("stroke", "white");
        polygon.setAttribute("stroke-width", "2");
        polygon.setAttribute("opacity", "0.8");
        polygon.style.cursor = "pointer";

        // クリックでパネルを開くイベント
        polygon.onclick = () => revealPanel(panel.id);
        
        svg.appendChild(polygon);
    });
}

/**
 * 操作パネル側のリスト描画更新
 */
function renderControlList() {
    const listArea = document.getElementById('control-list');
    if (!listArea) return;
    
    if (panels.length === 0) {
        listArea.innerHTML = '<div style="color:#999; padding:20px;">パネルを作成してください</div>';
        return;
    }

    listArea.innerHTML = '';
    panels.forEach(panel => {
        const item = document.createElement('div');
        item.className = 'control-item';
        item.style.padding = '10px';
        item.style.borderBottom = '1px solid #eee';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        
        item.innerHTML = `
            <span>${panel.name}</span>
            <button onclick="revealPanel('${panel.id}')" class="btn-sm">
                ${panel.isRevealed ? '閉じる' : '開ける'}
            </button>
        `;
        listArea.appendChild(item);
    });
}

/**
 * パネルを開く/閉じる
 */
function revealPanel(panelId) {
    const panel = panels.find(p => p.id === panelId);
    if (panel) {
        panel.isRevealed = !panel.isRevealed;
        renderCanvas();
        renderControlList();
    }
}

// モード切替（HTMLのonclick="setMode"に対応）
function setMode(mode) {
    isEditMode = (mode === 'edit');
    document.getElementById('btn-play').classList.toggle('active', mode === 'play');
    document.getElementById('btn-edit').classList.toggle('active', mode === 'edit');
    document.getElementById('instruction').style.display = isEditMode ? 'block' : 'none';
}
