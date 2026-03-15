/**
 * SUMDA - Authentication Controller
 */

function checkLogin() {
    const discordId = localStorage.getItem('discord_user_id');
    const userName = localStorage.getItem('loginUser');
    const isAuthPage = window.location.pathname.includes('login.html') || 
                       window.location.pathname.includes('user-register.html');
    const isFilterPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
                       
    // 1. Discord ID認証チェック (Filter)
    if (!discordId && !isFilterPage && !isAuthPage) {
        window.location.href = 'index.html';
        return false;
    }

    // 2. ログインチェック
    if (!userName && !isAuthPage && !isFilterPage) {
        window.location.href = 'login.html';
        return false;
    }
    return userName;
}

function displayWelcome(userName) {
    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg && userName) {
        welcomeMsg.innerText = `${userName}さん、ようこそ。`;
    }
}

function logout() {
    localStorage.removeItem('loginUser');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('discord_user_id');
    window.location.href = 'index.html';
}