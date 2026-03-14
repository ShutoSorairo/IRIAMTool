// --- データ管理 ---
let panels = []; 
let backgroundImage = new Image();

window.onload = function() {
    const psdInput = document.getElementById('psd-upload');
    if (psdInput) psdInput.addEventListener('change', handlePSDInput);

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

        // 一番下のレイヤーを背景にする
        const bgNode = allLayers.pop(); 
        const bgNodeData = bgNode.export();
        const bgImgUri = bgNode.layer.image.toPng().src;

        // 縮尺とサイズの自動調整
        const target = document.getElementById('capture-target');
        const svg = document.getElementById('panel-svg');
        const hiddenImg = document.getElementById('hidden-image');

        target.style.aspectRatio = `${bgNodeData.width} / ${bgNodeData.height}`;
        target.style.maxWidth = bgNodeData.width + "px";
        svg.setAttribute("viewBox", `0 0 ${bgNodeData.width} ${bgNodeData.height}`);

        hiddenImg.src = bgImgUri;
        backgroundImage.src = bgImgUri;
        document.getElementById('no-image-text').style.display = 'none';

        // パネル生成 + ギフト判定ロジック
        panels = allLayers.map(layer => {
            const node = layer.export();
            let giftName = node.name;
            let giftPoint = 0;

            // レイヤー名からポイント抽出 (例: ハート_100pt)
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
            alert("PSDの読み込みが完了しました！「パネル操作」から開閉できます。");
        };
    };
    reader.readAsArrayBuffer(file);
}

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

function revealPanel(id) {
    const p = panels.find(x => x.id === id);
    if (p) {
        p.isRevealed = !p.isRevealed;
        renderCanvas();
        renderControlList();
    }
}

function renderControlList() {
    const list = document.getElementById('control-list');
    if (!list) return;
    list.innerHTML = panels.length ? '' : '<div style="padding:20px; color:#999;">PSDを読み込んでください</div>';

    panels.forEach(p => {
        const item = document.createElement('div');
        item.className = 'control-item';
        const pt = p.point > 0 ? `<span style="background:#ff9800; color:white; padding:2px 6px; border-radius:10px; font-size:10px;">${p.point}pt</span>` : '';
        item.innerHTML = `
            <img src="${p.image}" style="width:40px; height:40px; object-fit:contain; background:#eee; border-radius:4px;">
            <div style="flex:1; text-align:left; font-size:13px;"><b>${p.name}</b><br>${pt}</div>
            <button onclick="revealPanel('${p.id}')" style="padding:5px 10px;">${p.isRevealed ? '閉じる' : '開ける'}</button>
        `;
        list.appendChild(item);
    });
}

function copyBoardImage() {
    const target = document.getElementById('capture-target');
    if (!backgroundImage.src) return alert("画像がありません");

    html2canvas(target, { useCORS: true, scale: 2 }).then(canvas => {
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => alert("現在の状態（閉じているパネルを結合）でコピーしました！"));
        });
    });
}
