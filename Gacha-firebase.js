import { dbLoad, dbSave, dbDelete } from './db.js';

// Firestore構成（users/{uid}/ 以下）
//   gacha/default  … 一覧情報 { version, activeId, names, gachaIds }
//   gacha/{gachaId} … ガチャ1種類分 { id, title, rarities, prizes, history }
// ※ 旧形式では gacha/default にガチャ1種類分がそのまま入っていた
const META_PATH = 'gacha/default';
const gachaPath = id => `gacha/${id}`;
const SAVE_DELAY = 800;

const loggedIn = () => !!localStorage.getItem('iriam_uid');
const dirtyIds = new Set();
let saveTimer = null;

async function flush(all = false) {
    const store = window.getGachaStore?.();
    if (!store) return;
    const ids = all ? store.gachas.map(g => g.id) : [...dirtyIds];
    dirtyIds.clear();
    const tasks = store.gachas
        .filter(g => ids.includes(g.id))
        .map(g => dbSave(gachaPath(g.id), g));
    tasks.push(dbSave(META_PATH, {
        version: 3,
        activeId: store.activeId,
        names: store.names,
        gachaIds: store.gachas.map(g => g.id)
    }));
    await Promise.all(tasks);
}

// 既存の saveData を Firestore 対応に上書き（入力のたびに書き込まないよう少し待ってまとめて保存）
const _origSave = window.saveData;
window.saveData = function() {
    _origSave?.();
    if (!loggedIn()) return;
    const store = window.getGachaStore?.();
    if (store) dirtyIds.add(store.activeId);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, SAVE_DELAY);
};

window.onGachaDeleted = function(id) {
    dirtyIds.delete(id);
    if (loggedIn()) dbDelete(gachaPath(id));
};

// ページを閉じる直前に未保存分を送る
window.addEventListener('pagehide', () => {
    if (dirtyIds.size > 0) { clearTimeout(saveTimer); flush(); }
});

window.addEventListener('load', async () => {
    if (!loggedIn()) return; // 未ログイン時は Gacha.js が localStorage から読み込む

    const meta = await dbLoad(META_PATH);

    if (meta && Array.isArray(meta.gachaIds) && meta.gachaIds.length > 0) {
        const gachas = (await Promise.all(meta.gachaIds.map(id => dbLoad(gachaPath(id))))).filter(Boolean);
        if (gachas.length > 0) {
            window.loadData({ names: meta.names, activeId: meta.activeId, gachas });
            return;
        }
    }

    if (meta && Array.isArray(meta.rarities)) {
        // 旧形式（ガチャ1種類）→ 新形式へ移行して保存し直す
        window.loadData(meta);
    } else {
        // クラウドに有効なデータがない → この端末のデータを使い、クラウドへ上げる
        window.loadData();
    }
    await flush(true);
});
