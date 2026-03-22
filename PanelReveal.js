/**
 * IRIAM パネル開けツール - PanelReveal.js (テキスト表示統合版)
 */

// --- グローバル変数 ---
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
    if (!modal) return;
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

        const target = document.getElementById('capture-target');
        const svg = document.getElementById('panel-svg');
        const hiddenImg = document.getElementById('hidden-image');

        // 背景解像度を厳密に固定
        target.style.width = bgNodeData.width + "px";
        target.style.height = bgNodeData.height + "px";
        target.style.aspectRatio = `${bgNodeData.width} / ${bgNodeData.height}`;
        target.style.maxWidth = "100%"; // 画面幅に収める
        
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

/**
 * SVGキャンバスの描画 (テキストサイズ統一 & はみ出し防止版)
 */
function renderCanvas() {
    const svg = document.getElementById('panel-svg');
    if (!svg) return;
    svg.innerHTML = '';
    const ns = "http://www.w3.org/2000/svg";

    // 全体の基準となるフォントサイズ (16px前後が配信画面で見やすい)
    const baseFontSize = 16; 

    panels.forEach(p => {
        if (p.isRevealed) return;

        // 1. パネル画像の描画
        const img = document.createElementNS(ns, "image");
        img.setAttributeNS(null, "href", p.image);
        img.setAttributeNS(null, "x", p.x);
        img.setAttributeNS(null, "y", p.y);
        img.setAttributeNS(null, "width", p.width);
        img.setAttributeNS(null, "height", p.height);
        img.style.cursor = "pointer";
        img.onclick = () => revealPanel(p.id);
        svg.appendChild(img);

        // --- 2. テキストオーバーレイ (はみ出し防止ロジック) ---
        // パネルが極端に小さい場合は非表示
        if (p.width < 40 || p.height < 25) return;

        // パネルの幅に合わせてフォントサイズを微調整 (基本はbaseFontSize)
        // 幅が狭いパネルの場合だけ、文字がはみ出さないように縮小させる
        let fontSize = baseFontSize;
        const maxTextLen = `${p.name}・${p.giftValue}pt`.length;
        if (p.width < (maxTextLen * fontSize * 0.6)) {
            fontSize = Math.max(10, p.width / (maxTextLen * 0.7));
        }

        const textX = p.x + p.width / 2;
        const textY = p.y + p.height / 2;

        const textGroup = document.createElementNS(ns, "g");
        textGroup.setAttribute("font-family", "sans-serif");
        textGroup.setAttribute("font-size", fontSize + "px");
        textGroup.setAttribute("font-weight", "bold");
        textGroup.setAttribute("text-anchor", "middle");
        textGroup.setAttribute("dominant-baseline", "central");
        textGroup.style.pointerEvents = "none";

        // 袋文字（縁取り）スタイル
        const strokeStyle = "stroke: white; stroke-width: 3px; paint-order: stroke; stroke-linejoin: round;";

        // 上段：ギフト名・単価
        const nameText = document.createElementNS(ns, "text");
        nameText.setAttribute("x", textX);
        nameText.setAttribute("y", textY - (fontSize * 0.7)); 
        nameText.setAttribute("fill", "#333");
        nameText.setAttribute("style", strokeStyle);
        // 文字列が長すぎる場合はカット（または入り切る工夫）
        let displayName = `${p.name}・${p.giftValue}pt`;
        nameText.textContent = displayName;
        textGroup.appendChild(nameText);

        // 下段：達成状況
        const countText = document.createElementNS(ns, "text");
        countText.setAttribute("x", textX);
        countText.setAttribute("y", textY + (fontSize * 0.8));
        const isFull = p.currentCount >= p.currentTarget;
        countText.setAttribute("fill", isFull ? "#2e7d32" : "#e65100");
        countText.setAttribute("style", strokeStyle);
        countText.textContent = `${p.currentCount} / ${p.currentTarget}`;
        textGroup.appendChild(countText);

        svg.appendChild(textGroup);
    });
}

/**
 * 数値更新ロジック (更新後にCanvasを再描画する)
 */
function updateCounter(id, amount) {
    const p = panels.find(x => x.id === id);
    if (p) {
        p.currentCount = Math.max(0, p.currentCount + amount);
        renderControlList();
        renderCanvas(); // ★追加: Canvas（SVG）も再描画してテキストを更新
    }
}

function updateTarget(id, amount) {
    const p = panels.find(x => x.id === id);
    if (p) {
        p.currentTarget = Math.max(1, p.currentTarget + amount);
        renderControlList();
        renderCanvas(); // ★追加: Canvasも再描画
    }
}

function revealPanel(id) {
    const p = panels.find(x => x.id === id);
    if (p) {
        p.isRevealed = !p.isRevealed;
        renderCanvas();
        renderControlList();
    }
}

/**
 * ★修正: 画像コピー機能 (解像度・パネルサイズ完全同期版)
 * html2canvasのSVGレンダリングバグを回避し、最下層サイズで正確に出力します。
 */
function copyBoardImage() {
    const target = document.getElementById('capture-target');
    const svg = document.getElementById('panel-svg');
    
    if (!backgroundImage.src || backgroundImage.src === window.location.href) {
        alert("画像が読み込まれていません。");
        return;
    }

    // 1. 最下層基準の実解像度を取得 (viewBoxから)
    const viewBox = svg.getAttribute("viewBox").split(' ');
    const originalW = parseFloat(viewBox[2]);
    const originalH = parseFloat(viewBox[3]);

    // 2. 撮影専用の巨大な一時コンテナを作成 (画面外に配置)
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-99999px'; // 画面外
    tempContainer.style.left = '-99999px';
    tempContainer.style.width = originalW + 'px'; // 実解像度
    tempContainer.style.height = originalH + 'px';
    tempContainer.style.overflow = 'hidden';
    document.body.appendChild(tempContainer);

    // 3. 一時コンテナ内に、html2canvas撮影用の構造を手動で構築
    // --- A. 背景画像 (最下層) ---
    const clonedBgImg = document.createElement('img');
    clonedBgImg.src = backgroundImage.src; // 実画像データ
    clonedBgImg.style.width = '100%'; // コンテナ（実解像度）いっぱいに広げる
    clonedBgImg.style.height = '100%';
    clonedBgImg.style.objectFit = 'fill';
    clonedBgImg.style.position = 'absolute';
    clonedBgImg.style.top = '0';
    clonedBgImg.style.left = '0';
    tempContainer.appendChild(clonedBgImg);

    // --- B. パネル (SVGをそのままクローン) ---
    const clonedSvg = svg.cloneNode(true); // 現在のSVG（画像+テキスト）を全コピー
    clonedSvg.style.width = '100%'; // コンテナ（実解像度）いっぱいに広げる
    clonedSvg.style.height = '100%';
    clonedSvg.style.position = 'absolute';
    clonedSvg.style.top = '0';
    clonedSvg.style.left = '0';
    // html2canvasにSVGであることを認識させるためのヒント
    clonedSvg.setAttribute('width', originalW);
    clonedSvg.setAttribute('height', originalH);
    tempContainer.appendChild(clonedSvg);

    // 4. 一時コンテナをhtml2canvasで撮影
    html2canvas(tempContainer, {
        useCORS: true,
        width: originalW,  // 出力サイズ
        height: originalH,
        scale: 1,          // 1倍で出力
        backgroundColor: null,
        logging: false,    // デバッグ用ログをオフ
    }).then(canvas => {
        // 5. 撮影が終わったら一時コンテナを削除
        document.body.removeChild(tempContainer);

        canvas.toBlob(blob => {
            try {
                const item = new ClipboardItem({ "image/png": blob });
                navigator.clipboard.write([item]).then(() => {
                    alert(`最下層サイズ(${originalW}x${originalH})で正確にコピーしました！パネル上のテキストも含まれます。`);
                });
            } catch (err) {
                // Clipboard APIが失敗した場合は保存
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `panel_fixed_${Date.now()}.png`;
                a.click();
                alert("クリップボードへのコピーに制限があるため、画像を保存しました。");
            }
        });
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
