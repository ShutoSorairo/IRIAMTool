import { auth, ADMIN_UID } from './firebase-config.js';
import {
    signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";

// すでに管理者としてログイン済みならダッシュボードへ
onAuthStateChanged(auth, user => {
    if (user && user.uid === ADMIN_UID) {
        window.location.href = 'AdminDashboard.html';
    }
});

function showError(msg) {
    const el = document.getElementById('error-msg');
    el.textContent = msg;
    el.style.display = 'block';
}

window.login = async function() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('login-btn');
    document.getElementById('error-msg').style.display = 'none';

    if (!email || !password) {
        showError('メールアドレスとパスワードを入力してください');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'ログイン中...';
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (cred.user.uid !== ADMIN_UID) {
            await signOut(auth);
            showError('このアカウントには管理者権限がありません');
            return;
        }
        window.location.href = 'AdminDashboard.html';
    } catch (e) {
        showError('メールアドレスまたはパスワードが違います');
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    } finally {
        btn.disabled = false;
        btn.textContent = 'ログイン';
    }
};
