/**
 * SUMDA - User Registration Controller
 */

async function handleRegister() {
    const user = document.getElementById('reg-username').value;
    const pass = document.getElementById('reg-password').value;
    const passConfirm = document.getElementById('reg-password-confirm').value;

    if (!user || !pass) {
        alert("ユーザー名とパスワードを入力してください。");
        return;
    }

    if (pass !== passConfirm) {
        alert("パスワードが一致しません。");
        const confirmInput = document.getElementById('reg-password-confirm');
        if (confirmInput) confirmInput.classList.add('error');
        return;
    }

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: user,
                password: pass
            })
        });

        const result = await response.json();

        if (result.success) {
            alert("登録が完了しました！ログイン画面へ移動します。");
            window.location.href = '../login.html';
        } else {
            alert("登録失敗: " + (result.message || "エラーが発生しました"));
        }

    } catch (error) {
        console.error("通信エラー:", error);
        alert("サーバーに接続できませんでした。");
    }
}