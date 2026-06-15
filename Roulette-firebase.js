import { dbLoad, dbSave } from './db.js';

const PATH = 'roulette/default';

const _origSave = window.saveRouletteCache;
window.saveRouletteCache = async function() {
    _origSave?.();
    await dbSave(PATH, { itemsMap: window.rouletteItemsMap || {} });
};

window.addEventListener('load', async () => {
    const data = await dbLoad(PATH);
    if (!data?.itemsMap) return;

    // rouletteItemsMapはconstなのでプロパティを更新してDOM再描画
    const map = window.rouletteItemsMap;
    Object.keys(map).forEach(k => delete map[k]);
    Object.assign(map, data.itemsMap);

    // DOM再構築
    const list = document.getElementById('roulette-list');
    if (!list) return;
    list.innerHTML = '';
    window.rouletteCount = 1;
    const ids = Object.keys(map);
    if (ids.length > 0) {
        ids.forEach(id => {
            list.appendChild(window.createRouletteBlock(id));
            window.rouletteCount = Math.max(window.rouletteCount, Number(id));
        });
    } else {
        list.appendChild(window.createRouletteBlock(1));
    }
});
