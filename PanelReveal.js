let panels = []; 
let backgroundImage = new Image();

window.onload = function() {
    const psdInput = document.getElementById('psd-upload');
    if (psdInput) psdInput.addEventListener('change', handlePSDInput);
    const copyBtn = document.querySelector('.btn-tweet');
    if (copyBtn) copyBtn.onclick = copyBoardImage;
    const resetBtn = document.getElementById('reset-panels');
    if (resetBtn) resetBtn.onclick = () => {
        if (confirm("リセットしますか？")) { panels = []; renderCanvas(); renderControlList(); }
    };
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
        // 最下層を背景として取得
        const bgNode = allLayers.pop(); 
        const bgNodeData = bgNode.export();

        const target = document.getElementById('capture-target');
        const svg = document.getElementById('panel-svg');
        const hiddenImg = document.getElementById('hidden-image');

        // ★修正: 枠のサイズを背景の解像度に完全に合わせ、CSSでの歪みを防ぐ
        target.style.width = bgNodeData.width + "px";
        target.style.height = bgNodeData.height + "px";
        // 表示が大きすぎる場合はCSSのmax-widthで縮小されるが、比率は維持される
        
        svg.setAttribute("viewBox", `0 0 ${bgNodeData.width} ${bgNodeData.height}`);

        const bgSrc = bgNode.layer.image.toPng().src;
        hiddenImg.src = bgSrc;
        backgroundImage.src = bgSrc;
        document.getElementById('no-image-text').style.display = 'none';

        panels = allLayers.map(layer => {
            const node = layer.export();
            let giftName = node.name, giftValue = 0;
            if (node.name.includes('_')) {
                const parts = node.name.split('_');
                giftName = parts[0];
                const ptMatch = parts[1].match(/(\d+)pt/);
                if (ptMatch) giftValue = parseInt(ptMatch[1]);
            }
            return {
                id: 'p-' + Math.random().toString(36).substr(2, 9),
                name: giftName, giftValue: giftValue,
                currentTarget: 1, currentCount: 0,
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

function copyBoardImage() {
    const target = document.getElementById('capture-target');
    const svg = document.getElementById('panel-svg');
    const vb = svg.getAttribute("viewBox").split(' ');
    const w = parseFloat(vb[2]);
    const h = parseFloat(vb[3]);

    html2canvas(target, {
        useCORS: true,
        width: w,
        height: h,
        scale: 1,
        onclone: (doc) => {
            const t = doc.getElementById('capture-target');
            t.style.width = w + "px";
            t.style.height = h + "px";
            t.style.maxWidth = "none";
            t.style.maxHeight = "none";
        }
    }).then(canvas => {
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => alert("背景と同じサイズでコピーしました"));
        });
    });
}

// updateCounter, updateTarget, revealPanel, renderControlList は変更なし
function updateCounter(id, amount) {
    const p = panels.find(x => x.id === id);
    if (p) { p.currentCount = Math.max(0, p.currentCount + amount); renderControlList(); }
}
function updateTarget(id, amount) {
    const p = panels.find(x => x.id === id);
    if (p) { p.currentTarget = Math.max(1, p.currentTarget + amount); renderControlList(); }
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
        item.className = 'panel-card';
        const progress = Math.min(100, (p.currentCount / p.currentTarget) * 100);
        const isFull = p.currentCount >= p.currentTarget;
        item.innerHTML = `
            <div class="card-main">
                <img src="${p.image}" class="card-img">
                <div class="card-info">
                    <div class="card-title"><span class="gift-name">${p.name}</span><span class="gift-value">${p.giftValue}pt</span></div>
                    <div class="card-counter">達成: <span class="count-num ${isFull ? 'full' : ''}">${p.currentCount}</span> / <span class="count-target">ノルマ:${p.currentTarget}個</span></div>
                    <div class="card-progress-bar"><div class="progress-fill" style="width: ${progress}%; background: ${isFull ? '#4caf50' : '#ff9800'};"></div></div>
                </div>
            </div>
            <div class="card-actions">
                <div class="action-group"><span class="group-label">個数</span><button onclick="updateCounter('${p.id}', 1)" class="btn-plus">＋</button><button onclick="updateCounter('${p.id}', -1)" class="btn-minus">－</button></div>
                <div class="action-group"><span class="group-label">ノルマ</span><button onclick="updateTarget('${p.id}', 1)" class="btn-up">▲</button><button onclick="updateTarget('${p.id}', -1)" class="btn-down">▼</button></div>
                <button onclick="revealPanel('${p.id}')" class="btn-reveal ${p.isRevealed ? 'opened' : ''}">${p.isRevealed ? '閉じる' : '開ける'}</button>
            </div>`;
        list.appendChild(item);
    });
}
