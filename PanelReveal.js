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

        // --- 0. PSDのキャンバスサイズに合わせて枠をリサイズ ---
        const header = psd.header;
        const psdWidth = header.width;
        const psdHeight = header.height;

        const target = document.getElementById('capture-target');
        const svg = document.getElementById('panel-svg');
        const hiddenImg = document.getElementById('hidden-image');

        // 表示枠のサイズを固定（PSDの等倍にする）
        if (target) {
            target.style.width = psdWidth + "px";
            target.style.height = psdHeight + "px";
        }
        if (svg) {
            svg.setAttribute("viewBox", `0 0 ${psdWidth} ${psdHeight}`);
        }

        // 実レイヤーのみ抽出（上から順）
        let allLayers = psd.tree().descendants().filter(n => n.isLayer());
        if (allLayers.length < 2) {
            alert("背景とパネル、最低2枚必要です。");
            return;
        }

        // --- 1. 一番下のレイヤーを背景として設定 ---
        const bgNode = allLayers.pop();
        const bgImgUri = bgNode.layer.image.toPng().src;
        
        hiddenImg.src = bgImgUri;
        backgroundImage.src = bgImgUri;
        document.getElementById('no-image-text').style.display = 'none';

        // --- 2. パネルの処理（画像も抽出） ---
        panels = allLayers.map(layer => {
            const node = layer.export();
            let layerImage = "";
            try {
                // レイヤーの画像を抽出
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
                image: layerImage,
                isRevealed: false
            };
        });

        backgroundImage.onload = () => {
            renderCanvas();
            renderControlList();
            alert(`解像度 ${psdWidth}x${psdHeight} で読み込みました！`);
        };
    };
    reader.readAsArrayBuffer(file);
}

/**
 * レイヤー画像を表示する
 */
function renderCanvas() {
    const svg = document.getElementById('panel-svg');
    if (!svg) return;
    svg.innerHTML = '';

    panels.forEach(panel => {
        if (panel.isRevealed) return;

        // 画像要素を作成
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
            <img src="${panel.image}" style="width:40px; height:40px; object-fit:contain; background:#f0f0f0; border-radius:4px;">
            <div style="flex:1; text-align:left;">
                <div style="font-weight:bold; font-size:12px;">${panel.name}</div>
            </div>
            <button onclick="revealPanel('${panel.id}')" style="padding:4px 8px;">
                ${panel.isRevealed ? '閉じる' : '開ける'}
            </button>
        `;
        listArea.appendChild(item);
    });
}
