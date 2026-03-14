// --- データ管理 ---
let panels = []; 
let isEditMode = false;
let backgroundImage = new Image();

window.onload = function() {
    const psdInput = document.getElementById('psd-upload');
    if (psdInput) psdInput.addEventListener('change', handlePSDInput);
};

/**
 * PSD解析 + ギフト自動判別ロジック
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

        let allLayers = psd.tree().descendants().filter(n => n.isLayer());
        if (allLayers.length < 2) {
            alert("背景とパネル、最低2枚必要です。");
            return;
        }

        // 背景の取得
        const bgNode = allLayers.pop();
        const bgNodeData = bgNode.export();
        const bgImgUri = bgNode.layer.image.toPng().src;

        // 枠のリサイズ
        const target = document.getElementById('capture-target');
        const svg = document.getElementById('panel-svg');
        const hiddenImg = document.getElementById('hidden-image');
        if (target) { target.style.width = bgNodeData.width + "px"; target.style.height = bgNodeData.height + "px"; }
        if (svg) svg.setAttribute("viewBox", `0 0 ${bgNodeData.width} ${bgNodeData.height}`);
        hiddenImg.src = bgImgUri;
        backgroundImage.src = bgImgUri;
        document.getElementById('no-image-text').style.display = 'none';

        // --- パネル生成とギフト判別 ---
        panels = allLayers.map(layer => {
            const node = layer.export();
            let layerImage = "";
            try { layerImage = layer.layer.image.toPng().src; } catch (e) {}

            // 【ギフトロジック】レイヤー名からギフト情報を抽出
            // 例: "ハート_5pt" -> 名: ハート, 点: 5
            let giftName = node.name;
            let giftPoint = 0;

            if (node.name.includes('_')) {
                const parts = node.name.split('_');
                giftName = parts[0]; // アンダーバーより前を名前に
                const ptMatch = parts[1].match(/(\d+)pt/); // 「100pt」のような形式を探す
                if (ptMatch) giftPoint = parseInt(ptMatch[1]);
            }

            return {
                id: 'panel-' + Date.now() + Math.random().toString(36).substr(2, 9),
                name: giftName,          // 表示名
                point: giftPoint,        // ポイント
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
            alert(`${panels.length}枚のパネルを読み込みました（ギフト自動判別完了）`);
        };
    };
    reader.readAsArrayBuffer(file);
}

/**
 * 操作リストの表示（ギフト情報付き）
 */
function renderControlList() {
    const listArea = document.getElementById('control-list');
    if (!listArea) return;
    listArea.innerHTML = '';

    panels.forEach(panel => {
        const item = document.createElement('div');
        item.className = 'control-item';
        item.style = "display:flex; align-items:center; gap:10px; padding:8px; border-bottom:1px solid #eee;";
        
        // ポイントがある場合はバッジを表示
        const pointBadge = panel.point > 0 
            ? `<span style="background:#ff9800; color:white; padding:2px 6px; border-radius:10px; font-size:10px;">${panel.point}pt</span>` 
            : '';

        item.innerHTML = `
            <img src="${panel.image}" style="width:40px; height:40px; object-fit:contain; background:#f0f0f0;">
            <div style="flex:1; text-align:left;">
                <div style="font-weight:bold; font-size:12px;">${panel.name} ${pointBadge}</div>
            </div>
            <button onclick="revealPanel('${panel.id}')">${panel.isRevealed ? '閉じる' : '開ける'}</button>
        `;
        listArea.appendChild(item);
    });
}

// renderCanvas, revealPanel は前回のものをそのまま使用
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
