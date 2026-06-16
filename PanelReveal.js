/**
 * IRIAM パネル開けツール
 */

const NS = "http://www.w3.org/2000/svg";

let panels = [];
let backgroundImage = new Image();
let boardW = 800, boardH = 600;

// 描画・編集モード
let editMode = false;
let currentShape = 'rect';
let panelColor = '#93c5fd';
let drawMode = 'draw'; // 'draw' | 'select'
let selectedId = null;
let ix = null; // インタラクション状態

window.onload = () => {
    document.getElementById('psd-upload').addEventListener('change', handlePSDInput);
    document.getElementById('img-upload').addEventListener('change', handleImageInput);

    const svg = document.getElementById('panel-svg');
    svg.addEventListener('mousedown', onMD);
    svg.addEventListener('mousemove', onMM);
    svg.addEventListener('mouseup', onMU);
    svg.addEventListener('mouseleave', onMU);

    window.addEventListener('click', e => {
        if (e.target === document.getElementById('control-popup')) toggleControlPopup();
    });

    // Firestoreからの読み込みはPanelReveal-autosave.jsが担当
    // localStorageのみ使用の場合はこちらで読み込む
    if (!localStorage.getItem('iriam_uid')) loadPanelState();
};

// ---- SVG座標変換 ----
function svgPt(e) {
    const svg = document.getElementById('panel-svg');
    const r = svg.getBoundingClientRect();
    const vb = svg.getAttribute('viewBox');
    if (!vb) return { x: e.clientX - r.left, y: e.clientY - r.top };
    const parts = vb.split(' ').map(Number);
    const scaleX = parts[2] / r.width;
    const scaleY = parts[3] / r.height;
    return {
        x: parts[0] + (e.clientX - r.left) * scaleX,
        y: parts[1] + (e.clientY - r.top) * scaleY
    };
}

// ---- マウスイベント ----
function onMD(e) {
    const pt = svgPt(e);
    const type = e.target.dataset ? e.target.dataset.type : null;
    const pid = e.target.dataset ? e.target.dataset.panelId : null;

    if (!editMode) {
        if (pid && (type === 'panel' || type === 'panel-bg')) {
            confirmReveal(pid);
        }
        return;
    }

    if (drawMode === 'draw') {
        ix = { type: 'drawing', sx: pt.x, sy: pt.y, cx: pt.x, cy: pt.y };
        return;
    }

    // 選択モード
    if (type === 'handle' && pid) {
        const p = panels.find(x => x.id === pid);
        if (!p) return;
        ix = {
            type: 'resizing', pid,
            handle: e.target.dataset.handle,
            sx: pt.x, sy: pt.y,
            orig: { x: p.x, y: p.y, w: p.width, h: p.height },
            valid: true
        };
        e.preventDefault();
        return;
    }

    if ((type === 'panel' || type === 'panel-bg') && pid) {
        const p = panels.find(x => x.id === pid);
        if (!p) return;
        selectedId = pid;
        ix = { type: 'moving', pid, sx: pt.x, sy: pt.y, ox: p.x, oy: p.y, valid: true };
        renderCanvas();
        updatePanelEditor();
        return;
    }

    selectedId = null;
    hidePanelEditor();
    renderCanvas();
}

function onMM(e) {
    if (!ix) return;
    const pt = svgPt(e);

    if (ix.type === 'drawing') {
        ix.cx = pt.x; ix.cy = pt.y;
        renderCanvas();
        return;
    }

    if (ix.type === 'moving') {
        const p = panels.find(x => x.id === ix.pid);
        if (!p) return;
        p.x = ix.ox + (pt.x - ix.sx);
        p.y = ix.oy + (pt.y - ix.sy);
        renderCanvas();
        return;
    }

    if (ix.type === 'resizing') {
        const p = panels.find(x => x.id === ix.pid);
        if (!p) return;
        applyResize(p, ix, pt.x, pt.y);
        renderCanvas();
    }
}

function onMU(e) {
    if (!ix) return;

    if (ix.type === 'drawing') {
        const x = Math.min(ix.sx, ix.cx), y = Math.min(ix.sy, ix.cy);
        const w = Math.abs(ix.cx - ix.sx), h = Math.abs(ix.cy - ix.sy);
        if (w > 20 && h > 20) {
            const newPanel = {
                id: 'p-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                name: 'ギフト名', giftValue: 0,
                currentTarget: 1, currentCount: 0,
                x, y, width: w, height: h,
                shape: currentShape, color: panelColor,
                image: '', isRevealed: false
            };
            if (!isOverlapping(newPanel)) {
                panels.push(newPanel);
                selectedId = newPanel.id;
                updatePanelEditor();
            }
        }
        ix = null;
        renderCanvas();
        savePanelState();
        return;
    }

    if (ix.type === 'moving') {
        ix = null;
        renderCanvas();
        savePanelState();
        return;
    }

    if (ix.type === 'resizing') {
        ix = null;
        renderCanvas();
        savePanelState();
        return;
    }

    ix = null;
}

function applyResize(p, ixState, px, py) {
    const dx = px - ixState.sx, dy = py - ixState.sy;
    const o = ixState.orig;
    const MIN = 30;
    switch (ixState.handle) {
        case 'se': p.width = Math.max(MIN, o.w + dx); p.height = Math.max(MIN, o.h + dy); break;
        case 'e':  p.width = Math.max(MIN, o.w + dx); break;
        case 's':  p.height = Math.max(MIN, o.h + dy); break;
        case 'sw':
            p.width = Math.max(MIN, o.w - dx);
            p.x = o.x + o.w - p.width;
            p.height = Math.max(MIN, o.h + dy); break;
        case 'nw':
            p.width = Math.max(MIN, o.w - dx);
            p.x = o.x + o.w - p.width;
            p.height = Math.max(MIN, o.h - dy);
            p.y = o.y + o.h - p.height; break;
        case 'ne':
            p.width = Math.max(MIN, o.w + dx);
            p.height = Math.max(MIN, o.h - dy);
            p.y = o.y + o.h - p.height; break;
        case 'n':
            p.height = Math.max(MIN, o.h - dy);
            p.y = o.y + o.h - p.height; break;
        case 'w':
            p.width = Math.max(MIN, o.w - dx);
            p.x = o.x + o.w - p.width; break;
    }
}

// ---- 衝突判定（マスク生成用） ----
function boxOverlaps(a, b) {
    if (a.id === b.id || b.isRevealed) return false;
    return !(a.x + a.width <= b.x || b.x + b.width <= a.x ||
             a.y + a.height <= b.y || b.y + b.height <= a.y);
}

// ---- 図形ポイント計算 ----
function heartPath(p) {
    const x = p.x, y = p.y, w = p.width, h = p.height;
    const s = (nx, ny) => `${x + nx * w} ${y + ny * h}`;
    const c = (nx, ny) => `${x + nx * w},${y + ny * h}`;
    return `M ${s(0.5, 0.9)} C ${c(0.15, 0.75)} ${c(0, 0.55)} ${s(0, 0.38)} C ${c(0, 0.08)} ${c(0.3, 0)} ${s(0.5, 0.28)} C ${c(0.7, 0)} ${c(1, 0.08)} ${s(1, 0.38)} C ${c(1, 0.55)} ${c(0.85, 0.75)} ${s(0.5, 0.9)} Z`;
}

function hexPoints(cx, cy, rx, ry) {
    return Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return `${cx + rx * Math.cos(a)},${cy + ry * Math.sin(a)}`;
    }).join(' ');
}

function starPoints(cx, cy, rx, ry) {
    return Array.from({ length: 10 }, (_, i) => {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const r = i % 2 === 0 ? 1 : 0.42;
        return `${cx + rx * r * Math.cos(a)},${cy + ry * r * Math.sin(a)}`;
    }).join(' ');
}

// ---- 図形SVG要素生成 ----
function makeShapeEl(p, fill, stroke, sw, extra) {
    const cx = p.x + p.width / 2, cy = p.y + p.height / 2;
    let el;
    switch (p.shape) {
        case 'roundrect':
            el = document.createElementNS(NS, 'rect');
            el.setAttributeNS(null, 'x', p.x); el.setAttributeNS(null, 'y', p.y);
            el.setAttributeNS(null, 'width', p.width); el.setAttributeNS(null, 'height', p.height);
            el.setAttributeNS(null, 'rx', Math.min(20, p.width * 0.18, p.height * 0.18));
            break;
        case 'circle':
            el = document.createElementNS(NS, 'ellipse');
            el.setAttributeNS(null, 'cx', cx); el.setAttributeNS(null, 'cy', cy);
            el.setAttributeNS(null, 'rx', p.width / 2); el.setAttributeNS(null, 'ry', p.height / 2);
            break;
        case 'diamond':
            el = document.createElementNS(NS, 'polygon');
            el.setAttributeNS(null, 'points',
                `${cx},${p.y} ${p.x + p.width},${cy} ${cx},${p.y + p.height} ${p.x},${cy}`);
            break;
        case 'hexagon':
            el = document.createElementNS(NS, 'polygon');
            el.setAttributeNS(null, 'points', hexPoints(cx, cy, p.width / 2, p.height / 2));
            break;
        case 'star':
            el = document.createElementNS(NS, 'polygon');
            el.setAttributeNS(null, 'points', starPoints(cx, cy, p.width / 2, p.height / 2));
            break;
        case 'triangle':
            el = document.createElementNS(NS, 'polygon');
            el.setAttributeNS(null, 'points',
                `${cx},${p.y} ${p.x + p.width},${p.y + p.height} ${p.x},${p.y + p.height}`);
            break;
        case 'heart':
            el = document.createElementNS(NS, 'path');
            el.setAttributeNS(null, 'd', heartPath(p));
            break;
        default: // 'rect' or PSD
            el = document.createElementNS(NS, 'rect');
            el.setAttributeNS(null, 'x', p.x); el.setAttributeNS(null, 'y', p.y);
            el.setAttributeNS(null, 'width', p.width); el.setAttributeNS(null, 'height', p.height);
    }
    el.setAttributeNS(null, 'fill', fill);
    el.setAttributeNS(null, 'stroke', stroke);
    el.setAttributeNS(null, 'stroke-width', sw);
    if (extra) Object.entries(extra).forEach(([k, v]) => el.setAttributeNS(null, k, v));
    return el;
}

// ---- キャンバス描画 ----
function renderCanvas() {
    const svg = document.getElementById('panel-svg');
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // テキストシャドウフィルタ
    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = `
        <filter id="text-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.7"/>
        </filter>`;
    svg.appendChild(defs);

    svg.setAttribute('viewBox', `0 0 ${boardW} ${boardH}`);

    panels.forEach((p, i) => renderPanel(svg, p, i));

    // 描画中プレビュー
    if (ix && ix.type === 'drawing') {
        const x = Math.min(ix.sx, ix.cx), y = Math.min(ix.sy, ix.cy);
        const w = Math.abs(ix.cx - ix.sx), h = Math.abs(ix.cy - ix.sy);
        if (w > 5 && h > 5) {
            const previewP = { id: '__preview__', x, y, width: w, height: h, shape: currentShape, isRevealed: false };
            const el = makeShapeEl(previewP, panelColor + '55', '#1976d2', 2, { 'stroke-dasharray': '6,3' });
            el.style.pointerEvents = 'none';
            svg.appendChild(el);
        }
    }

    // 選択中パネルのハンドル
    if (editMode && selectedId) {
        const p = panels.find(x => x.id === selectedId);
        if (p) renderHandles(svg, p);
    }

    svg.style.cursor = editMode ? (drawMode === 'draw' ? 'crosshair' : 'default') : 'default';

    updateCounter();
}

function renderPanel(svg, p, panelIndex) {
    const isSelected = editMode && selectedId === p.id;
    const cursor = editMode ? (drawMode === 'select' ? 'move' : 'crosshair') : 'pointer';

    if (p.isRevealed) {
        const border = makeShapeEl(p, 'none', '#bbb', 1);
        border.setAttributeNS(null, 'opacity', '0.3');
        border.style.pointerEvents = 'none';
        svg.appendChild(border);
        return;
    }

    // 先行パネル（追加順が早い＝優先）の領域をマスクで削る
    const maskId = 'mask-' + p.id;
    const mask = document.createElementNS(NS, 'mask');
    mask.setAttributeNS(null, 'id', maskId);
    // 白 = 表示するエリア（自分の図形）
    const selfShape = makeShapeEl(p, 'white', 'none', 0);
    mask.appendChild(selfShape);
    // 黒 = 削るエリア（先行パネルの図形）
    for (let j = 0; j < panelIndex; j++) {
        const earlier = panels[j];
        if (!earlier.isRevealed) {
            mask.appendChild(makeShapeEl(earlier, 'black', 'none', 0));
        }
    }
    svg.appendChild(mask);

    // パネル全体を <g mask="..."> でラップ
    const g = document.createElementNS(NS, 'g');
    g.setAttributeNS(null, 'mask', `url(#${maskId})`);

    // 当たり判定用透明矩形
    const hitRect = document.createElementNS(NS, 'rect');
    hitRect.setAttributeNS(null, 'x', p.x); hitRect.setAttributeNS(null, 'y', p.y);
    hitRect.setAttributeNS(null, 'width', p.width); hitRect.setAttributeNS(null, 'height', p.height);
    hitRect.setAttributeNS(null, 'fill', 'transparent');
    hitRect.dataset.type = 'panel-bg';
    hitRect.dataset.panelId = p.id;
    hitRect.style.cursor = cursor;
    g.appendChild(hitRect);

    if (p.image) {
        const img = document.createElementNS(NS, 'image');
        img.setAttributeNS(null, 'href', p.image);
        img.setAttributeNS(null, 'x', p.x); img.setAttributeNS(null, 'y', p.y);
        img.setAttributeNS(null, 'width', p.width); img.setAttributeNS(null, 'height', p.height);
        img.dataset.type = 'panel';
        img.dataset.panelId = p.id;
        img.style.cursor = cursor;
        g.appendChild(img);
    } else {
        const col = p.color || '#93c5fd';
        const strokeColor = isSelected ? '#1976d2' : '#5b99d0';
        const strokeW = isSelected ? 2.5 : 1.5;
        const shape = makeShapeEl(p, col, strokeColor, strokeW);
        shape.dataset.type = 'panel';
        shape.dataset.panelId = p.id;
        shape.style.cursor = cursor;
        g.appendChild(shape);
    }

    renderPanelText(g, p);

    // ノルマ達成ハイライト
    if (p.currentCount >= p.currentTarget && p.currentTarget > 0) {
        const hl = document.createElementNS(NS, 'rect');
        hl.setAttributeNS(null, 'x', p.x); hl.setAttributeNS(null, 'y', p.y);
        hl.setAttributeNS(null, 'width', p.width); hl.setAttributeNS(null, 'height', p.height);
        hl.setAttributeNS(null, 'fill', 'none');
        hl.setAttributeNS(null, 'stroke', '#43a047');
        hl.setAttributeNS(null, 'stroke-width', 4);
        hl.style.pointerEvents = 'none';
        g.appendChild(hl);
    }

    svg.appendChild(g);
}

function renderPanelText(svg, p) {
    const cx = p.x + p.width / 2;
    const fontSize = Math.max(10, Math.min(18, p.width / 7, p.height / 5));

    if (p.name) {
        const t = document.createElementNS(NS, 'text');
        t.setAttributeNS(null, 'x', cx);
        t.setAttributeNS(null, 'y', p.y + p.height / 2 - fontSize * 0.3);
        t.setAttributeNS(null, 'text-anchor', 'middle');
        t.setAttributeNS(null, 'dominant-baseline', 'middle');
        t.setAttributeNS(null, 'font-size', fontSize);
        t.setAttributeNS(null, 'font-weight', 'bold');
        t.setAttributeNS(null, 'fill', '#fff');
        t.setAttributeNS(null, 'filter', 'url(#text-shadow)');
        t.style.pointerEvents = 'none';
        t.textContent = p.name;
        svg.appendChild(t);
    }

    const ct = document.createElementNS(NS, 'text');
    ct.setAttributeNS(null, 'x', cx);
    ct.setAttributeNS(null, 'y', p.y + p.height / 2 + fontSize * 1.0);
    ct.setAttributeNS(null, 'text-anchor', 'middle');
    ct.setAttributeNS(null, 'dominant-baseline', 'middle');
    ct.setAttributeNS(null, 'font-size', fontSize * 0.82);
    ct.setAttributeNS(null, 'fill', p.currentCount >= p.currentTarget ? '#a5d6a7' : '#fff');
    ct.setAttributeNS(null, 'filter', 'url(#text-shadow)');
    ct.style.pointerEvents = 'none';
    ct.textContent = `${p.currentCount} / ${p.currentTarget}`;
    svg.appendChild(ct);
}

function renderHandles(svg, p) {
    const border = makeShapeEl(p, 'none', '#1976d2', 2, { 'stroke-dasharray': '4,3' });
    border.style.pointerEvents = 'none';
    svg.appendChild(border);

    const handles = [
        { id: 'nw', x: p.x,             y: p.y },
        { id: 'n',  x: p.x + p.width/2, y: p.y },
        { id: 'ne', x: p.x + p.width,   y: p.y },
        { id: 'e',  x: p.x + p.width,   y: p.y + p.height/2 },
        { id: 'se', x: p.x + p.width,   y: p.y + p.height },
        { id: 's',  x: p.x + p.width/2, y: p.y + p.height },
        { id: 'sw', x: p.x,             y: p.y + p.height },
        { id: 'w',  x: p.x,             y: p.y + p.height/2 },
    ];
    const cursors = {
        nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize', e: 'ew-resize',
        se: 'nwse-resize', s: 'ns-resize', sw: 'nesw-resize', w: 'ew-resize'
    };
    const S = 10;

    handles.forEach(h => {
        const rect = document.createElementNS(NS, 'rect');
        rect.setAttributeNS(null, 'x', h.x - S / 2);
        rect.setAttributeNS(null, 'y', h.y - S / 2);
        rect.setAttributeNS(null, 'width', S);
        rect.setAttributeNS(null, 'height', S);
        rect.setAttributeNS(null, 'fill', '#fff');
        rect.setAttributeNS(null, 'stroke', '#1976d2');
        rect.setAttributeNS(null, 'stroke-width', 1.5);
        rect.style.cursor = cursors[h.id];
        rect.dataset.type = 'handle';
        rect.dataset.panelId = p.id;
        rect.dataset.handle = h.id;
        svg.appendChild(rect);
    });
}

// ---- 描画モード操作 ----
function toggleEditMode() {
    editMode = !editMode;
    const toolbar = document.getElementById('draw-toolbar');
    const btn = document.getElementById('btn-edit-toggle');

    if (editMode) {
        toolbar.style.display = 'flex';
        btn.textContent = '✅ 描画モード終了';
        btn.style.background = '#ff9800';
        const svg = document.getElementById('panel-svg');
        if (!svg.getAttribute('viewBox')) {
            svg.setAttribute('viewBox', `0 0 ${boardW} ${boardH}`);
        }
        document.getElementById('no-image-text').style.display = 'none';
    } else {
        toolbar.style.display = 'none';
        btn.textContent = '✏️ 描画モード';
        btn.style.background = '';
        selectedId = null;
        hidePanelEditor();
    }
    renderCanvas();
}

function setDrawMode(mode) {
    drawMode = mode;
    document.getElementById('btn-mode-draw').classList.toggle('active', mode === 'draw');
    document.getElementById('btn-mode-select').classList.toggle('active', mode === 'select');
    if (mode === 'draw') { selectedId = null; hidePanelEditor(); }
    renderCanvas();
}

function setShape(shape) {
    currentShape = shape;
    document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('sh-' + shape);
    if (btn) btn.classList.add('active');
}

// ---- パネルプロパティ編集 ----
function updatePanelEditor() {
    if (!selectedId) return;
    const p = panels.find(x => x.id === selectedId);
    if (!p) return;
    document.getElementById('panel-editor').style.display = 'flex';
    document.getElementById('edit-name').value = p.name || '';
    document.getElementById('edit-pt').value = p.giftValue || 0;
    document.getElementById('edit-target').value = p.currentTarget || 1;
    document.getElementById('edit-color').value = p.color || '#93c5fd';
}

function hidePanelEditor() {
    document.getElementById('panel-editor').style.display = 'none';
}

function updatePanelProp(prop, value) {
    if (!selectedId) return;
    const p = panels.find(x => x.id === selectedId);
    if (!p) return;
    p[prop] = value;
    renderCanvas();
    savePanelState();
}

function deleteSelectedPanel() {
    if (!selectedId) return;
    if (!confirm('このパネルを削除しますか？')) return;
    panels = panels.filter(p => p.id !== selectedId);
    selectedId = null;
    hidePanelEditor();
    renderCanvas();
    savePanelState();
}

// ---- 画像読み込み ----
function handleImageInput(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        const tempImg = new Image();
        tempImg.onload = () => {
            boardW = tempImg.naturalWidth;
            boardH = tempImg.naturalHeight;

            const img = document.getElementById('hidden-image');
            img.src = ev.target.result;
            img.style.display = 'block';

            document.getElementById('no-image-text').style.display = 'none';
            document.getElementById('panel-svg').setAttribute('viewBox', `0 0 ${boardW} ${boardH}`);
            renderCanvas();
            showNotif('✅ 画像を読み込みました', '#2e7d32', 2000);
        };
        tempImg.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

// ---- PSD読み込み ----
async function handlePSDInput(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('no-image-text').style.display = 'none';
    const notification = showNotif('PSD読み込み中...', '#1976d2', 0);

    try {
        const buffer = await file.arrayBuffer();
        const psd = await PSD.fromArrayBuffer(buffer);
        await psd.parse();

        const psdW = psd.header.width;
        const psdH = psd.header.height;
        boardW = psdW; boardH = psdH;

        const bgCanvas = psd.image.toPng();
        const img = document.getElementById('hidden-image');
        img.src = bgCanvas.toDataURL();
        img.style.display = 'block';

        const tree = psd.tree();
        const newPanels = [];
        for (const layer of tree.children()) {
            if (!layer.isGroup()) {
                const info = layer.export();
                const lc = layer.toPng();
                newPanels.push({
                    id: 'psd-' + info.name.replace(/\s/g, '_') + '-' + Math.random().toString(36).substr(2, 4),
                    name: info.name, giftValue: 0,
                    currentTarget: 1, currentCount: 0,
                    x: info.left, y: info.top,
                    width: info.width, height: info.height,
                    shape: 'rect', color: '#93c5fd',
                    image: lc.toDataURL(), isRevealed: false
                });
            }
        }

        if (newPanels.length > 0) panels = newPanels;
        document.getElementById('panel-svg').setAttribute('viewBox', `0 0 ${psdW} ${psdH}`);
        notification.textContent = `✅ 読み込み完了 (${newPanels.length}パネル)`;
        notification.style.background = '#43a047';
        renderCanvas();
        savePanelState();
    } catch (err) {
        notification.textContent = '❌ エラー: ' + err.message;
        notification.style.background = '#d32f2f';
        console.error(err);
    }
    setTimeout(() => notification.remove(), 3000);
}

// ---- カウンター ----
function updateCounter() {
    const controlList = document.getElementById('control-list');
    controlList.innerHTML = '';

    panels.forEach(p => {
        const isFull = p.currentCount >= p.currentTarget && p.currentTarget > 0;
        const card = document.createElement('div');
        card.className = 'panel-card';

        const imgHtml = p.image
            ? `<img class="card-img" src="${p.image}" alt="${p.name}">`
            : `<div class="card-img-placeholder" style="background:${p.color || '#e3f2fd'}">${(p.name || '?').charAt(0)}</div>`;

        const progressPct = p.currentTarget > 0 ? Math.min(100, (p.currentCount / p.currentTarget) * 100) : 0;
        const progressColor = isFull ? '#43a047' : '#ff9800';

        card.innerHTML = `
            <div class="card-main">
                ${imgHtml}
                <div class="card-info">
                    <div class="card-title">
                        <span class="gift-name">${p.name}</span>
                        <span class="gift-value">${p.giftValue > 0 ? p.giftValue + 'pt' : ''}</span>
                    </div>
                    <div class="card-counter">
                        ギフト数: <span class="count-num ${isFull ? 'full' : ''}">${p.currentCount}</span> / ${p.currentTarget}
                        ${isFull ? '<span class="full-badge">✅ ノルマ達成！</span>' : ''}
                    </div>
                    <div class="card-progress-bar">
                        <div class="progress-fill" style="width:${progressPct}%; background:${progressColor};"></div>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <div class="action-group">
                    <span class="group-label">ノルマ</span>
                    <button onclick="changeTarget('${p.id}', -1)">－</button>
                    <span>${p.currentTarget}</span>
                    <button onclick="changeTarget('${p.id}', 1)">＋</button>
                </div>
                <div class="action-group">
                    <span class="group-label">カウント</span>
                    <button class="btn-minus" onclick="changeCount('${p.id}', -1)">－</button>
                    <span>${p.currentCount}</span>
                    <button class="btn-plus" onclick="changeCount('${p.id}', 1)">＋</button>
                </div>
                <button class="btn-reveal ${p.isRevealed ? 'opened' : ''}" onclick="toggleReveal('${p.id}')">
                    ${p.isRevealed ? '戻す' : '開ける'}
                </button>
            </div>`;
        controlList.appendChild(card);
    });
}

function changeCount(id, delta) {
    const p = panels.find(x => x.id === id);
    if (!p) return;
    p.currentCount = Math.max(0, p.currentCount + delta);
    renderCanvas();
    savePanelState();
}

function changeTarget(id, delta) {
    const p = panels.find(x => x.id === id);
    if (!p) return;
    p.currentTarget = Math.max(1, p.currentTarget + delta);
    renderCanvas();
    savePanelState();
}

function confirmReveal(id) {
    const p = panels.find(x => x.id === id);
    if (!p) return;
    const msg = p.isRevealed ? `「${p.name}」を閉じますか？` : `「${p.name}」を開けますか？`;
    if (confirm(msg)) revealPanel(id);
}

function revealPanel(id) {
    const p = panels.find(x => x.id === id);
    if (!p) return;
    p.isRevealed = !p.isRevealed;
    renderCanvas();
    savePanelState();
}

function toggleReveal(id) { revealPanel(id); }

// ---- ポップアップ ----
function toggleControlPopup() {
    const popup = document.getElementById('control-popup');
    popup.style.display = popup.style.display === 'none' ? 'flex' : 'none';
    if (popup.style.display === 'flex') updateCounter();
}

// ---- サンプル読み込み ----
function loadSamplePanels() {
    boardW = 800; boardH = 500;
    const colors = ['#93c5fd','#86efac','#fcd34d','#f9a8d4','#c4b5fd','#fdba74','#6ee7b7','#a5b4fc','#fda4af','#67e8f9'];
    const shapes = ['rect','roundrect','circle','diamond','hexagon','star','triangle','roundrect','circle','rect'];
    const names = ['スター','ハート','クラウン','ダイヤ','フラワー','ムーン','サン','キャッスル','エンジェル','ドラゴン'];
    panels = [];
    const cols = 5, rows = 2, pw = 140, ph = 180, gapX = 20, gapY = 20;
    const startX = (boardW - cols * pw - (cols - 1) * gapX) / 2;
    const startY = (boardH - rows * ph - (rows - 1) * gapY) / 2;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const i = r * cols + c;
            panels.push({
                id: 'sample-' + i,
                name: names[i], giftValue: (i + 1) * 100,
                currentTarget: 3, currentCount: 0,
                x: startX + c * (pw + gapX), y: startY + r * (ph + gapY),
                width: pw, height: ph,
                shape: shapes[i], color: colors[i],
                image: '', isRevealed: false
            });
        }
    }
    document.getElementById('panel-svg').setAttribute('viewBox', `0 0 ${boardW} ${boardH}`);
    document.getElementById('no-image-text').style.display = 'none';
    renderCanvas();
    savePanelState();
}

// ---- 保存・復元 ----
function savePanelState() {
    try {
        const light = panels.map(p => ({
            id: p.id, name: p.name, giftValue: p.giftValue,
            currentTarget: p.currentTarget, currentCount: p.currentCount,
            x: p.x, y: p.y, width: p.width, height: p.height,
            shape: p.shape, color: p.color,
            image: '',
            isRevealed: p.isRevealed
        }));
        const state = { panels: light, boardW, boardH, savedAt: new Date().toISOString() };
        localStorage.setItem('iriam_panel_v2', JSON.stringify(state));
        document.getElementById('lastSavedTime').textContent = '保存: ' + new Date().toLocaleTimeString();
        flashMessage('💾 保存しました！');
    } catch (err) {
        alert('保存失敗: ' + err.message);
    }
}

function loadPanelState() {
    const stored = localStorage.getItem('iriam_panel_v2');
    if (!stored) return;
    try {
        const state = JSON.parse(stored);
        panels = state.panels || [];
        boardW = state.boardW || 800;
        boardH = state.boardH || 600;

        if (panels.length > 0) {
            document.getElementById('panel-svg').setAttribute('viewBox', `0 0 ${boardW} ${boardH}`);
            document.getElementById('no-image-text').style.display = 'none';
            renderCanvas();

            const hasPsd = panels.some(p => p.id.startsWith('psd-'));
            if (hasPsd) showNotif('💡 PSD由来のパネルがあります。画像を表示するにはPSDを再読み込みしてください。', '#1976d2', 5000);
        }
        if (state.savedAt) {
            document.getElementById('lastSavedTime').textContent = '前回保存: ' + new Date(state.savedAt).toLocaleString();
        }
    } catch (err) {
        console.warn('保存データ読み込み失敗:', err);
    }
}

function resetAll() {
    if (!confirm('すべてのパネルとデータをリセットしますか？')) return;
    panels = [];
    selectedId = null; ix = null;
    boardW = 800; boardH = 600;
    editMode = false;
    document.getElementById('draw-toolbar').style.display = 'none';
    const btn = document.getElementById('btn-edit-toggle');
    btn.textContent = '✏️ 描画モード'; btn.style.background = '';
    hidePanelEditor();
    document.getElementById('hidden-image').src = '';
    document.getElementById('no-image-text').style.display = 'block';
    const svg = document.getElementById('panel-svg');
    svg.removeAttribute('viewBox');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    localStorage.removeItem('iriam_panel_v2');
    document.getElementById('lastSavedTime').textContent = '保存データはありません';
    flashMessage('🔄 リセットしました');
}

// ---- 画像コピー ----
function copyBoardImage() {
    const target = document.getElementById('capture-target');
    html2canvas(target, { useCORS: true, scale: 2 }).then(canvas => {
        canvas.toBlob(blob => {
            if (!blob) { alert('画像生成に失敗しました'); return; }
            if (location.protocol === 'file:') {
                downloadImage(blob);
            } else {
                try {
                    const item = new ClipboardItem({ 'image/png': blob });
                    navigator.clipboard.write([item])
                        .then(() => flashMessage('📋 クリップボードにコピーしました！'))
                        .catch(() => downloadImage(blob));
                } catch { downloadImage(blob); }
            }
        }, 'image/png');
    });
}

function downloadImage(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'panel-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    flashMessage('💾 画像をダウンロードしました');
}

// ---- ユーティリティ ----
function flashMessage(msg) {
    const el = document.getElementById('saveMessage');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 2500);
}

function showNotif(msg, color, duration) {
    const el = document.createElement('div');
    el.style = `position:fixed;bottom:20px;right:20px;background:${color};color:#fff;padding:12px 20px;border-radius:8px;z-index:9999;max-width:340px;font-size:0.9em;box-shadow:0 2px 8px rgba(0,0,0,0.2);`;
    el.textContent = msg;
    document.body.appendChild(el);
    if (duration > 0) setTimeout(() => el.remove(), duration);
    return el;
}
