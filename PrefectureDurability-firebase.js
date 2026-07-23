import { dbLoad, dbSave } from './db.js';

const PATH = 'prefectureDurability/default';

const _origSave = window.saveDurabilityCache;
window.saveDurabilityCache = async function() {
    _origSave?.();
    await dbSave(PATH, { checked: [...window.prefectureDurabilityChecked] });
};

window.addEventListener('load', async () => {
    const data = await dbLoad(PATH);
    if (!data?.checked) return;

    const checked = window.prefectureDurabilityChecked;
    checked.clear();
    data.checked.forEach(p => checked.add(p));
    window.renderPrefectureDurability?.();
});
