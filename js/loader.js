/**
 * SUMDA - Page Loader
 */

async function loadPage(pageUrl) {
    const contentArea = document.getElementById('main-content');
    if (!contentArea) return;

    // ローディング表示
    contentArea.innerHTML = '<div style="padding:20px; color:#666;">読み込み中...</div>';

    try {
        // HTMLファイルの取得（タイムアウトを設定してフリーズを防ぐ）
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(pageUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`ファイルが見つかりません: ${pageUrl}`);

        const html = await response.text();
        contentArea.innerHTML = html;
        
        // --- 画面描画後の権限制御 ---
        const isAdmin = localStorage.getItem('isAdmin') === '1';
        if (!isAdmin) {
            // 管理者専用のカードや要素を隠す
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
            
            // regist.html 内の特定のメニューを隠す（もしクラスがなければ中身で判断）
            if (pageUrl.includes('regist.html')) {
                document.querySelectorAll('.menu-card').forEach(card => {
                    if (card.innerText.includes('スタッフ管理')) {
                        card.style.display = 'none';
                    }
                });
            }
        }

        // --- 画面描画後の初期化処理 ---
        if (pageUrl.includes('calendar.html')) {
            console.log("Calendar HTML loaded. Initializing...");
            if (typeof initCalendarToggles === 'function') initCalendarToggles();
            if (typeof switchView === 'function') switchView('grid'); 
        } else if (pageUrl.includes('dashboard.html')) {
            if (typeof updateDashboard === 'function') updateDashboard();
        }
    } catch (error) {
        console.error('Page load error:', error);
        const msg = error.name === 'AbortError' ? '通信タイムアウト' : error.message;
        contentArea.innerHTML = `<div style="padding:20px; color:red;">エラー: ${msg}</div>`;
    }
}