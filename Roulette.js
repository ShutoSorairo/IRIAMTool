let rouletteCount = 1;
// ルーレットごとの項目をキャッシュとしてlocalStorageに保存
const rouletteItemsMap = loadRouletteCache();

function createRouletteBlock(id) {
    const block = document.createElement('div');
    block.className = 'roulette-block';
    block.dataset.id = id;

    // キャッシュから項目を取得
    const items = rouletteItemsMap[id] || [''];

    block.innerHTML = `
        <div class="roulette-title">ルーレット${id}</div>
        <div class="item-list" id="item-list-${id}"></div>
        <button class="add-item-btn">＋項目追加</button>
        <button class="spin-btn">回す</button>
        <button class="remove-roulette-btn">削除</button>
        <div class="roulette-string-list" id="roulette-string-list-${id}"></div>
        <div class="result-text" id="result-${id}"></div>
    `;

    // 項目をセット
    const itemList = block.querySelector('.item-list');
    items.forEach(val => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'item-input';
        input.placeholder = '項目を入力';
        input.value = val;
        itemList.appendChild(input);
    });

    // 項目追加
    block.querySelector('.add-item-btn').onclick = () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'item-input';
        input.placeholder = '項目を入力';
        itemList.appendChild(input);
        updateRouletteItems(block);
        drawRouletteString(block);
    };

    // ルーレット削除
    block.querySelector('.remove-roulette-btn').onclick = () => {
        delete rouletteItemsMap[id];
        saveRouletteCache();
        block.remove();
    };

    // 入力変更時にルーレット再描画＆項目保存
    block.querySelector('.item-list').addEventListener('input', () => {
        updateRouletteItems(block);
        drawRouletteString(block);
    });

    // 回す
    block.querySelector('.spin-btn').onclick = () => {
        updateRouletteItems(block);
        const items = rouletteItemsMap[id].filter(v => v);
        const resultDiv = block.querySelector('.result-text');
        if (items.length === 0) {
            resultDiv.textContent = '項目を入力してください';
            return;
        }
        spinStringRoulette(block, items);
    };

    // 初回描画
    drawRouletteString(block);

    return block;
}

// 項目を保存
function updateRouletteItems(block) {
    const id = block.dataset.id;
    const inputs = block.querySelectorAll('.item-input');
    rouletteItemsMap[id] = Array.from(inputs).map(i => i.value.trim());
    saveRouletteCache();
}

// キャッシュ保存
function saveRouletteCache() {
    try {
        localStorage.setItem('rouletteItemsMap', JSON.stringify(rouletteItemsMap));
    } catch (e) {}
}

// キャッシュ読込
function loadRouletteCache() {
    try {
        const data = localStorage.getItem('rouletteItemsMap');
        if (data) return JSON.parse(data);
    } catch (e) {}
    return {};
}

// 文字列ルーレットの描画
function drawRouletteString(block, highlightIdx = -1) {
    const id = block.dataset.id;
    const items = (rouletteItemsMap[id] || []).filter(v => v);
    const listDiv = block.querySelector('.roulette-string-list');
    listDiv.innerHTML = '';
    if (items.length === 0) return;
    items.forEach((item, idx) => {
        const span = document.createElement('span');
        span.textContent = item;
        span.style.display = 'inline-block';
        span.style.margin = '0 10px';
        span.style.padding = '4px 10px';
        span.style.borderRadius = '6px';
        span.style.background = (idx === highlightIdx) ? '#4f8cff' : '#f0f7fa';
        span.style.color = (idx === highlightIdx) ? '#fff' : '#2563eb';
        span.style.fontWeight = (idx === highlightIdx) ? 'bold' : '';
        listDiv.appendChild(span);
    });
}

// スロット風に1つずつ中央に大きく表示して回転（改良版：完全ランダム）
function spinStringRoulette(block, items) {
    const resultDiv = block.querySelector('.result-text');
    const listDiv = block.querySelector('.roulette-string-list');
    let idx = 0;
    let count = 0;
    let max = Math.floor(Math.random() * 20) + 30; // 30～49回

    // 🎯 最終結果を完全ランダムに決定
    const resultIdx = Math.floor(Math.random() * items.length);

    function renderSlot(currentIdx) {
        listDiv.innerHTML = '';
        const span = document.createElement('span');
        span.textContent = items[currentIdx];
        span.style.display = 'inline-block';
        span.style.margin = '0 10px';
        span.style.padding = '12px 32px';
        span.style.borderRadius = '12px';
        span.style.background = '#4f8cff';
        span.style.color = '#fff';
        span.style.fontWeight = 'bold';
        span.style.fontSize = '2em';
        listDiv.appendChild(span);
    }

    function animate() {
        renderSlot(idx % items.length);
        idx++;
        count++;
        if (count < max) {
            setTimeout(animate, 60 + count * 3); // 徐々に遅く
        } else {
            // 🎯 最終的に完全ランダムで決めた項目を表示
            renderSlot(resultIdx);
            resultDiv.textContent = `結果: ${items[resultIdx]}`;
            if ('speechSynthesis' in window) {
                const uttr = new SpeechSynthesisUtterance(items[resultIdx]);
                uttr.lang = 'ja-JP';
                window.speechSynthesis.speak(uttr);
            }
        }
    }
    animate();
}

function addRoulette() {
    const list = document.getElementById('roulette-list');
    rouletteCount++;
    list.appendChild(createRouletteBlock(rouletteCount));
    saveRouletteCache();
}

// 初期化
window.onload = () => {
    const list = document.getElementById('roulette-list');
    // キャッシュがあれば復元、なければ1つ作成
    const ids = Object.keys(rouletteItemsMap);
    if (ids.length > 0) {
        ids.forEach(id => {
            list.appendChild(createRouletteBlock(id));
            rouletteCount = Math.max(rouletteCount, Number(id));
        });
    } else {
        list.appendChild(createRouletteBlock(1));
    }
    document.getElementById('add-roulette-btn').onclick = addRoulette;
};
