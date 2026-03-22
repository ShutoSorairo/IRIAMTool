/**
 * IRIAM パネル開けツール - PanelReveal.js
 * 保存機能（LocalStorage）統合版
 */

let panels = []; 
let backgroundImage = new Image();
const STORAGE_KEY = "iriam_panel_data";
const BG_STORAGE_KEY = "iriam_panel_bg";

window.onload = function() {
    const psdInput = document.getElementById('psd-upload');
    if (psdInput) psdInput.addEventListener('change', handlePSDInput);

    const copyBtn = document.querySelector('.btn-tweet');
    if (copyBtn) copyBtn.onclick = copyBoardImage;

    const resetBtn = document.getElementById('reset-panels');
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (confirm("すべてのデータを削除してリセットしますか？")) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(BG_STORAGE_KEY);
                panels = [];
                location.reload(); // 画面をリフレッシュ
            }
        };
    }

    // 保存データの読み込み
    loadFromLocalStorage();

    window.onclick = (e) => {
        const modal = document.getElementById('control-popup');
        if (e.target == modal) toggleControlPopup();
    };
};

/**
 * データの保存
 */
function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
}

/**
 * データの読み込み
 */
function loadFromLocalStorage() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedBg = localStorage.getItem(BG_STORAGE_KEY);

    if (savedBg) {
        const hiddenImg = document.getElementById('hidden-image');
        hiddenImg.src = savedBg;
        backgroundImage.src = savedBg;
        document.getElementById('no-image-text').style.display = 'none';
        
        // 背景が読み込まれたら枠を調整（少し遅延させて確実に行う）
        backgroundImage.onload = () => {
            const target = document.getElementById('capture-target');
            const svg = document.getElementById('panel-svg');
            target.style.width = backgroundImage.naturalWidth + "px";
            target.style.height = backgroundImage.naturalHeight + "px";
            target.style.aspectRatio = `${backgroundImage.naturalWidth} / ${backgroundImage.naturalHeight}`;
            svg.setAttribute("viewBox", `0 0 ${backgroundImage.naturalWidth} ${backgroundImage.naturalHeight}`);
            
            if (savedData) {
                panels = JSON.parse(savedData);
                renderCanvas();
                renderControlList();
            }
        };
    }
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

        const target = document.getElementById('capture-target');
        const svg = document.getElementById('panel-svg');
        const hiddenImg = document.getElementById('hidden-image');

        target.style.width = bgNodeData.width + "px";
        target.style.height = bgNodeData.height + "px";
        svg.setAttribute("viewBox", `0 0 ${bgNodeData.width} ${bgNodeData.height}`);

        const bgSrc = bgNode.layer.image.toPng().src;
        hiddenImg.src = bgSrc;
        backgroundImage.src = bgSrc;
        localStorage.setItem(BG_STORAGE_KEY, bgSrc); // 背景を保存
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

        saveToLocalStorage(); // パネルデータを保存
        renderCanvas();
        renderControlList();
    };
    reader.readAsArrayBuffer(file);
}

function updateCounter(id, amount) {
    const p = panels.find(x => x.id === id);
    if (p) {
        p.currentCount = Math.max(0, p.currentCount + amount);
        saveToLocalStorage();
        renderControlList();
        renderCanvas();
    }
}

function updateTarget(id, amount) {
    const p = panels.find(x => x.id === id);
    if (p) {
        p.currentTarget = Math.max(1, p.currentTarget + amount);
        saveToLocalStorage();
        renderControlList();
        renderCanvas();
    }
}

function revealPanel(id) {
    const p = panels.find(x => x.id === id);
    if (p) {
        p.isRevealed = !p.isRevealed;
        saveToLocalStorage();
        renderCanvas();
        renderControlList();
    }
}

// --- 以下、描画・コピー用関数 (変更なし) ---

function renderCanvas() {
    const svg = document.getElementById('panel-svg');
    if (!svg) return;
    svg.innerHTML = '';
    const ns = "http://www.w3.org/2000/svg";
    const baseFontSize = 14; 
    const lineSpacing = 1.2;

    panels.forEach(p => {
        if (p.isRevealed) return;
        const img = document.createElementNS(ns, "image");
        img.setAttributeNS(null, "href", p.image);
        img.setAttributeNS(null, "x", p.x); img.setAttributeNS(null, "y", p.y);
        img.setAttributeNS(null, "width", p.width); img.setAttributeNS(null, "height", p.height);
        img.style.cursor = "pointer";
        img.onclick = () => revealPanel(p.id);
        svg.appendChild(img);

        if (p.width < 40 || p.height < 40) return;
        const longestText = p.name.length > 8 ? p.name : `達成:${p.currentCount} / ノルマ:${p.currentTarget}`;
        let fontSize = baseFontSize;
        const availableWidth = p.width * 0.9;
        const estimatedTextWidth = longestText.length * fontSize * 0.8;
        if (estimatedTextWidth > availableWidth) { fontSize = Math.max(9, availableWidth / (longestText.length * 0.8)); }

        const textX = p.x + p.width / 2;
        const textY = p.y + p.height / 2;
        const textGroup = document.createElementNS(ns, "g");
        textGroup.setAttribute("font-family", "sans-serif");
        textGroup.setAttribute("font-size", fontSize + "px");
        textGroup.setAttribute("font-weight", "bold");
        textGroup.setAttribute("text-anchor", "middle");
        textGroup.setAttribute("dominant-baseline", "central");
        textGroup.style.pointerEvents = "none";
        const strokeStyle = "stroke: white; stroke-width: 3px; paint-order: stroke; stroke-linejoin: round;";

        const nT = document.createElementNS(ns, "text");
        nT.setAttribute("x", textX); nT.setAttribute("y", textY - (fontSize * lineSpacing));
        nT.setAttribute("fill", "#333"); nT.setAttribute("style", strokeStyle);
        nT.textContent = p.name;
        textGroup.appendChild(nT);

        const pT = document.createElementNS(ns, "text");
        pT.setAttribute("x", textX); pT.setAttribute("y", textY);
        pT.setAttribute("fill", "#666"); pT.setAttribute("style", strokeStyle);
        pT.setAttribute("font-size", (fontSize * 0.9) + "px");
        pT.textContent = `(${p.giftValue}pt)`;
        textGroup.appendChild(pT);

        const cT = document.createElementNS(ns, "text");
        cT.setAttribute("x", textX); cT.setAttribute("y", textY + (fontSize * lineSpacing));
        const isFull = p.currentCount >= p.currentTarget;
        cT.setAttribute("fill", isFull ? "#2e7d32" : "#e65100");
        cT.setAttribute("style", strokeStyle);
        cT.textContent = `${p.currentCount} / ${p.currentTarget}`;
        textGroup.appendChild(cT);
        svg.appendChild(textGroup);
    });
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

function toggleControlPopup() {
    const modal = document.getElementById('control-popup');
    modal.style.display = (modal.style.display === 'none') ? 'flex' : 'none';
    if (modal.style.display === 'flex') renderControlList();
}

function copyBoardImage() {
    const target = document.getElementById('capture-target');
    const svg = document.getElementById('panel-svg');
    const vb = svg.getAttribute("viewBox").split(' ');
    const w = parseFloat(vb[2]); const h = parseFloat(vb[3]);
    html2canvas(target, {
        useCORS: true, width: w, height: h, scale: 1,
        onclone: (doc) => {
            const t = doc.getElementById('capture-target');
            t.style.width = w + "px"; t.style.height = h + "px";
            t.style.maxWidth = "none"; t.style.maxHeight = "none";
        }
    }).then(canvas => {
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => alert("コピーしました"));
        });
    });
}
