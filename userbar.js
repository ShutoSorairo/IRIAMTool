(function() {
    const style = document.createElement('style');
    style.textContent = `
        #global-user-bar {
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 40px;
            background: rgba(255,255,255,0.92);
            backdrop-filter: blur(6px);
            border-bottom: 1px solid #e8e8e8;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding: 0 16px;
            gap: 10px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.85rem;
            color: #555;
            z-index: 9999;
            box-sizing: border-box;
        }
        #global-user-bar .ub-name {
            font-weight: 600;
            color: #333;
        }
        #global-user-bar .ub-dot {
            width: 8px; height: 8px;
            border-radius: 50%;
            background: #4caf50;
            flex-shrink: 0;
        }
        #global-user-bar .ub-dot.offline { background: #bbb; }
        #global-user-bar .ub-logout {
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 4px 12px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: background 0.2s, color 0.2s, border-color 0.2s;
            color: #555;
        }
        #global-user-bar .ub-logout:hover {
            background: #ffe0e0;
            border-color: #e53935;
            color: #e53935;
        }
        #global-user-bar .ub-login {
            color: #1976d2;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.85rem;
        }
        #global-user-bar .ub-login:hover { text-decoration: underline; }
        body { padding-top: calc(40px + 16px) !important; }
    `;
    document.head.appendChild(style);

    const bar = document.createElement('div');
    bar.id = 'global-user-bar';

    const uid = localStorage.getItem('iriam_uid');
    const name = localStorage.getItem('iriam_name');

    if (uid && name) {
        const dot = document.createElement('span');
        dot.className = 'ub-dot';

        const nameEl = document.createElement('span');
        nameEl.className = 'ub-name';
        nameEl.textContent = name + ' さん';

        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'ub-logout';
        logoutBtn.textContent = 'ログアウト';
        logoutBtn.onclick = () => {
            localStorage.removeItem('iriam_uid');
            localStorage.removeItem('iriam_name');
            location.reload();
        };

        bar.appendChild(dot);
        bar.appendChild(nameEl);
        bar.appendChild(logoutBtn);
    } else {
        const dot = document.createElement('span');
        dot.className = 'ub-dot offline';

        const msg = document.createElement('span');
        msg.textContent = 'ログインしていません';

        const registerLink = document.createElement('a');
        registerLink.className = 'ub-login';
        registerLink.href = 'Login.html?tab=register';
        registerLink.textContent = '新規登録';

        const loginLink = document.createElement('a');
        loginLink.className = 'ub-login';
        loginLink.href = 'Login.html?tab=login';
        loginLink.textContent = 'ログイン';

        bar.appendChild(dot);
        bar.appendChild(msg);
        bar.appendChild(registerLink);
        bar.appendChild(loginLink);
    }

    document.body.prepend(bar);
})();
