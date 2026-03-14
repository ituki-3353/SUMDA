/**
 * SUMDA - Dashboard Controller
 */

async function updateDashboard() {
    const nameEl = document.getElementById('dash-user-name');
    if (nameEl) {
        const user = localStorage.getItem('loginUser') || '不明';
        const isAdmin = localStorage.getItem('isAdmin') === '1';
        nameEl.innerText = isAdmin ? `${user} (管理者)` : user;
    }

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/dashboard-info`);
        const data = await response.json();
        if (data.success) {
            const countEl = document.getElementById('dash-user-count');
            const timeEl = document.getElementById('dash-server-time');
            if (countEl) countEl.innerText = data.userCount;
            if (timeEl) timeEl.innerText = data.serverTime;
        }
    } catch (error) {
        console.warn('Dashboard fetch failed (Background):', error);
    }
}