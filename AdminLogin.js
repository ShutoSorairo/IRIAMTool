
const ADMIN_PASS = "admin"; 

function login() {
    const input = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');

    if (input === ADMIN_PASS) {
        // セッションストレージに「ログイン済み」という印をつける
        sessionStorage.setItem('iriam_admin_logged_in', 'true');
        
        // 管理画面へ移動
        window.location.href = 'AdminDashboard.html';
    } else {
        // パスワード間違い
        errorMsg.style.display = 'block';
        
        // 入力欄をクリアしてフォーカスを戻す
        const passInput = document.getElementById('password');
        passInput.value = '';
        passInput.focus();
    }
}
