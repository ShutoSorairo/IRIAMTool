// --- データ管理 ---
let panels = []; 
let isEditMode = false;
let backgroundImage = new Image();

window.onload = function() {
    const psdInput = document.getElementById('psd-upload');
    if (psdInput) psdInput.addEventListener('change', handlePSDInput);
};

/**
 * PSDファイルを解析してパネル（画像付き）と背景を設定する
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

        // 実レイヤーのみ抽出（上から順）
        let allLayers = psd.tree().descendants().filter(n => n.isLayer());
        if (allLayers.length < 2) {
            alert("背景とパネル、最低2枚必要です。");
            return;
        }

        // 1. 一番下のレイヤーを背景として設定
        const bgNode = allLayers.pop();
        const bgImgUri = bgNode.layer.image.toPng().src; // 画像データ取得
        
        const hiddenImg = document.getElementById('hidden-image');
        hiddenImg.src = bgImgUri;
        backgroundImage.src = bgImgUri;
        document.getElementById('no-image-text').style.display = 'none';

        // 2. パネルの処理（画像も抽出）
        panels = allLayers.map(layer => {
            const node = layer.export();
            let layerImage = "";
            try {
                // レイヤー個別の画像をPNG形式のデータURIとして取得
                layerImage = layer.layer.image.toPng().src;
            } catch (e) {
                console.warn(`${node.name} の画像抽出に失敗しました`);
            }

            return {
                id: 'panel-' + Date.now() + Math.random().toString(36).substr(2, 9),
                name: node.name,
                x: node.left,
                y: node.top,
                width: node.width,
                height: node.height,
                image: layerImage, // ★ここが重要：レイヤー画像
                isRevealed: false,
                points: [
                    {x: node.left, y: node.top},
                    {x: node.left + node.width, y: node.top},
                    {x: node.left + node.width, y: node.top + node.height},
                    {x: node.left, y: node.top + node.height}
                ]
            };
        });

        backgroundImage.onload = () => {
            renderCanvas();
            renderControlList();
            alert("画像付きでパネルを読み込みました！");
        };
    };
    reader.readAsArrayBuffer(file);
}

/**
 * SVG内に「画像」としてパネルを描画する
 */
function renderCanvas() {
    const svg = document.getElementById('panel-svg');
    if (!svg) return;
    svg.innerHTML = '';

    panels.forEach(panel => {
        if (panel.isRevealed) return;

        // SVG内に画像を配置するための要素
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
        
        img.setAttributeNS(null, "href", panel.image);
        img.setAttributeNS(null, "x", panel.x);
        img.setAttributeNS(null, "y", panel.y);
        img.setAttributeNS(null, "width", panel.width);
        img.setAttributeNS(null, "height", panel.height);
        img.style.cursor = "pointer";
        
        // クリックで消去（開ける）
        img.onclick = () => revealPanel(panel.id);

        // 枠線（必要なら）
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", panel.x);
        rect.setAttribute("y", panel.y);
        rect.setAttribute("width", panel.width);
        rect.setAttribute("height", panel.height);
        rect.setAttribute("fill", "none");
        rect.setAttribute("stroke", "rgba(255,255,255,0.3)");
        rect.style.pointerEvents = "none";

        g.appendChild(img);
        g.appendChild(rect);
        svg.appendChild(g);
    });
}

// 以下、revealPanel と renderControlList は前回と同じ
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
        item.innerHTML = `
            <img src="${panel.image}" style="width:30px; height:30px; object-fit:contain; background:#eee;">
            <span>${panel.name}</span>
            <button onclick="revealPanel('${panel.id}')">${panel.isRevealed ? '閉' : '開'}</button>
        `;
        listArea.appendChild(item);
    });
}
