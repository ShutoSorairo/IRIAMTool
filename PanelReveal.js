/**
 * IRIAM パネル開けツール - PanelReveal.js
 * 1. PSD読み込み (最下層を背景、他をパネル化)
 * 2. サイズ完全同期 (最下層レイヤーの解像度を基準に動作)
 * 3. ギフト判定 & カウンター (レイヤー名から単価取得 + 達成数/ノルマ管理)
 * 4. 画像結合コピー (閉じているパネルのみを背景に重ねて出力)
 */

// --- グローバル変数 ---
let panels = []; 
let backgroundImage = new Image();

window.onload = function() {
    // PSD読み込みイベント
    const psdInput = document.getElementById('psd-upload');
    if (psdInput) {
        psdInput.addEventListener('change', handlePSDInput);
    }

    // 画像コピーボタン
    const copyBtn = document.querySelector('.btn-tweet');
    if (copyBtn) {
        copyBtn.onclick = copyBoardImage;
    }

    // パネルリセット
    const resetBtn = document.getElementById('reset-panels');
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (confirm("すべてのパネルを初期化しますか？")) {
                panels = [];
                renderCanvas();
                renderControlList();
            }
        };
    }

    // モーダル外クリックで閉じる
    window.onclick = (e) => {
        const modal = document.getElementById('control-popup');
        if (e.target == modal) toggleControlPopup();
    };
};

/**
 * ポップアップ（モーダル）の開閉
 */
function toggleControlPopup() {
    const modal = document.getElementById('control-popup');
    if (!modal) return;
    modal.style.display = (modal.style.display === 'none') ? 'flex' : 'none';
    if (modal.style.display === 'flex') renderControlList();
}

/**
 * PSD読み込みと解析
 */
async function handlePSDInput(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        const buffer = event.target.result;
        const PSD = window.require ? window.require("psd") : window.PSD;
        if (!PSD) {
            alert("PSD.js ライブラリが読み込まれていません。");
            return;
        }

        const psd = new PSD(new Uint8Array(buffer));
        
        try {
            psd.parse();
        } catch (err) {
            alert("PSDの解析に失敗しました。RGBモードのPSDを使用してください。");
            return;
        }

        // 実レイヤーのみ抽出（重なり順：上から順）
        let allLayers = psd.tree().descendants().filter(n => n.isLayer());
        if (allLayers.length < 2) {
            alert("背景とパネル、最低2枚必要です。");
            return;
        }

        // --- 1. 背景の処理（最下層レイヤーを基準にする） ---
        const bgNode = allLayers.pop(); 
        const bgNodeData = bgNode.export();
        const bgImgUri = bgNode.layer.image.toPng().src;

        // --- 2. 画面リサイズと解像度同期 ---
        const target = document.getElementById('capture-target');
        const svg = document.getElementById('panel-svg');
        const hiddenImg = document.getElementById('hidden-image');

        if (target) {
            target.style.aspectRatio = `${bgNodeData.width} / ${bgNodeData.height}`;
            target.style.width = "100%"; 
            target.style.maxWidth = bgNodeData.width + "px";
        }
        if (svg) {
            svg.setAttribute("viewBox", `0 0 ${bgNodeData.width} ${bgNodeData.height}`);
        }

        hiddenImg.src = bgImgUri;
        backgroundImage.src = bgImgUri;
        document.getElementById('no-image-text').style.display = 'none';

        // --- 3. パネル生成とギフトロジック ---
        panels = allLayers.map(layer => {
            const node = layer.export();
            let layerImage = "";
            try { layerImage = layer.layer.image.toPng().src; } catch (err) {}

            let giftName = node.name;
            let giftValue = 0;
            if (node.name.includes('_')) {
                const parts = node.name.split('_');
                giftName = parts[0];
                const ptMatch = parts[1].match(/(\d+)pt/);
                if (ptMatch) giftValue = parseInt(ptMatch[1]);
            }

            return {
                id: 'p-' + Math.random().toString(36).substr(2, 9),
                name: giftName,
                giftValue: giftValue,    // 単価
                currentTarget: 1,        // 初期ノルマ
                currentCount: 0,         // 現在数
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
            alert(`背景サイズ(${bgNodeData.width}x${bgNodeData.height})で読み込みました。`);
        };
    };
    reader.readAsArrayBuffer(file);
}

/**
 * SVGキャンバスの描画
 */
function renderCanvas() {
    const svg = document.getElementById('panel-svg');
    if (!svg) return;
    svg.innerHTML = '';

    panels.forEach(p => {
        if (p.isRevealed) return;

        const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
        img.setAttributeNS(null, "href", p.image);
        img.setAttributeNS(null, "x", p.x);
        img.setAttributeNS(null, "y", p.y);
        img.setAttributeNS(null, "width", p.width);
        img.setAttributeNS(null, "height", p.height);
        img.style.cursor = "pointer";
        img.onclick = () => revealPanel(p.id);
        
        svg.appendChild(img);
    });
}

/**
 * 数値更新ロジック
 */
function updateCounter(id, amount) {
    const p = panels.find(x => x.id === id);
    if (p) {
        p.currentCount = Math.max(0, p.currentCount + amount);
        renderControlList();
    }
}

function updateTarget(id, amount) {
    const p = panels.find(x => x.id === id);
    if (p) {
        p.currentTarget = Math.max(1, p.currentTarget + amount);
        renderControlList();
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
 * カード型操作リストの描画
 */
function renderControlList() {
    const list = document.getElementById('control-list');
    if (!list) return;
    list.innerHTML = panels.length ? '' : '<div style="padding:20px; color:#999;">PSDを読み込んでください</div>';

    panels.forEach(p => {
        const item = document.createElement('div');
        item.className = 'panel-card';
        
        const progress = Math.min(100, (p.currentCount / p.currentTarget) * 100);
        const isFull = p.currentCount >= p.currentTarget;

        item.innerHTML = `
            <div class="card-main">
                <img src="${p.image}" class="card-img">
                <div class="card-info">
                    <div class="card-title">
                        <span class="gift-name">${p.name}</span>
                        <span class="gift-value">${p.giftValue}pt</span>
                    </div>
                    <div class="card-counter">
                        達成: <span class="count-num ${isFull ? 'full' : ''}">${p.currentCount}</span>
                        <span class="count-separator">/</span>
                        <span class="count-target">ノルマ:${p.currentTarget}個</span>
                    </div>
                    <div class="card-progress-bar">
                        <div class="progress-fill" style="width: ${progress}%; background: ${isFull ? '#4caf50' : '#ff9800'};"></div>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <div class="action-group">
                    <span class="group-label">個数</span>
                    <button onclick="updateCounter('${p.id}', 1)" class="btn-plus">＋</button>
                    <button onclick="updateCounter('${p.id}', -1)" class="btn-minus">－</button>
                </div>
                <div class="action-group">
                    <span class="group-label">ノルマ</span>
                    <button onclick="updateTarget('${p.id}', 1)" class="btn-up">▲</button>
                    <button onclick="updateTarget('${p.id}', -1)" class="btn-down">▼</button>
                </div>
                <button onclick="revealPanel('${p.id}')" class="btn-reveal ${p.isRevealed ? 'opened' : ''}">
                    ${p.isRevealed ? '閉じる' : '開ける'}
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

/**
 * 画像コピー機能 (背景サイズ完全同期)
 */
function copyBoardImage() {
    const target = document.getElementById('capture-target');
    const svg = document.getElementById('panel-svg');
    if (!backgroundImage.src) return alert("画像がありません");

    const viewBox = svg.getAttribute("viewBox").split(' ');
    const exportW = parseFloat(viewBox[2]);
    const exportH = parseFloat(viewBox[3]);

    html2canvas(target, {
        useCORS: true,
        width: exportW,
        height: exportH,
        scale: 1, 
        backgroundColor: null,
        onclone: (clonedDoc) => {
            const clonedTarget = clonedDoc.getElementById('capture-target');
            clonedTarget.style.width = exportW + "px";
            clonedTarget.style.height = exportH + "px";
        }
    }).then(canvas => {
        canvas.toBlob(blob => {
            try {
                const item = new ClipboardItem({ "image/png": blob });
                navigator.clipboard.write([item]).then(() => alert("背景サイズでコピーしました！"));
            } catch (err) {
                alert("コピーに失敗しました。画像を保存してください。");
            }
        });
    });
}
