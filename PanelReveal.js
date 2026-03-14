// --- データ管理 ---
let panels = []; 
let isEditMode = false;
let backgroundImage = new Image();

window.onload = function() {
    const psdInput = document.getElementById('psd-upload');
    if (psdInput) psdInput.addEventListener('change', handlePSDInput);
};

/**
 * PSDファイルを解析して背景サイズを基準にキャンバスを設定する
 */
async function handlePSDInput(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        const buffer = event.target.result;
        const PSD = window.require ? window.require("psd") : window.PSD;
        const psd = new PSD(new Uint8Array(buffer));
        
        try {
            psd.parse();
        } catch (err) {
            alert("PSDの解析に失敗しました。");
            return;
        }

        // 実レイヤーのみ抽出（重なり順：上から順）
        let allLayers = psd.tree().descendants().filter(n => n.isLayer());
        if (allLayers.length < 2) {
            alert("背景とパネル、最低2枚必要です。");
            return;
        }

        // --- 1. 背景の処理（一番下のレイヤーを基準にする） ---
        const bgNode = allLayers.pop(); // 配列の最後＝一番下のレイヤー
        const bgNodeData = bgNode.export(); // 座標やサイズ情報を取得
        
        // 背景のサイズを取得
        const bgWidth = bgNodeData.width;
        const bgHeight = bgNodeData.height;
        
        // 背景画像URI
        const bgImgUri = bgNode.layer.image.toPng().src;

        // --- 2. 画面表示枠のサイズを背景レイヤーに合わせる ---
        const target = document.getElementById('capture-target');
        const svg = document.getElementById('panel-svg');
        const hiddenImg = document.getElementById('hidden-image');

        if (target) {
            target.style.width = bgWidth + "px";
            target.style.height = bgHeight + "px";
        }
        if (svg) {
            // 背景の左上を(0,0)とした座標系にする
            svg.setAttribute("viewBox", `0 0 ${bgWidth} ${bgHeight}`);
        }

        hiddenImg.src = bgImgUri;
        backgroundImage.src = bgImgUri;
        document.getElementById('no-image-text').style.display = 'none';

        // --- 3. パネルの処理 ---
        panels = allLayers.map(layer => {
            const node = layer.export();
            let layerImage = "";
            try {
                layerImage = layer.layer.image.toPng().src;
            } catch (e) {
                console.warn(`${node.name} の画像抽出に失敗`);
            }

            return {
                id: 'panel-' + Date.now() + Math.random().toString(36).substr(2, 9),
                name: node.name,
                // 背景レイヤーの左上を(0,0)とした相対位置を計算
                x: node.left - bgNodeData.left,
                y: node.top - bgNodeData.top,
                width: node.width,
                height: node.height,
                image: layerImage,
                isRevealed: false
            };
        });

        backgroundImage.onload = () => {
            renderCanvas();
            renderControlList();
            alert(`背景サイズ(${bgWidth}x${bgHeight})に合わせて${panels.length}枚のパネルを生成しました。`);
        };
    };
    reader.readAsArrayBuffer(file);
}

/**
 * キャンバス描画
 */
function renderCanvas() {
    const svg = document.getElementById('panel-svg');
    if (!svg) return;
    svg.innerHTML = '';

    panels.forEach(panel => {
        if (panel.isRevealed) return;

        const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
        img.setAttributeNS(null, "href", panel.image);
        img.setAttributeNS(null, "x", panel.x);
        img.setAttributeNS(null, "y", panel.y);
        img.setAttributeNS(null, "width", panel.width);
        img.setAttributeNS(null, "height", panel.height);
        img.style.cursor = "pointer";
        
        img.onclick = () => revealPanel(panel.id);
        svg.appendChild(img);
    });
}

function revealPanel(panelId) {
    const panel = panels.find(p => p.id === panelId);
    if (panel) {
        panel.isRevealed = !panel.isRevealed;
        renderCanvas();
        renderControlList();
    }
}

function renderControlList() {
    const listArea = document.getElementById('control-list');
    if (!listArea) return;
    listArea.innerHTML = '';
    panels.forEach(panel => {
        const item = document.createElement('div');
        item.className = 'control-item';
        item.style = "display:flex; align-items:center; gap:10px; padding:8px; border-bottom:1px solid #eee;";
        item.innerHTML = `
            <img src="${panel.image}" style="width:40px; height:40px; object-fit:contain; background:#f0f0f0;">
            <div style="flex:1; text-align:left;">
                <div style="font-weight:bold; font-size:12px;">${panel.name}</div>
            </div>
            <button onclick="revealPanel('${panel.id}')">${panel.isRevealed ? '閉じる' : '開ける'}</button>
        `;
        listArea.appendChild(item);
    });
}
