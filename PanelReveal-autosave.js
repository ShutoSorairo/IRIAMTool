import { dbLoad, dbSave } from './db.js';

const PATH = 'panelState/default';
const SAVE_DELAY = 800;

// 画像データは重いので除いた、Firestore 保存用のパネル情報
export function lightPanels(panels) {
    return (panels || []).map(p => ({
        id: p.id, name: p.name, giftValue: p.giftValue,
        currentTarget: p.currentTarget, currentCount: p.currentCount,
        x: p.x, y: p.y, width: p.width, height: p.height,
        shape: p.shape, color: p.color, isRevealed: p.isRevealed
    }));
}

let saveTimer = null;

async function flush() {
    clearTimeout(saveTimer);
    saveTimer = null;
    const state = window.getPanelState?.();
    if (!state) return;
    await dbSave(PATH, { panels: lightPanels(state.panels), boardW: state.boardW, boardH: state.boardH });
}

// savePanelState は カウント操作やドラッグのたびに呼ばれるので、少し待ってまとめて送る
const _origSave = window.savePanelState;
window.savePanelState = function() {
    _origSave?.();
    if (!localStorage.getItem('iriam_uid')) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, SAVE_DELAY);
};

window.addEventListener('pagehide', () => { if (saveTimer) flush(); });

window.addEventListener('load', async () => {
    if (!localStorage.getItem('iriam_uid')) return; // 未ログイン時は PanelReveal.js が読み込む
    const data = await dbLoad(PATH);
    if (data?.panels?.length) {
        localStorage.setItem('iriam_panel_v2', JSON.stringify({
            panels: data.panels, boardW: data.boardW, boardH: data.boardH,
            savedAt: data.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString()
        }));
    }
    window.loadPanelState?.();
});
