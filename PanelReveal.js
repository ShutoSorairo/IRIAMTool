let panels = []; 
let backgroundImage = new Image();

window.onload = function() {
    const psdInput = document.getElementById('psd-upload');
    if (psdInput) psdInput.addEventListener('change', handlePSDInput);

    const copyBtn = document.querySelector('.btn-tweet');
    if (copyBtn) copyBtn.onclick = copyBoardImage;

    // モーダル外クリックで閉じる
    window.onclick = (e) => {
        const modal = document.getElementById('control-popup');
        if (e.target == modal) toggleControlPopup();
    };
};

function toggleControlPopup() {
    const modal = document.getElementById('control-popup');
    modal.style.display = (modal.style.display === 'none') ? 'flex' : 'none';
    if (modal.style.display === 'flex') renderControlList();
}

async function handlePSDInput(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        const PSD = window.require ? window.require("psd") : window.PSD;
        const psd = new PSD(new Uint8Array(event.target.result));
        try { psd.parse(); } catch (err) { alert("PSD解析失敗"); return; }

        let allLayers = psd.tree().descendants().filter(n => n.isLayer());
        const bgNode = allLayers.pop(); 
        const bgNodeData = bgNode.export();
        const bgImgUri = bgNode.layer.image.toPng().src;

        // 縮尺調整
        const target = document.getElementById('capture-target');
        const svg = document.getElementById('panel-svg');
        const hiddenImg = document.getElementById('hidden-image');

        target.style.aspectRatio = `${bgNodeData.width} / ${bgNodeData.height}`;
        target.style.width = "100%";
        target.style.maxWidth = bgNodeData.width + "px";
        svg.setAttribute("viewBox", `0 0 ${bgNodeData.width} ${bgNodeData.height}`);

        hiddenImg.src = bgImgUri;
        backgroundImage.src = bgImgUri;
        document.getElementById('no-image-text').style.display = 'none';

        // パネル生成 + ギフト判定
        panels = allLayers.map(layer => {
            const node = layer.export();
            let giftName = node.name;
            let giftPoint = 0;
            if (node.name.includes('_')) {
                const parts = node.name.split('_');
                giftName = parts[0];
                const ptMatch = parts[1].match(/(\d+)pt/);
                if (ptMatch) giftPoint = parseInt(ptMatch[1]);
            }
            return {
                id: 'p-' + Math.random().toString(36).substr(2, 9),
                name: giftName, point: giftPoint,
                x: node.left - bgNodeData.left, y: node.top - bgNodeData.top,
                width: node.width, height: node.height,
                image: layer.layer.image.toPng().src, isRevealed: false
            };
        });

        backgroundImage.onload = () => { renderCanvas(); renderControlList(); };
    };
    reader.readAsArrayBuffer(file);
}

function renderCanvas() {
    const svg = document.getElementById('panel-svg');
    svg.innerHTML = '';
    panels.forEach(p => {
        if (p.isRevealed) return;
        const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
        img.setAttributeNS(null, "href", p.image);
        img.setAttributeNS(null, "x", p.x); img.setAttributeNS(null, "y", p.y);
        img.setAttributeNS(null, "width", p.width); img.setAttributeNS(null, "height", p.height);
        img.onclick = () => revealPanel(p.id);
        svg.appendChild(img);
    });
}

function revealPanel(id) {
    const p = panels.find(x => x.id === id);
    if (p) { p.isRevealed = !p.isRevealed; renderCanvas(); renderControlList(); }
}

function renderControlList() {
    const list = document.getElementById('control-list');
    list.innerHTML = panels.length ? '' : 'PSDを読み込んでください';
    panels.forEach(p => {
        const item = document.createElement('div');
        item.className = 'control-item';
        item.innerHTML = `
            <img src="${p.image}" style="width:40px;height:40px;object-fit:contain;background:#eee;">
            <div style="flex:1;text-align:left;font-size:12px;"><b>${p.name}</b> ${p.point}pt</div>
            <button onclick="revealPanel('${p.id}')">${p.isRevealed ? '閉' : '開'}</button>`;
        list.appendChild(item);
    });
}

function copyBoardImage() {
    const target = document.getElementById('capture-target');
    html2canvas(target, { useCORS: true, scale: 2 }).then(canvas => {
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => alert("画像をコピーしました！"));
        });
    });
}
