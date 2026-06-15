import { dbLoad, dbSave } from './db.js';

const PATH = 'panelState/default';

const _origSave = window.savePanelState;
window.savePanelState = async function() {
    _origSave?.();
    const light = (window.panels || []).map(p => ({
        id: p.id, name: p.name, giftValue: p.giftValue,
        currentTarget: p.currentTarget, currentCount: p.currentCount,
        x: p.x, y: p.y, width: p.width, height: p.height,
        shape: p.shape, color: p.color, isRevealed: p.isRevealed
    }));
    await dbSave(PATH, { panels: light, boardW: window.boardW || 800, boardH: window.boardH || 600 });
};

window.addEventListener('load', async () => {
    const data = await dbLoad(PATH);
    if (data?.panels?.length) {
        localStorage.setItem('iriam_panel_v2', JSON.stringify({
            panels: data.panels, boardW: data.boardW, boardH: data.boardH,
            savedAt: data.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString()
        }));
    }
    window.loadPanelState?.();
});
