/**
 * SUMDA - Authentication Controller
 */

function checkLogin() {
    const userName = localStorage.getItem('loginUser');
    const isAuthPage = window.location.pathname.includes('login.html') || 
                       window.location.pathname.includes('user-register.html');
                       
    if (!userName && !isAuthPage) {
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
    window.location.href = 'login.html';
}