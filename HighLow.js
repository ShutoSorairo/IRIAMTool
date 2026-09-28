const SUITS = [
    { mark: '♠', color: 'black' },
    { mark: '♥', color: 'red' },
    { mark: '♦', color: 'red' },
    { mark: '♣', color: 'black' }
];
const RANK_LABELS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const BEST_KEY = 'highlow_best';
const SETTINGS_KEY = 'highlow_settings';

const el = id => document.getElementById(id);
const currentEl = el('currentCard');
const nextEl = el('nextCard');
const messageEl = el('message');
const streakEl = el('streak');
const bestEl = el('best');
const remainEl = el('remain');
const historyEl = el('history');
const highBtn = el('highBtn');
const lowBtn = el('lowBtn');
const tieRuleEl = el('tieRule');
const aceHighEl = el('aceHigh');

let deck = [];
let current = null;
let streak = 0;
let best = 0;
let busy = false;

try { best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) {}
try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    if (s.tieRule) tieRuleEl.value = s.tieRule;
    aceHighEl.checked = !!s.aceHigh;
} catch (e) {}

function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ tieRule: tieRuleEl.value, aceHigh: aceHighEl.checked }));
    } catch (e) {}
}

function newDeck() {
    const d = [];
    for (let s = 0; s < 4; s++) {
        for (let r = 1; r <= 13; r++) d.push({ rank: r, suit: s });
    }
    for (let i = d.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
}

function draw() {
    if (deck.length === 0) deck = newDeck();
    return deck.pop();
}

function value(card) {
    return (card.rank === 1 && aceHighEl.checked) ? 14 : card.rank;
}

function renderCard(target, card) {
    const suit = SUITS[card.suit];
    const label = RANK_LABELS[card.rank];
    target.className = 'card ' + suit.color;
    target.innerHTML =
        `<span class="corner">${label}<br>${suit.mark}</span>` +
        `<span class="rank">${label}</span><span class="suit">${suit.mark}</span>`;
    void target.offsetWidth;
    target.classList.add('flip');
}

function renderBack(target) {
    target.className = 'card back';
    target.innerHTML = '';
}

function setStat(target, v) {
    target.textContent = v;
    target.classList.remove('bump');
    void target.offsetWidth;
    target.classList.add('bump');
}

function updateStats() {
    streakEl.textContent = streak;
    bestEl.textContent = best;
    remainEl.textContent = deck.length;
}

function addHistory(card, result) {
    const suit = SUITS[card.suit];
    const span = document.createElement('span');
    span.className = `mini ${suit.color} ${result || ''}`;
    span.textContent = RANK_LABELS[card.rank] + suit.mark;
    historyEl.prepend(span);
    while (historyEl.children.length > 30) historyEl.lastChild.remove();
}

function setMessage(text, cls) {
    messageEl.className = 'message ' + (cls || '');
    messageEl.textContent = text;
}

function start() {
    deck = newDeck();
    current = draw();
    streak = 0;
    historyEl.innerHTML = '';
    renderCard(currentEl, current);
    renderBack(nextEl);
    addHistory(current, '');
    setMessage('HIGH か LOW を選んでね');
    updateStats();
}

function guess(dir) {
    if (busy) return;
    busy = true;
    highBtn.disabled = lowBtn.disabled = true;

    const next = draw();
    renderCard(nextEl, next);

    const a = value(current), b = value(next);
    let result;
    if (a === b) {
        result = tieRuleEl.value; // draw / win / lose
    } else {
        result = ((b > a) === (dir === 'high')) ? 'win' : 'lose';
    }

    if (result === 'win') {
        streak++;
        setStat(streakEl, streak);
        if (streak > best) {
            best = streak;
            setStat(bestEl, best);
            try { localStorage.setItem(BEST_KEY, best); } catch (e) {}
        }
        setMessage(a === b ? `同じ数字！セーフ！ ${streak}連勝` : `アタリ！ ${streak}連勝！`, 'win');
    } else if (result === 'lose') {
        setMessage(a === b ? `同じ数字…アウト！ 記録 ${streak}連勝` : `ハズレ… 記録 ${streak}連勝`, 'lose');
        if (streak !== 0) setStat(streakEl, 0);
        streak = 0;
    } else {
        setMessage(`同じ数字！引き分け（${streak}連勝のまま）`, 'draw');
    }
    addHistory(next, result);
    remainEl.textContent = deck.length;

    setTimeout(() => {
        current = next;
        renderCard(currentEl, current);
        renderBack(nextEl);
        if (deck.length === 0) {
            deck = newDeck();
            remainEl.textContent = deck.length;
        }
        highBtn.disabled = lowBtn.disabled = false;
        busy = false;
    }, 1100);
}

highBtn.onclick = () => guess('high');
lowBtn.onclick = () => guess('low');
el('resetBtn').onclick = start;
tieRuleEl.onchange = saveSettings;
aceHighEl.onchange = saveSettings;

document.addEventListener('keydown', e => {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowUp') guess('high');
    if (e.key === 'ArrowDown') guess('low');
});

start();
