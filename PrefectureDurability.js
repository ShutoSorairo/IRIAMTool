const REGIONS = [
    { name: '北海道地方', prefs: ['北海道'] },
    { name: '東北地方', prefs: ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'] },
    { name: '関東地方', prefs: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'] },
    { name: '中部地方', prefs: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'] },
    { name: '近畿地方', prefs: ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'] },
    { name: '中国地方', prefs: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'] },
    { name: '四国地方', prefs: ['徳島県', '香川県', '愛媛県', '高知県'] },
    { name: '九州・沖縄地方', prefs: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'] },
];

const TOTAL_PREF_COUNT = REGIONS.reduce((sum, region) => sum + region.prefs.length, 0);
const STORAGE_KEY = 'pd_checked';
const MAP_FILL_CHECKED = '#1976d2';
const MAP_FILL_UNCHECKED = '#ffffff';
const MAP_STROKE = '#5b6472';
const MAP_STROKE_WIDTH = '0.6';
const OKINAWA_ID = 47;

function loadLocal() {
    try {
        return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
    } catch (e) {
        return new Set();
    }
}

const checked = loadLocal();
window.prefectureDurabilityChecked = checked;

window.saveDurabilityCache = function() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]));
};

let mapProjected = null;
let okinawaProjected = null;

function updateProgress() {
    document.getElementById('pdProgress').textContent = `${checked.size} / ${TOTAL_PREF_COUNT}`;
}

// Re-applies the checked set to every rendering of the state (chip grid + map).
// Centralized so a toggle from either the chip grid or the map keeps both in sync.
function syncCheckedUI() {
    document.querySelectorAll('.pd-btn').forEach(btn => {
        btn.classList.toggle('pd-checked', checked.has(btn.dataset.pref));
    });
    document.querySelectorAll('#pdMap path[data-pref], #pdOkinawaMap path[data-pref]').forEach(path => {
        path.setAttribute('fill', checked.has(path.dataset.pref) ? MAP_FILL_CHECKED : MAP_FILL_UNCHECKED);
    });
    updateProgress();
}

function togglePref(pref) {
    if (checked.has(pref)) {
        checked.delete(pref);
    } else {
        checked.add(pref);
    }
    syncCheckedUI();
    window.saveDurabilityCache();
}

function resetAll() {
    checked.clear();
    syncCheckedUI();
    window.saveDurabilityCache();
}
window.resetPrefectureDurability = resetAll;
window.renderPrefectureDurability = syncCheckedUI;

function renderChipGrid() {
    const listEl = document.getElementById('pdList');
    listEl.innerHTML = '';

    REGIONS.forEach(region => {
        const section = document.createElement('div');
        section.className = 'pd-region';

        const heading = document.createElement('h2');
        heading.className = 'pd-region-title';
        heading.textContent = region.name;
        section.appendChild(heading);

        const grid = document.createElement('div');
        grid.className = 'pd-grid';

        region.prefs.forEach(pref => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pd-btn';
            btn.dataset.pref = pref;
            btn.textContent = pref;
            btn.addEventListener('click', () => togglePref(pref));
            grid.appendChild(btn);
        });

        section.appendChild(grid);
        listEl.appendChild(section);
    });
}

// Projects a set of features' lon/lat rings onto a flat SVG plane (simple
// equirectangular + cos(lat) correction), fit to TARGET_WIDTH.
function projectFeatures(features, targetWidth) {
    const allPts = features.flatMap(feat => feat.rings.flat());
    const lons = allPts.map(p => p[0]);
    const lats = allPts.map(p => p[1]);
    const lonMin = Math.min(...lons), lonMax = Math.max(...lons);
    const latMin = Math.min(...lats), latMax = Math.max(...lats);
    const cosLat = Math.cos((latMin + latMax) / 2 * Math.PI / 180);

    const scale = targetWidth / ((lonMax - lonMin) * cosLat);
    const width = targetWidth;
    const height = (latMax - latMin) * scale;

    function project([lon, lat]) {
        const x = (lon - lonMin) * cosLat * scale;
        const y = (latMax - lat) * scale;
        return [x, y];
    }

    const prefs = features.map(feat => {
        const d = feat.rings.map(ring => {
            const pts = ring.map(project);
            return 'M ' + pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ') + ' Z';
        }).join(' ');
        return { id: feat.id, name: feat.nam_ja, d };
    });

    return { width, height, prefs };
}

// Loads the map data from PrefectureDurability-map.js (loaded as a plain
// <script>, not fetch()'d, so this also works when the page is opened
// directly via file:// where fetch() of local files is blocked by CORS).
// Okinawa is projected separately from the rest of the country: at true
// geographic position it sits ~500km south of Kyushu, which would leave a
// large empty gap in the main map and make Okinawa itself tiny. Instead it
// gets its own small inset map, shown top-left like a weather forecast map.
function loadMapData() {
    const data = window.PREFECTURE_MAP_DATA;
    if (!data) throw new Error('PrefectureDurability-map.js が読み込まれていません');

    const mainFeatures = data.filter(feat => feat.id !== OKINAWA_ID);
    const okinawaFeature = data.find(feat => feat.id === OKINAWA_ID);

    mapProjected = projectFeatures(mainFeatures, 500);
    if (okinawaFeature) {
        okinawaProjected = projectFeatures([okinawaFeature], 90);
    }
}

function buildMapPath(pref) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pref.d);
    path.setAttribute('class', 'pd-map-pref');
    path.setAttribute('fill', checked.has(pref.name) ? MAP_FILL_CHECKED : MAP_FILL_UNCHECKED);
    path.setAttribute('stroke', MAP_STROKE);
    path.setAttribute('stroke-width', MAP_STROKE_WIDTH);
    path.dataset.pref = pref.name;

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = pref.name;
    path.appendChild(title);

    path.addEventListener('click', () => togglePref(pref.name));
    return path;
}

function renderMap() {
    if (!mapProjected) return;
    const svg = document.getElementById('pdMap');
    svg.setAttribute('viewBox', `0 0 ${mapProjected.width.toFixed(0)} ${mapProjected.height.toFixed(0)}`);
    svg.innerHTML = '';
    mapProjected.prefs.forEach(pref => svg.appendChild(buildMapPath(pref)));

    if (okinawaProjected) {
        const okinawaSvg = document.getElementById('pdOkinawaMap');
        okinawaSvg.setAttribute('viewBox', `0 0 ${okinawaProjected.width.toFixed(0)} ${okinawaProjected.height.toFixed(0)}`);
        okinawaSvg.innerHTML = '';
        okinawaProjected.prefs.forEach(pref => okinawaSvg.appendChild(buildMapPath(pref)));
    }
}

// Rasterizes an <svg> element into an Image via a Blob URL. The SVG element
// is serialized standalone (no access to the page's external stylesheet),
// so every path must already carry its fill/stroke as inline attributes
// (see buildMapPath) -- otherwise prefecture borders vanish in the export.
async function svgToImage(svg) {
    const svgString = new XMLSerializer().serializeToString(svg);
    const svgUrl = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    try {
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = svgUrl;
        });
    } finally {
        URL.revokeObjectURL(svgUrl);
    }
    return img;
}

// Renders the current map + progress into an offscreen canvas sized for
// sharing (2x scale for crispness when pasted into a tweet). Mirrors the
// on-page layout, including the Okinawa inset box top-left of the map.
async function buildShareCanvas() {
    const mapImg = await svgToImage(document.getElementById('pdMap'));
    const okinawaImg = okinawaProjected ? await svgToImage(document.getElementById('pdOkinawaMap')) : null;

    const scale = 2;
    const mapW = mapProjected.width * scale;
    const mapH = mapProjected.height * scale;
    const padX = 40 * scale;
    const headerH = 100 * scale;
    const footerH = 20 * scale;

    const canvas = document.createElement('canvas');
    canvas.width = mapW + padX * 2;
    canvas.height = headerH + mapH + footerH;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#333333';
    ctx.font = `bold ${26 * scale}px 'Segoe UI', sans-serif`;
    ctx.fillText('47都道府県耐久', canvas.width / 2, 40 * scale);

    ctx.fillStyle = '#1976d2';
    ctx.font = `bold ${34 * scale}px 'Segoe UI', sans-serif`;
    ctx.fillText(`${checked.size} / ${TOTAL_PREF_COUNT}`, canvas.width / 2, 86 * scale);

    ctx.drawImage(mapImg, padX, headerH, mapW, mapH);

    if (okinawaImg) {
        const insetPad = 6 * scale;
        const insetW = 84 * scale;
        const insetH = insetW * (okinawaProjected.height / okinawaProjected.width) + 16 * scale;
        const insetX = padX + insetPad;
        const insetY = headerH + insetPad;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = MAP_STROKE;
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.roundRect(insetX, insetY, insetW, insetH, 6 * scale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#555555';
        ctx.font = `${11 * scale}px 'Segoe UI', sans-serif`;
        ctx.fillText('沖縄', insetX + insetW / 2, insetY + 14 * scale);

        const okinawaMapW = insetW - 10 * scale;
        const okinawaMapH = okinawaMapW * (okinawaProjected.height / okinawaProjected.width);
        ctx.drawImage(okinawaImg, insetX + 5 * scale, insetY + 18 * scale, okinawaMapW, okinawaMapH);
    }

    return canvas;
}

function showCopyMsg(text, isError) {
    const el = document.getElementById('pdCopyMsg');
    el.textContent = text;
    el.classList.toggle('pd-copy-msg-error', !!isError);
    clearTimeout(showCopyMsg._timer);
    showCopyMsg._timer = setTimeout(() => { el.textContent = ''; }, 3500);
}

async function copyProgressImage() {
    if (!mapProjected) {
        showCopyMsg('地図を読み込み中です。少し待ってから再度お試しください', true);
        return;
    }
    try {
        const canvas = await buildShareCanvas();
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('blob生成に失敗しました');
        if (!navigator.clipboard || !window.ClipboardItem) throw new Error('Clipboard API未対応');

        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showCopyMsg('コピーしました！Xの投稿画面に貼り付けてください');
    } catch (e) {
        console.warn('画像コピーに失敗、ダウンロードにフォールバックします:', e);
        try {
            const canvas = await buildShareCanvas();
            const link = document.createElement('a');
            link.download = `prefecture-durability-${checked.size}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showCopyMsg('コピーに未対応のブラウザのため画像をダウンロードしました');
        } catch (e2) {
            console.warn('画像生成に失敗:', e2);
            showCopyMsg('画像の生成に失敗しました', true);
        }
    }
}

document.getElementById('pdResetBtn').addEventListener('click', resetAll);
document.getElementById('pdCopyBtn').addEventListener('click', copyProgressImage);

renderChipGrid();
syncCheckedUI();
try {
    loadMapData();
    renderMap();
} catch (e) {
    console.warn('地図データの読み込みに失敗:', e);
}
