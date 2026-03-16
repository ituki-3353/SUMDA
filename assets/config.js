// config.js
const CONFIG = {
    // 開発中は localhost、サーバーで動かす時はサーバーのIPに書き換える
    API_BASE_URL: 'https://ituki-server.tailc69a27.ts.net/api',
    
    // 他の設定もここに追加できる
    VERSION: '1.0.0',
    SITE_NAME: 'SUMA',
    NAME_INFO: 'Server union MainFrame Administration system'
};

// 他のファイルからアクセスできるようにグローバル変数にする
window.APP_CONFIG = CONFIG;