const items = ["✊️", "✌️", "🖐️"];
const audios = [
    document.getElementById('audio0'),
    document.getElementById('audio1'),
    document.getElementById('audio2')
];
const resultDiv = document.getElementById('result');
const btn = document.getElementById('startBtn');

btn.onclick = () => {
    btn.disabled = true;
    let i = 0;
    let count = 0;
    const spin = setInterval(() => {
        resultDiv.textContent = items[i % 3];
        i++;
        count++;
        if (count > 20) {
            clearInterval(spin);
            const idx = Math.floor(Math.random() * 3);
            resultDiv.textContent = items[idx];
            audios[idx].currentTime = 0;
            audios[idx].play();
            btn.disabled = false;
        }
    }, 80);
};
