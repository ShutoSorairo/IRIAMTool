/**
 * IRIAM パネル開けツール - PanelReveal.js
 * * 1. PSD読み込み (一番下を背景、他をパネル化)
 * 2. 縮尺自動調整 (巨大画像でもレイアウトを壊さない)
 * 3. ギフト判定ロジック (レイヤー名から pt を抽出)
 * 4. 画像コピー (閉じているパネルのみ結合)
 */

// --- グローバル変数 ---
let panels = []; 
let isEditMode = false;
let backgroundImage = new Image();

window.onload = function() {
    // PSD読み込みイベント
    const psdInput = document.getElementById('psd-upload');
    if (psdInput) {
        psdInput.addEventListener('change', handlePSDInput);
    }

    // 画像コピーボタンのイベント (HTMLの .btn-tweet ボタンと紐付け)
    const copyBtn = document.querySelector('.btn-tweet');
    if (copyBtn) {
        copyBtn.onclick = copyBoardImage;
    }

    // パネルリセット
    const resetBtn = document.getElementById('reset-panels');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("すべてのパネルを初期化しますか？")) {
                panels = [];
                renderCanvas();
                renderControlList();
            }
        });
    }
};

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
            console.error(err);
            return;
        }

        // 全レイヤーを取得 (重なり順：上から順)
        let allLayers = psd.tree().descendants().filter(n => n.isLayer());
        if (allLayers.length < 2) {
            alert("背景レイヤーとパネルレイヤー、最低2枚以上必要です。");
            return;
        }

        // --- 1. 背景の処理 (一番下のレイヤー) ---
        const bgNode = allLayers.pop(); 
        const bgNodeData = bgNode.export();
        const bgImgUri = bgNode.layer.image.toPng().src;

        // --- 2. 画面リサイズと縮尺設定 ---
        const target = document.getElementById('capture-target');
        const svg = document.getElementById('panel-svg');
        const hiddenImg = document.getElementById('hidden-image');

        if (target) {
            // 見た目のサイズを親要素に合わせ、縦横比を固定
            target.style.aspectRatio = `${bgNodeData.width} / ${bgNodeData.height}`;
            target.style.width = "100%"; 
            target.style.maxWidth = bgNodeData.width + "px"; // 元サイズより大きくしない
        }
        if (svg) {
            // SVG内の座標系をPSDの解像度(px)と一致させる
            svg.setAttribute("viewBox", `0 0 ${bgNodeData.width} ${bgNodeData.height}`);
            svg.style.width = "100%";
            svg.style.height = "100%";
        }

        hiddenImg.src = bgImgUri;
        backgroundImage.src = bgImgUri;
        document.getElementById('no-image-text').style.display = 'none';

        // --- 3. パネル生成とギフトロジック ---
        panels = allLayers.map(layer => {
            const node = layer.export();
            let layerImage = "";
            try {
                layerImage = layer.layer.image.toPng().src;
            } catch (err) {}

            // ギフト判定 (例: ハート_100pt)
            let giftName = node.name;
            let giftPoint = 0;
            if (node.name.includes('_')) {
                const parts = node.name.split('_');
                giftName = parts[0];
                const ptMatch = parts[1].match(/(\d+)pt/);
                if (ptMatch) giftPoint = parseInt(ptMatch[1]);
            }

            return {
                id: 'panel-' + Date.now() + Math.random().toString(36).substr(2, 9),
                name: giftName,
                point: giftPoint,
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
        };
    };
    reader.readAsArrayBuffer(file);
}

/**
 * SVG キャンバスの描画
 */
function renderCanvas() {
    const svg = document.getElementById('panel-svg');
    if (!svg) return;
    svg.innerHTML = '';

    panels.forEach(panel => {
        if (panel.isRevealed) return; // 開いたパネルは描画しない

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

/**
 * 画像コピー機能 (背景 + 閉じているパネル)
 */
function copyBoardImage() {
    const target = document.getElementById('capture-target');
    const bgImg = document.getElementById('hidden-image');
    
    if (!bgImg.src || bgImg.src === window.location.href) {
        alert("画像が読み込まれていません。");
        return;
    }

    // html2canvas で現在の見た目（SVG含む）をキャプチャ
    html2canvas(target, {
        useCORS: true,
        scale: 2, // 高画質書き出し
        backgroundColor: null
    }).then(canvas => {
        canvas.toBlob(blob => {
            try {
                const item = new ClipboardItem({ "image/png": blob });
                navigator.clipboard.write([item]).then(() => {
                    alert("画像をクリップボードにコピーしました！");
                });
            } catch (err) {
                alert("ブラウザの制限によりコピーできませんでした。画像を右クリックで保存してください。");
            }
        });
    });
}

/**
 * パネル操作とリスト表示
 */
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

    if (panels.length === 0) {
        listArea.innerHTML = '<div style="color:#999; padding:20px;">PSDを読み込んでください</div>';
        return;
    }

    panels.forEach(panel => {
        const item = document.createElement('div');
        item.className = 'control-item';
        item.style = "display:flex; align-items:center; gap:10px; padding:8px; border-bottom:1px solid #eee;";
        
        const ptBadge = panel.point > 0 
            ? `<span style="background:#ff9800; color:white; padding:2px 6px; border-radius:10px; font-size:10px;">${panel.point}pt</span>` 
            : '';

        item.innerHTML = `
            <img src="${panel.image}" style="width:40px; height:40px; object-fit:contain; background:#f0f0f0; border-radius:4px;">
            <div style="flex:1; text-align:left;">
                <div style="font-weight:bold; font-size:12px;">${panel.name} ${ptBadge}</div>
            </div>
            <button onclick="revealPanel('${panel.id}')" style="font-size:11px;">
                ${panel.isRevealed ? '閉じる' : '開ける'}
            </button>
        `;
        listArea.appendChild(item);
    });
}

function setMode(mode) {
    isEditMode = (mode === 'edit');
    document.getElementById('btn-play').classList.toggle('active', mode === 'play');
    document.getElementById('btn-edit').classList.toggle('active', mode === 'edit');
}
