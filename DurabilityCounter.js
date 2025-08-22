let count = 0;

function updateDisplay() {
    document.getElementById('counter').textContent = count;
}

function increment() {
    count++;
    updateDisplay();
}

function decrement() {
    if (count > 0) count--;
    updateDisplay();
}

function resetCounter() {
    count = 0;
    updateDisplay();
}

function setCounter() {
    const val = parseInt(document.getElementById('startValue').value, 10);
    count = isNaN(val) ? 0 : val;
    updateDisplay();}