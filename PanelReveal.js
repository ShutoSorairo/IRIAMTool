// --- データ管理 ---
let panels = []; 
let backgroundImage = new Image();

window.onload = function() {
    const psdInput = document.getElementById('psd-upload');
    if (psdInput) psdInput.addEventListener('change', handlePSDInput);

    // 画像コピーボタン
    const copyBtn = document.querySelector('.btn-tweet');
    if (copyBtn) copyBtn.onclick = copyBoardImage;

    // リセットボタン
    const resetBtn = document.getElementById('reset-panels');
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (confirm("パネルをすべて削除しますか？")) {
                panels = [];
                renderCanvas();
                renderControlList();
            }
        };
    }
};

/**
 * PSD解析ロジック
 * すべての基準を最下層レイヤーのサイズに設定
 */
async function handlePSDInput(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        const PSD = window.require ? window.require("psd") : window.PSD;
        const psd = new PSD(new Uint8Array(event.target.result));
        
        try {
            psd.parse();
        } catch (err) {
            alert("PSDの解析に失敗しました。RGBモードのPSDを使用してください。");
            return;
        }

        let allLayers = psd.tree().descendants().filter(n => n.isLayer());
        if (allLayers.length < 2) {
            alert("背景とパネル、最低2枚のレイヤーが必要です。");
            return;
        }

        // --- 基準となる最下層レイヤーの取得 ---
        const bgNode = allLayers.pop(); 
        const bgNodeData = bgNode.export(); // ここに width, height, top, left が入る
        const bgImgUri = bgNode.layer.image.toPng().src;

        // --- 表示枠とSVGを「最下層のサイズ」に固定 ---
        const target = document.getElementById('capture-target');
        const svg = document.getElementById('panel-svg');
        const hiddenImg = document.getElementById('hidden-image');

        // CSSのaspect-ratioで崩れを防止し、内部解像度(viewBox)を背景サイズに合わせる
        target.style.aspectRatio = `${bgNodeData.width} / ${bgNodeData.height}`;
        target.style.maxWidth = bgNodeData.width + "px";
        target.style.width = "100%";
        
        // SVGの座標空間を背景のピクセルサイズと1:1にする
        svg.setAttribute("viewBox", `0 0 ${bgNodeData.width} ${bgNodeData.height}`);

        hiddenImg.src = bgImgUri;
        backgroundImage.src = bgImgUri;
        document.getElementById('no-image-text').style.display = 'none';

        // --- パネル生成 (背景からの相対位置を計算) ---
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
                name: giftName,
                point: giftPoint,
                // 背景の左上を(0,0)とした相対座標に変換
                x: node.left - bgNodeData.left,
                y: node.top - bgNodeData.top,
                width: node.width,
                height: node.height,
                image: layer.layer.image.toPng().src,
                isRevealed: false
            };
        });

        backgroundImage.onload = () => {
            renderCanvas();
            renderControlList();
            alert(`背景サイズ(${bgNodeData.width}x${bgNodeData.height})に合わせて同期しました。`);
        };
    };
    reader.readAsArrayBuffer(file);
}

/**
 * 画像コピー機能
 * 背景レイヤーの解像度で正確に出力
 */
function copyBoardImage() {
    const target = document.getElementById('capture-target');
    const svg = document.getElementById('panel-svg');
    
    if (!backgroundImage.src) return alert("画像がありません");

    // 背景(viewBox)の解像度を取得
    const viewBox = svg.getAttribute("viewBox").split(' ');
    const exportW = parseFloat(viewBox[2]);
    const exportH = parseFloat(viewBox[3]);

    html2canvas(target, {
        useCORS: true,
        width: exportW,
        height: exportH,
        scale: 1, // 1倍で元のピクセル数にする
        backgroundColor: null,
        onclone: (clonedDoc) => {
            const clonedTarget = clonedDoc.getElementById('capture-target');
            clonedTarget.style.width = exportW + "px";
            clonedTarget.style.height = exportH + "px";
        }
    }).then(canvas => {
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => alert("背景サイズで画像をコピーしました！"));
        });
    });
}

// ポップアップ開閉
function toggleControlPopup() {
    const modal = document.getElementById('control-popup');
    modal.style.display = (modal.style.display === 'none') ? 'flex' : 'none';
    if (modal.style.display === 'flex') renderControlList();
}

function renderCanvas() {
    const svg = document.getElementById('panel-svg');
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
        item.style = "display:flex; align-items:center; gap:10px; padding:10px; border-bottom:1px solid #f5f5f5;";
        const pt = p.point > 0 ? `<span style="background:#ff9800; color:white; padding:2px 6px; border-radius:10px; font-size:10px;">${p.point}pt</span>` : '';
        item.innerHTML = `
            <img src="${p.image}" style="width:40px;height:40px;object-fit:contain;background:#eee;">
            <div style="flex:1;text-align:left;font-size:12px;"><b>${p.name}</b> ${pt}</div>
            <button onclick="revealPanel('${p.id}')">${p.isRevealed ? '閉' : '開'}</button>`;
        list.appendChild(item);
    });
}
