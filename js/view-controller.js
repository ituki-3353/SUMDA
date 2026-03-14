/**
 * SUMDA - View Controller
 * view.html のメニュー制御と各ページコンポーネントの読み込みを担当
 */

/**
 * 各参照ページをロードする
 * @param {string} type - 'servers', 'trolls', 'users', 'history'
 */
async function loadViewPage(type) {
    const menuGrid = document.getElementById('regist-menu-grid');
    const formArea = document.getElementById('regist-form-area');
    const dynamicFields = document.getElementById('dynamic-fields');
    const titleEl = document.getElementById('current-form-title');

    if (!menuGrid || !formArea || !dynamicFields) return;

    // 1. UIの切り替え（メニューを隠してフォームエリアを表示）
    menuGrid.style.display = 'none';
    formArea.style.display = 'block';
    
    // 2. 読み込み中の表示
    dynamicFields.innerHTML = '<div class="loading">データベースに接続中...</div>';

    // 3. 外部HTMLファイルの取得
    const targetHtml = `pages/views/${type}.html`;
    
    try {
        const response = await fetch(targetHtml);
        if (!response.ok) throw new Error('HTMLファイルの読み込みに失敗しました');
        
        const htmlContent = await response.text();
        
        // 4. HTMLを流し込む
        dynamicFields.innerHTML = htmlContent;

        // タイトル設定
        if (titleEl) {
            const titles = {
                'servers': '🌐 加入サーバー参照',
                'trolls': '🚨 荒らし検挙情報アーカイブ',
                'users': '👥 SUMDA 登録アカウント一覧',
                'history': '🌐 荒らしサーバー総合履歴'
            };
            titleEl.innerText = titles[type] || '情報参照';
        }

        // 5. 各ページのデータ初期化（search.js の機能を呼び出す）
        const dataType = type.replace(/s$/, ''); 
        
        if (typeof initDatabaseView === 'function') {
            await initDatabaseView(dataType);
        } else {
            console.error('search.js が読み込まれていないか、initDatabaseView が定義されていません');
        }

        // 参照モードでは保存ボタンを隠す
        const submitBtnArea = document.querySelector('.form-actions');
        if (submitBtnArea) submitBtnArea.style.display = 'none';

    } catch (error) {
        console.error('View Load Error:', error);
        dynamicFields.innerHTML = `<div class="error-msg">エラー: ${error.message}</div>`;
    }
}