// --- データ管理 ---
let panels = []; 
let editPoints = []; 
let isEditMode = false;
let currentMousePos = null; 

// ギフトデータ管理用
let allGifts = [];
let giftsByCategory = {};
let categoriesList = [];

const colorPalette = [
    "#ffcdd2", "#bbdefb", "#c8e6c9", "#fff9c4", "#e1bee7", 
    "#b2ebf2", "#ffccbc", "#d7ccc8", "#f0f4c3", "#d1c4e9"
];

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // 画像アップロード
    document.getElementById('imageInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                const result = evt.target.result;
                setImage(result);
                try { localStorage.setItem('iriam_free_panel_bg', result); } catch(e) {}
            };
            reader.readAsDataURL(file);
        }
    });

    const svg = document.getElementById('panel-svg');
    svg.addEventListener('click', onSvgClick);
    svg.addEventListener('mousemove', onSvgMouseMove);
    
    // データ読み込み
    fetchGiftData();
    loadAllData();
});

function setImage(src) {
    const img = document.getElementById('hidden-image');
    const noImgText = document.getElementById('no-image-text');
    img.src = src;
    img.style.display = 'block';
    noImgText.style.display = 'none';
    img.onload = () => adjustBoardSize(img);
}

// ギフトデータ取得
async function fetchGiftData() {
    try {
        const res = await fetch('gifts.json');
        if (res.ok) {
            allGifts = await res.json();
            
            // 手動入力用のdatalist更新
            const dataList = document.getElementById('gift-options') || document.createElement('datalist');
            dataList.id = 'gift-options';
            dataList.innerHTML = '';
            allGifts.forEach(g => {
                const option = document.createElement('option');
                option.value = g.name;
                dataList.appendChild(option);
            });
            if(!document.getElementById('gift-options')) document.body.appendChild(dataList);
            
            // カテゴリ別整理 (AllGift仕様)
            organizeGiftsByCategory();
            renderControls();
        }
    } catch (e) { console.error("ギフトデータ読み込み失敗", e); }
}

// ★改良: AllGift.jsと同等のカテゴリ分けロジック
function organizeGiftsByCategory() {
    giftsByCategory = {};
    
    // ポイント取得ヘルパー
    const getPt = (src) => {
        const match = src.match(/_(\d+(?:,\d+)*)pt/i);
        return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
    };

    // 1. 通常カテゴリの分類
    const catSet = new Set();
    allGifts.forEach(g => {
        let cats = [];
        if (Array.isArray(g.categories)) cats = g.categories;
        else if (g.category) cats = [g.category];
        
        cats.forEach(c => {
            catSet.add(c);
            if (!giftsByCategory[c]) giftsByCategory[c] = [];
            giftsByCategory[c].push(g);
        });
    });

    // 2. 特殊カテゴリの生成
    // [全ギフト]
    giftsByCategory['全ギフト'] = [...allGifts];
    
    // [プチギフ] (100pt未満)
    giftsByCategory['プチギフ'] = allGifts.filter(g => getPt(g.src) < 100);
    
    // [ポイント別] (100pt以上)
    giftsByCategory['ポイント別'] = allGifts.filter(g => getPt(g.src) >= 100);

    // 各カテゴリ内でポイント順にソート
    for (const key in giftsByCategory) {
        giftsByCategory[key].sort((a, b) => getPt(a.src) - getPt(b.src));
    }

    // 3. 表示順の定義 (AllGift.jsに準拠 + 全ギフト)
    const preferredOrder = ["全ギフト", "ネタ", "笑", "定番", "専用", "えらい", "挨拶", "ステージ", "LOVE", "プチギフ", "ポイント別"];
    
    // 定義順にリストを作成 (存在するカテゴリのみ)
    categoriesList = preferredOrder.filter(c => giftsByCategory[c] && giftsByCategory[c].length > 0);
    
    // 定義外のカテゴリがあれば末尾に追加
    Array.from(catSet).forEach(c => {
        if (!categoriesList.includes(c)) categoriesList.push(c);
    });
}

function setMode(mode) {
    isEditMode = (mode === 'edit');
    document.getElementById('btn-play').className = isEditMode ? 'mode-btn' : 'mode-btn active';
    document.getElementById('btn-edit').className = isEditMode ? 'mode-btn active' : 'mode-btn';
    document.getElementById('instruction').style.display = isEditMode ? 'block' : 'none';
    hideConfirmPopup();
    
    if (!isEditMode) {
        editPoints = [];
        currentMousePos = null;
        renderSvg();
    }
    renderControls();
}

function adjustBoardSize(img) {
    const wrapper = document.getElementById('capture-target');
    wrapper.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
    const svg = document.getElementById('panel-svg');
    svg.setAttribute('viewBox', `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
}

// --- 編集ロジック ---
function getSvgCoordinates(e, svg) {
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    const vbW = viewBox.width || 800; 
    const vbH = viewBox.height || 600;
    let x = (e.clientX - rect.left) * (vbW / rect.width);
    let y = (e.clientY - rect.top) * (vbH / rect.height);
    
    const snapThreshold = vbW * 0.02;
    let closestDist = snapThreshold;
    let snappedX = null, snappedY = null;

    panels.forEach(p => {
        p.points.forEach(pt => {
            const dist = Math.sqrt(Math.pow(x - pt.x, 2) + Math.pow(y - pt.y, 2));
            if (dist < closestDist) { closestDist = dist; snappedX = pt.x; snappedY = pt.y; }
        });
    });

    if (editPoints.length > 2) {
        const start = editPoints[0];
        const dist = Math.sqrt(Math.pow(x - start.x, 2) + Math.pow(y - start.y, 2));
        if (dist < (snapThreshold * 1.5) && dist < closestDist) {
            closestDist = dist; snappedX = start.x; snappedY = start.y;
        }
    }

    if (snappedX !== null) { x = snappedX; y = snappedY; }
    else {
        const borderSnap = 10;
        if (x < borderSnap) x = 0;
        if (x > vbW - borderSnap) x = vbW;
        if (y < borderSnap) y = 0;
        if (y > vbH - borderSnap) y = vbH;
    }
    return { x, y };
}

function onSvgClick(e) {
    if (!isEditMode) return;
    if (document.getElementById('shape-confirm-popup') && document.getElementById('shape-confirm-popup').style.display === 'block') return;
    const svg = document.getElementById('panel-svg');
    const pos = getSvgCoordinates(e, svg);
    if (editPoints.length > 2 && pos.x === editPoints[0].x && pos.y === editPoints[0].y) {
        showConfirmPopup(e.clientX, e.clientY);
        return;
    }
    editPoints.push(pos);
    renderSvg();
}

function onSvgMouseMove(e) {
    if (!isEditMode) return;
    const svg = document.getElementById('panel-svg');
    currentMousePos = getSvgCoordinates(e, svg);
    renderSvg();
}

function showConfirmPopup(x, y) {
    const popup = document.getElementById('shape-confirm-popup');
    popup.style.left = (x + 15) + 'px';
    popup.style.top = (y + 15) + 'px';
    popup.style.display = 'block';
}
function hideConfirmPopup() { document.getElementById('shape-confirm-popup').style.display = 'none'; }
function confirmFinish() { hideConfirmPopup(); finishShape(); }
function cancelFinish() { hideConfirmPopup(); }
function forceFinishShape() { if(editPoints.length<3){alert("3点以上必要です");return;} finishShape(); }

function finishShape() {
    const color = colorPalette[panels.length % colorPalette.length];
    panels.push({
        id: Date.now(),
        type: 'polygon', 
        points: [...editPoints],
        color: color,
        label: `パネル${panels.length + 1}`,
        target: 10,
        current: 0,
        isOpened: false,
        missionType: 'gift',
        selectedCategory: '全ギフト' // 初期カテゴリ
    });
    editPoints = [];
    currentMousePos = null;
    saveData();
    renderSvg();
    renderControls();
}

function deletePanel(index) {
    if(confirm(`パネル「${panels[index].label}」を削除しますか？`)) {
        panels.splice(index, 1);
        saveData();
        renderSvg();
        renderControls();
    }
}

// 描画処理
function renderSvg() {
    const svg = document.getElementById('panel-svg');
    svg.innerHTML = '';
    panels.forEach((p) => {
        const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const pointsStr = p.points.map(pt => `${pt.x},${pt.y}`).join(" ");
        poly.setAttribute("points", pointsStr);
        poly.setAttribute("fill", p.color);
        if (p.isOpened) poly.classList.add("cleared");
        svg.appendChild(poly);
        
        const center = getCenter(p.points);
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", center.x);
        text.setAttribute("y", center.y);
        
        if(p.missionType === 'comment' || p.missionType === 'star') {
            text.textContent = `${getMissionTypeName(p.missionType)}`;
        } else {
            text.textContent = p.label.split('\n')[0]; 
        }
        
        if (p.isOpened) text.classList.add("cleared");
        svg.appendChild(text);
    });

    if (isEditMode && editPoints.length > 0) {
        const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        const ptsStr = editPoints.map(pt => `${pt.x},${pt.y}`).join(" ");
        polyline.setAttribute("points", ptsStr);
        polyline.setAttribute("fill", "none");
        polyline.setAttribute("stroke", "#e91e63");
        polyline.setAttribute("stroke-width", "3");
        svg.appendChild(polyline);
        
        editPoints.forEach((pt) => {
            const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("cx", pt.x); c.setAttribute("cy", pt.y); c.setAttribute("r", 4);
            c.setAttribute("fill", "white"); c.setAttribute("stroke", "#e91e63");
            svg.appendChild(c);
        });

        if (currentMousePos) {
            const lastPt = editPoints[editPoints.length - 1];
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", lastPt.x); line.setAttribute("y1", lastPt.y);
            line.setAttribute("x2", currentMousePos.x); line.setAttribute("y2", currentMousePos.y);
            line.setAttribute("stroke", "#e91e63"); line.setAttribute("stroke-width", "2");
            line.setAttribute("stroke-dasharray", "5,5"); line.setAttribute("opacity", "0.6");
            svg.appendChild(line);
        }
    }
}

function getCenter(points) {
    let x = 0, y = 0;
    points.forEach(p => { x += p.x; y += p.y; });
    return { x: x / points.length, y: y / points.length };
}

// ロジック
function getMissionTypeName(type) {
    const map = { gift:'ギフト', comment:'コメント', star:'スター', other:'その他' };
    return map[type] || 'その他';
}

function getCategoryOptionsHTML(currentCat) {
    if(categoriesList.length === 0) return '<option>読込中...</option>';
    return categoriesList.map(cat => 
        `<option value="${cat}" ${cat === currentCat ? 'selected' : ''}>${cat}</option>`
    ).join('');
}

function getGiftGridHTML(index, category, currentLabel) {
    const gifts = giftsByCategory[category] || [];
    if (gifts.length === 0) return '<div style="padding:10px;color:#999;font-size:0.9em;">ギフトなし</div>';
    
    let html = '<div class="gift-grid-selector">';
    gifts.forEach(g => {
        const isSelected = (g.name === currentLabel);
        html += `
            <div class="gift-option ${isSelected ? 'selected' : ''}" 
                 onclick="selectGift(${index}, '${g.name}')" title="${g.name}">
                <img src="${g.src}" loading="lazy">
                <span class="gift-name">${g.name}</span>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function selectGift(index, giftName) {
    panels[index].label = giftName;
    saveData();
    renderSvg();
    renderControls();
}

function getNextValue(current, direction, type) {
    if (type !== 'comment' && type !== 'star') {
        return Math.max(0, current + direction);
    }
    let step = 1000;
    if (current >= 200000) step = 10000;
    else if (current >= 10000) step = 5000;

    let nextVal;
    if (direction > 0) {
        nextVal = Math.floor(current / step) * step + step;
        if (current < 10000 && nextVal > 10000) nextVal = 10000;
        else if (current < 200000 && nextVal > 200000) nextVal = 200000;
        return Math.min(10000000, nextVal);
    } else {
        if (current <= 10000) step = 1000;
        else if (current <= 200000) step = 5000;
        else step = 10000;
        nextVal = Math.ceil(current / step) * step - step;
        if (current > 200000 && nextVal < 200000) nextVal = 200000;
        else if (current > 10000 && nextVal < 10000) nextVal = 10000;
        return Math.max(0, nextVal);
    }
}

function getTargetOptionsHTML(currentVal) {
    let options = [];
    for(let i=1000; i<=10000; i+=1000) options.push(i);
    for(let i=20000; i<=100000; i+=10000) options.push(i);
    for(let i=200000; i<=1000000; i+=100000) options.push(i);
    for(let i=2000000; i<=10000000; i+=1000000) options.push(i);
    return options.map(val => `<option value="${val}" ${val === currentVal ? 'selected' : ''}>${val.toLocaleString()}</option>`).join('');
}

// --- コントロール描画 ---
function renderControls() {
    const list = document.getElementById('control-list');
    list.innerHTML = '';

    panels.forEach((p, index) => {
        const item = document.createElement('div');
        let statusClass = '';
        if (p.isOpened) statusClass = 'done';
        else if (p.current >= p.target) statusClass = 'active';
        item.className = `ctrl-item ${statusClass}`;
        item.style.borderLeftColor = p.isOpened ? '#4caf50' : p.color;

        let btnText = "未達成", btnClass = "";
        if (p.isOpened) { btnText = "OPEN済"; btnClass = "opened"; }
        else if (p.current >= p.target) { btnText = "OPEN!"; btnClass = "ready"; }

        let contentHTML = `
            <div class="ctrl-header">
                <span style="display:flex; align-items:center; gap:5px;">
                    <span style="width:12px; height:12px; background:${p.color}; border:1px solid #999;"></span>
                    パネル ${index + 1}
                </span>
                <div style="display:flex; gap:5px;">
                    <button class="open-toggle-btn ${btnClass}" onclick="toggleOpen(${index})">${btnText}</button>
                    ${isEditMode ? `<button class="btn-trash" onclick="deletePanel(${index})">🗑️</button>` : ''}
                </div>
            </div>
        `;

        if (isEditMode) {
            const typeOptions = `
                <option value="gift" ${p.missionType==='gift'?'selected':''}>ギフト</option>
                <option value="comment" ${p.missionType==='comment'?'selected':''}>コメント</option>
                <option value="star" ${p.missionType==='star'?'selected':''}>スター</option>
                <option value="other" ${p.missionType==='other'?'selected':''}>その他</option>
            `;
            
            let inputArea = '';
            if (p.missionType === 'gift') {
                inputArea = `
                    <div class="gift-settings-container">
                        <div style="display:flex; gap:5px; margin-bottom:5px;">
                            <select class="cat-select" onchange="updateData(${index}, 'selectedCategory', this.value)">
                                ${getCategoryOptionsHTML(p.selectedCategory)}
                            </select>
                            <div class="target-setting">
                                <span>目標:</span>
                                <input type="number" class="target-input" value="${p.target}" onchange="updateData(${index}, 'target', this.value)">
                            </div>
                        </div>
                        ${getGiftGridHTML(index, p.selectedCategory, p.label)}
                        <div style="font-size:0.85em; color:#1976d2; margin-top:2px;">選択中: <b>${p.label}</b></div>
                    </div>
                `;
            } else if (p.missionType === 'comment' || p.missionType === 'star') {
                inputArea = `
                    <div style="flex:1; font-weight:bold; color:#555; padding:6px;">${getMissionTypeName(p.missionType)}</div>
                    <select class="target-select" onchange="updateData(${index}, 'target', this.value)">
                        ${getTargetOptionsHTML(p.target)}
                    </select>
                `;
            } else {
                inputArea = `
                    <input type="text" class="label-input" value="${p.label}" placeholder="内容" list="gift-options"
                        onchange="updateData(${index}, 'label', this.value)">
                    <div class="target-setting">
                        <span style="font-size:0.8em;">目標:</span>
                        <input type="number" class="target-input" value="${p.target}" onchange="updateData(${index}, 'target', this.value)">
                    </div>
                `;
            }

            contentHTML += `
                <div class="ctrl-edit-column">
                    <div style="margin-bottom:5px;">
                        <span style="font-size:0.8em; color:#666;">種類:</span>
                        <select class="type-select" onchange="updateData(${index}, 'missionType', this.value)">${typeOptions}</select>
                    </div>
                    ${inputArea}
                </div>
            `;
        } else {
            let labelText = p.label;
            if(p.missionType === 'comment' || p.missionType === 'star') labelText = getMissionTypeName(p.missionType);

            contentHTML += `
                <div class="ctrl-play-info">
                    <div class="mission-title">${labelText}</div>
                    <div class="mission-progress"><span class="curr">${p.current.toLocaleString()}</span> / <span class="tgt">${p.target.toLocaleString()}</span></div>
                </div>
                <div class="ctrl-actions">
                    <button class="count-btn btn-minus" onclick="adjustCount(${index}, -1)">-</button>
                    <div style="flex:1; margin:0 10px; height:6px; background:#eee; border-radius:3px; overflow:hidden;">
                        <div style="width:${Math.min(100, (p.current/p.target)*100)}%; height:100%; background:${p.current>=p.target?'#e91e63':'#4caf50'}; transition:width 0.3s;"></div>
                    </div>
                    <button class="count-btn btn-plus" onclick="adjustCount(${index}, 1)">+</button>
                </div>
            `;
        }

        item.innerHTML = contentHTML;
        list.appendChild(item);
    });
}

function updateData(index, key, value) {
    if (key === 'target') value = parseInt(value);
    panels[index][key] = value;
    if (key === 'missionType') {
        if (value === 'comment' || value === 'star') {
            panels[index].target = 10000;
            panels[index].label = getMissionTypeName(value);
        } else {
            panels[index].target = 10;
            if(value==='gift') panels[index].selectedCategory = '全ギフト';
            panels[index].label = '';
        }
        panels[index].current = 0;
    }
    saveData();
    renderSvg();
    renderControls();
}

function adjustTarget(index, direction) {
    const p = panels[index];
    p.target = getNextValue(p.target, direction, p.missionType);
    saveData();
    renderControls();
}

function adjustCount(index, direction) {
    const p = panels[index];
    p.current = getNextValue(p.current, direction, p.missionType);
    saveData();
    renderControls();
}

function toggleOpen(index) {
    panels[index].isOpened = !panels[index].isOpened;
    saveData();
    renderSvg();
    renderControls();
}

function saveData() { localStorage.setItem('iriam_free_panel', JSON.stringify(panels)); }

function loadAllData() {
    const bgData = localStorage.getItem('iriam_free_panel_bg');
    if (bgData) {
        setImage(bgData);
    }
    const data = localStorage.getItem('iriam_free_panel');
    if (data) { panels = JSON.parse(data); renderSvg(); renderControls(); }
}

function copyBoardImage() {
    const target = document.getElementById('capture-target');
    if (window.getComputedStyle(document.getElementById('hidden-image')).display === 'none') { alert("画像が設定されていません"); return; }
    html2canvas(target, { useCORS: true, scale: 2 }).then(canvas => {
        canvas.toBlob(blob => {
            try {
                const item = new ClipboardItem({ "image/png": blob });
                navigator.clipboard.write([item]).then(() => alert("画像をコピーしました！"));
            } catch(e) { alert("コピー失敗"); }
        });
    });
}
