/**
 * SUMDA - Main Initialization
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. ログインチェック
    const userName = checkLogin();
    if (!userName) return;

    // 2. ユーザー名の表示
    displayWelcome(userName);

    // 3. 初期表示 (ダッシュボード)
    const defaultTab = document.querySelector('.tab-item.active');
    if (defaultTab) {
        const firstPage = defaultTab.getAttribute('data-page');
        if (firstPage) loadPage(firstPage);
    }

    // 4. イベントリスナー初期化
    initTabEvents();
});

/**
 * タブ切り替えイベントの初期化
 */
function initTabEvents() {
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.onclick = function() {
            const page = this.getAttribute('data-page');
            
            // ログアウト処理
            if (page === 'logout') { 
                logout(); 
                return; 
            }
            
            // タブの見た目更新
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // ページ読み込み
            loadPage(page);
        };
    });
}