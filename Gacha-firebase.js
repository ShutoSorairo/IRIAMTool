import { dbLoad, dbSave } from './db.js';

const PATH = 'gacha/default';

// 既存のsaveData/loadDataをFirestore対応に上書き
const _origSave = window.saveData;
window.saveData = async function() {
    _origSave?.();
    await dbSave(PATH, window.config);
};

// 起動時にFirestoreから読み込み、なければlocalStorageにフォールバック
window.addEventListener('load', async () => {
    const data = await dbLoad(PATH);
    if (data) {
        // Firestoreのデータで上書き
        localStorage.setItem('iriam_gacha_v2', JSON.stringify(data));
    }
    window.loadData?.();
});
