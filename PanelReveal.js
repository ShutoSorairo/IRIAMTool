/**
 * IRIAM パネル開けツール - 複数ボード対応版
 */

let boardGroups = []; // { id, name, bg, panels } の配列
const STORAGE_KEY = "iriam_multi_panel_data";

window.onload = function() {
    const psdInput = document.getElementById('psd-upload');
    if (psdInput) psdInput.addEventListener('change', handlePSDInput);

    const copyBtn = document.querySelector('.btn-tweet');
    if (copyBtn) copyBtn.onclick = copyBoardImage;

    const resetBtn = document.getElementById('reset-panels');
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (confirm("すべてのボードと保存データを完全に消去しますか？")) {
                localStorage.removeItem(STORAGE_KEY);
                location.reload();
            }
        };
    }

    loadFromLocalStorage();

    window.onclick = (e) => {
        const modal = document.getElementById('control-popup');
        if (e.target == modal) toggleControlPopup();
    };
};

/**
 * PSD読み込み（既存のボードに追加する）
 */
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
        const bgSrc = bgNode.layer.image.toPng().src;

        // 新しいボードグループを作成
        const newBoard = {
            id: 'board-' + Date.now(),
            name: file.name,
            width: bgNodeData.width,
            height: bgNodeData.height,
            bg: bgSrc,
            panels: allLayers.map(layer => {
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
            })
        };

        boardGroups.push(newBoard);
        saveToLocalStorage();
        renderAll();
        alert(`ボード「${file.name}」を追加しました。`);
    };
    reader.readAsArrayBuffer(file);
}

/**
 * 全描画リフレッシュ
 */
function renderAll() {
    const workspace = document.querySelector('.workspace');
    workspace.innerHTML = ''; // 一旦クリア

    if (boardGroups.length === 0) {
        workspace.innerHTML = '<div id="no-image-text">PSDファイルを読み込んでください</div>';
        return;
    }

    boardGroups.forEach((group, index) => {
        // ボードごとのコンテナ作成
        const wrapper = document.createElement('div');
        wrapper.className = 'board-wrapper';
        wrapper.id = `target-${group.id}`;
        wrapper.style.width = group.width + "px";
        wrapper.style.height = group.height + "px";
        wrapper.style.aspectRatio = `${group.width} / ${group.height}`;
        wrapper.style.marginBottom = "40px";

        // 背景
        const img = document.createElement('img');
        img.src = group.bg;
        img.id = `bg-${group.id}`;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "fill";
        wrapper.appendChild(img);

        // パネル用SVG
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = `svg-${group.id}`;
        svg.setAttribute("viewBox", `0 0 ${group.width} ${group.height}`);
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.width = "100%";
        svg.style.height = "100%";
        wrapper.appendChild(svg);

        workspace.appendChild(wrapper);
        renderCanvas(group.id);
    });

    renderControlList();
}

/**
 * 各ボードのパネル描画（3段テキスト付き）
 */
function renderCanvas(boardId) {
    const group = boardGroups.find(g => g.id === boardId);
    const svg = document.getElementById(`svg-${boardId}`);
    if (!group || !svg) return;
    svg.innerHTML = '';
    const ns = "http://www.w3.org/2000/svg";
    const baseFontSize = 14;

    group.panels.forEach(p => {
        if (p.isRevealed) return;

        const img = document.createElementNS(ns, "image");
        img.setAttributeNS(null, "href", p.image);
        img.setAttributeNS(null, "x", p.x); img.setAttributeNS(null, "y", p.y);
        img.setAttributeNS(null, "width", p.width); img.setAttributeNS(null, "height", p.height);
        img.onclick = () => revealPanel(boardId, p.id);
        svg.appendChild(img);

        // 3段テキスト表示
        if (p.width < 40 || p.height < 40) return;
        const fontSize = Math.max(9, Math.min(baseFontSize, p.width / 8));
        const textX = p.x + p.width / 2;
        const textY = p.y + p.height / 2;

        const g = document.createElementNS(ns, "g");
        g.setAttribute("font-size", fontSize + "px");
        g.setAttribute("text-anchor", "middle");
        g.setAttribute("dominant-baseline", "central");
        g.style.pointerEvents = "none";
        const stroke = "stroke: white; stroke-width: 3px; paint-order: stroke; stroke-linejoin: round; font-weight:bold;";

        const t1 = document.createElementNS(ns, "text");
        t1.setAttribute("x", textX); t1.setAttribute("y", textY - fontSize * 1.2);
        t1.setAttribute("style", stroke); t1.textContent = p.name;
        g.appendChild(t1);

        const t2 = document.createElementNS(ns, "text");
        t2.setAttribute("x", textX); t2.setAttribute("y", textY);
        t2.setAttribute("style", stroke); t2.setAttribute("fill", "#666");
        t2.textContent = `(${p.giftValue}pt)`;
        g.appendChild(t2);

        const t3 = document.createElementNS(ns, "text");
        t3.setAttribute("x", textX); t3.setAttribute("y", textY + fontSize * 1.2);
        const isFull = p.currentCount >= p.currentTarget;
        t3.setAttribute("style", stroke); t3.setAttribute("fill", isFull ? "#2e7d32" : "#e65100");
        t3.textContent = `${p.currentCount} / ${p.currentTarget}`;
        g.appendChild(t3);

        svg.appendChild(g);
    });
}

/**
 * データの操作
 */
function updateCounter(boardId, panelId, amount) {
    const group = boardGroups.find(g => g.id === boardId);
    const p = group?.panels.find(x => x.id === panelId);
    if (p) {
        p.currentCount = Math.max(0, p.currentCount + amount);
        saveToLocalStorage(); renderCanvas(boardId); renderControlList();
    }
}

function updateTarget(boardId, panelId, amount) {
    const group = boardGroups.find(g => g.id === boardId);
    const p = group?.panels.find(x => x.id === panelId);
    if (p) {
        p.currentTarget = Math.max(1, p.currentTarget + amount);
        saveToLocalStorage(); renderCanvas(boardId); renderControlList();
    }
}

function revealPanel(boardId, panelId) {
    const group = boardGroups.find(g => g.id === boardId);
    const p = group?.panels.find(x => x.id === panelId);
    if (p) {
        p.isRevealed = !p.isRevealed;
        saveToLocalStorage(); renderCanvas(boardId); renderControlList();
    }
}

function deleteBoard(boardId) {
    if (confirm("このボードを削除しますか？")) {
        boardGroups = boardGroups.filter(g => g.id !== boardId);
        saveToLocalStorage(); renderAll();
    }
}

/**
 * 操作リストの描画（ボードごとに分ける）
 */
function renderControlList() {
    const list = document.getElementById('control-list');
    list.innerHTML = boardGroups.length ? '' : 'ボードがありません';

    boardGroups.forEach(group => {
        const boardSection = document.createElement('div');
        boardSection.innerHTML = `<div style="background:#eee; padding:5px 10px; font-weight:bold; display:flex; justify-content:space-between;">
            <span>📁 ${group.name}</span>
            <button onclick="deleteBoard('${group.id}')" style="color:red; font-size:10px;">削除</button>
        </div>`;
        
        group.panels.forEach(p => {
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
                    <div class="action-group"><span class="group-label">個数</span><button onclick="updateCounter('${group.id}', '${p.id}', 1)" class="btn-plus">＋</button><button onclick="updateCounter('${group.id}', '${p.id}', -1)" class="btn-minus">－</button></div>
                    <div class="action-group"><span class="group-label">ノルマ</span><button onclick="updateTarget('${group.id}', '${p.id}', 1)" class="btn-up">▲</button><button onclick="updateTarget('${group.id}', '${p.id}', -1)" class="btn-down">▼</button></div>
                    <button onclick="revealPanel('${group.id}', '${p.id}')" class="btn-reveal ${p.isRevealed ? 'opened' : ''}">${p.isRevealed ? '閉' : '開'}</button>
                </div>`;
            boardSection.appendChild(item);
        });
        list.appendChild(boardSection);
    });
}

/**
 * 保存・読込
 */
function saveToLocalStorage() { localStorage.setItem(STORAGE_KEY, JSON.stringify(boardGroups)); }
function loadFromLocalStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) { boardGroups = JSON.parse(data); renderAll(); }
}

function toggleControlPopup() {
    const modal = document.getElementById('control-popup');
    modal.style.display = (modal.style.display === 'none') ? 'flex' : 'none';
}

/**
 * 画像コピー（一番上のボードをコピー）
 */
function copyBoardImage() {
    if (!boardGroups.length) return;
    const group = boardGroups[boardGroups.length - 1]; // 最新のボードを対象
    const target = document.getElementById(`target-${group.id}`);
    html2canvas(target, { useCORS: true, width: group.width, height: group.height, scale: 1 }).then(canvas => {
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => alert("最新のボードをコピーしました"));
        });
    });
}
