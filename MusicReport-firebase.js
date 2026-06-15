import { dbLoad, dbSave } from './db.js';

const PATH = 'music/default';

// saveMusicDataを上書き（元の関数はlocalStorageに保存）
const _origSave = window.saveMusicData;
window.saveMusicData = async function(data) {
    _origSave?.(data);
    await dbSave(PATH, { entries: data });
};

// Firestoreからデータを読み込んでlocalStorageと画面を更新
window.addEventListener('load', async () => {
    const stored = await dbLoad(PATH);
    if (stored?.entries?.length) {
        localStorage.setItem('musicData', JSON.stringify(stored.entries));
        window.renderTable?.();
    }
});
