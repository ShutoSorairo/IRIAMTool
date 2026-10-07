import { dbLoad, dbSave } from './db.js';

const PATH = 'roulette/default';
const SAVE_DELAY = 800;

let saveTimer = null;

async function flush() {
    clearTimeout(saveTimer);
    saveTimer = null;
    const map = window.getRouletteItemsMap?.();
    if (map) await dbSave(PATH, { itemsMap: map });
}

// saveRouletteCache は入力のたびに呼ばれるので、少し待ってまとめて送る
const _origSave = window.saveRouletteCache;
window.saveRouletteCache = function() {
    _origSave?.();
    if (!localStorage.getItem('iriam_uid')) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, SAVE_DELAY);
};

window.addEventListener('pagehide', () => { if (saveTimer) flush(); });

window.addEventListener('load', async () => {
    if (!localStorage.getItem('iriam_uid')) return;
    const map = window.getRouletteItemsMap?.();
    if (!map) return;

    const data = await dbLoad(PATH);
    const cloud = data?.itemsMap;

    // 以前の不具合でクラウドには空データが入っていることがある
    // → 空なら上書きせず、この端末の項目をクラウドへ上げる
    if (!cloud || Object.keys(cloud).length === 0) {
        if (Object.keys(map).length > 0) await flush();
        return;
    }

    // rouletteItemsMap は const なので中身を入れ替えてから画面を作り直す
    Object.keys(map).forEach(k => delete map[k]);
    Object.assign(map, cloud);
    _origSave?.(); // localStorage にも反映
    window.rebuildRoulettes();
});
