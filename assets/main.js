/**
 * SUDMA System - Main Controller (Stable & High Performance Version)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. ログインチェック
    const userName = localStorage.getItem('loginUser');
    const isAuthPage = window.location.pathname.includes('login.html') || 
                       window.location.pathname.includes('user-register.html');
                       
    if (!userName && !isAuthPage) {
        window.location.href = 'login.html';
        return;
    }

    // 2. ユーザー名の表示
    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg && userName) {
        welcomeMsg.innerText = `${userName}さん、ようこそ。`;
    }

    // 3. 初期表示
    const defaultTab = document.querySelector('.tab-item.active');
    if (defaultTab) {
        const firstPage = defaultTab.getAttribute('data-page');
        if (firstPage) loadPage(firstPage);
    }

    // 4. イベントリスナー初期化
    initTabEvents();
});

/**
 * ページの非同期読み込み (高速遷移・エラーガード版)
 */
async function loadPage(pageUrl) {
    const contentArea = document.getElementById('main-content');
    if (!contentArea) return;

    // ローディング表示
    contentArea.innerHTML = '<div style="padding:20px; color:#666;">読み込み中...</div>';

    try {
        // HTMLファイルの取得（ここにはタイムアウトを設定してフリーズを防ぐ）
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(pageUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`ファイルが見つかりません: ${pageUrl}`);

        const html = await response.text();
        contentArea.innerHTML = html;
        
        // --- 画面描画後の初期化処理（重い処理は await せずに実行） ---
        if (pageUrl.includes('dashboard.html')) {
            updateDashboard(); // 順次更新
        } 
        else if (pageUrl.includes('calendar.html')) {
            initCalendarToggles();
            switchView('grid');
            // 重いデータ取得はバックグラウンドで走らせる
            loadSchedules();
            renderCalendarGrid();
        }
    } catch (error) {
        console.error('Page load error:', error);
        const msg = error.name === 'AbortError' ? '通信タイムアウト' : error.message;
        contentArea.innerHTML = `<div style="padding:20px; color:red;">エラー: ${msg}</div>`;
    }
}

/**
 * ダッシュボード更新
 */
async function updateDashboard() {
    const nameEl = document.getElementById('dash-user-name');
    if (nameEl) nameEl.innerText = localStorage.getItem('loginUser') || '不明';

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

/**
 * フォームの表示 (統合管理センター用)
 */
function openForm(type, editData = null) {
    const menu = document.getElementById('regist-menu-grid');
    const formArea = document.getElementById('regist-form-area');
    const fields = document.getElementById('dynamic-fields');
    const title = document.getElementById('current-form-title');

    if (!menu || !formArea || !fields) return;

    menu.style.display = 'none';
    formArea.style.display = 'block';

    const modeText = editData ? '編集' : '登録';

    // 種別ごとのフォーム生成
    if (type === 'schedule') {
        title.innerText = `📅 予定・シフトの${modeText}`;
        fields.innerHTML = `
            <div class="form-group"><label>対象日</label><input type="date" id="reg-date" class="form-control" value="${editData?.date?.split('T')[0] || ''}" required></div>
            <div class="form-group"><label>対応者</label><input type="text" id="reg-employee" class="form-control" value="${editData?.employee_name || localStorage.getItem('loginUser')}" required></div>
            <div class="form-group"><label>状況</label>
                <select id="reg-status" class="form-control">
                    <option value="0" ${editData?.status == 0 ? 'selected' : ''}>✅ 対応可能</option>
                    <option value="1" ${editData?.status == 1 ? 'selected' : ''}>🟦 午前のみ</option>
                    <option value="2" ${editData?.status == 2 ? 'selected' : ''}>🟨 午後のみ</option>
                    <option value="3" ${editData?.status == 3 ? 'selected' : ''}>⬜️ 深夜のみ</option>
                    <option value="4" ${editData?.status == 4 ? 'selected' : ''}>❌ 対応不可</option>
                </select>
            </div>
            <div class="form-group"><label>補足</label><textarea id="reg-memo" class="form-control">${editData?.memo || ''}</textarea></div>
        `;
    } else if (type === 'info') {
        title.innerText = `📝 荒らし情報${modeText}`;
        fields.innerHTML = `
            <div class="form-group"><label>対象(ID/名前)</label><input type="text" id="info-target" class="form-control" required></div>
            <div class="form-group"><label>詳細</label><textarea id="info-detail" class="form-control" rows="4"></textarea></div>
        `;
    } else if (type === 'server') {
        title.innerText = `📊 加入サーバー管理${modeText}`;
        fields.innerHTML = `
            <div class="form-group"><label>サーバー名</label><input type="text" id="sv-name" class="form-control" required></div>
            <div class="form-group"><label>招待コード</label><input type="text" id="sv-code" class="form-control"></div>
        `;
    } else if (type === 'user') {
        title.innerText = `👥 スタッフ管理${modeText}`;
        fields.innerHTML = `
            <div class="form-group"><label>ユーザー名</label><input type="text" id="staff-username" class="form-control" value="${editData?.username || ''}" required></div>
            <div class="form-group"><label>パスワード${editData ? '(変更する場合)' : ''}</label><input type="password" id="staff-password" class="form-control" ${editData ? '' : 'required'}></div>
            <div class="form-group"><label>権限</label> 
                <select id="staff-role" class="form-control">
                    <option value="admin" ${editData?.role === 'admin' ? 'selected' : ''}>管理者</option>
                    <option value="staff" ${editData?.role === 'staff' ? 'selected' : ''}>スタッフ</option>
                </select>
            </div>
        `;
    } else {
        title.innerText = 'エラーです';
        fields.innerHTML = '<div style="color:red;">不明なフォーム種別です。</div>';
    }



    const form = document.getElementById('main-regist-form');
    if (form) {
        form.dataset.editId = editData?.id || '';
        form.dataset.formType = type;
        form.onsubmit = handleFormSubmit;
    }
}

/**
 * フォーム送信
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const type = form.dataset.formType;
    const editId = form.dataset.editId;
    
    let apiPath = '', payload = {};

    try {
        if (type === 'schedule') {
            apiPath = '/schedules';
            payload = {
                date: document.getElementById('reg-date').value,
                employee_name: document.getElementById('reg-employee').value,
                status: parseInt(document.getElementById('reg-status').value),
                memo: document.getElementById('reg-memo')?.value || ''
            };
        }
        // ... 他の type (info, server) も同様に取得 ...

        const method = editId ? 'PUT' : 'POST';
        const url = editId ? `${window.APP_CONFIG.API_BASE_URL}${apiPath}/${editId}` : `${window.APP_CONFIG.API_BASE_URL}${apiPath}`;

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('✅ 保存完了');
            hideRegistForm();
            if (type === 'schedule') { loadSchedules(); renderCalendarGrid(); }
        }
    } catch (err) { alert('❌ 保存に失敗しました'); }
}

function hideRegistForm() {
    document.getElementById('regist-menu-grid').style.display = 'grid';
    document.getElementById('regist-form-area').style.display = 'none';
}

/**
 * カレンダー・リスト操作
 */
async function loadSchedules() {
    const listEl = document.getElementById('schedule-list');
    if (!listEl) return;
    try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/schedules`);
        const data = await res.json();
        listEl.innerHTML = '';
        data.forEach(item => {
            const tr = document.createElement('tr');
            const d = new Date(item.date);
            const dStr = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
            const conf = getStatusConfig(item.status);
            tr.innerHTML = `<td>${dStr}</td><td>${item.employee_name}</td><td><span class="${conf.class}">${conf.label}</span></td><td>${item.memo || '-'}</td>
                            <td><button class="btn-delete" onclick="deleteSchedule(${item.id})">削除</button></td>`;
            listEl.appendChild(tr);
        });
    } catch (e) { console.warn('List load failed'); }
}

/**
 * スケジュールリスト（表形式）の読み込み
 */
async function loadSchedules() {
    const listEl = document.getElementById('schedule-list');
    if (!listEl) return;

    // 今日の日付情報を取得 (比較用)
    const today = new Date();
    const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/schedules`);
        const data = await res.json();
        
        listEl.innerHTML = ''; // 一旦クリア

        data.forEach(item => {
            const d = new Date(item.date);
            const itemTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

            // --- 今日以降の予定のみを表示 ---
            if (itemTime >= todayReset) {
                const tr = document.createElement('tr');
                
                // --- 今日なら行に色を付ける ---
                if (itemTime === todayReset) {
                    tr.style.backgroundColor = '#fff9e6'; // カレンダーの強調色と合わせたよ
                    tr.classList.add('today-row');
                }

                const dStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
                const conf = getStatusConfig(item.status);
                
                tr.innerHTML = `
                    <td>${dStr} ${itemTime === todayReset ? '<b>(今日)</b>' : ''}</td>
                    <td>${item.employee_name}</td>
                    <td><span class="${conf.class}">${conf.label}</span></td>
                    <td>${item.memo || '-'}</td>
                    <td><button class="btn-delete" onclick="deleteSchedule(${item.id})">削除</button></td>
                `;
                listEl.appendChild(tr);
            }
        });

        // もし表示する予定が一個もなかったら
        if (listEl.innerHTML === '') {
            listEl.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">今日以降の予定はありません。</td></tr>';
        }

    } catch (e) {
        console.warn('リストの読み込みに失敗しちゃったみたい:', e);
    }
}

async function renderCalendarGrid() {
    const gridEl = document.getElementById('calendar-days');
    if (!gridEl) return;
    // ... カレンダー描画ロジック (以前と同様) ...
}

/**
 * ステータス数値からラベルとCSSクラスを返す
 */
function getStatusConfig(n) {
    // 確実に数値に変換するよ
    const statusNum = Number(n);
    
    const configs = { 
        0: { label: "✅ 対応可能", class: "badge-ok" }, 
        1: { label: "🟦 午前のみ", class: "badge-morning" }, // ここが「1」
        2: { label: "🟨 午後のみ", class: "badge-afternoon" },
        3: { label: "⬜️ 深夜のみ", class: "badge-midnight" },
        4: { label: "❌ 対応不可", class: "badge-ng" } 
    };

    // 該当がない場合はデフォルト値を返す
    return configs[statusNum] || { label: "取得できません。", class: "badge-default" };
}

function initTabEvents() {
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.onclick = function() {
            const page = this.getAttribute('data-page');
            if (page === 'logout') { logout(); return; }
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            loadPage(page);
        };
    });
}

/**
 * ページの非同期読み込み (カレンダー描画のタイミングを修正)
 */
async function loadPage(pageUrl) {
    const contentArea = document.getElementById('main-content');
    if (!contentArea) return;

    contentArea.innerHTML = '<div style="padding:20px; color:#666;">読み込み中...</div>';

    try {
        const response = await fetch(pageUrl);
        if (!response.ok) throw new Error(`ファイルが見つかりません: ${pageUrl}`);

        const html = await response.text();
        contentArea.innerHTML = html;
        
        // --- ここからが重要だよ！ ---
        // HTMLが画面に書き込まれた直後に初期化を呼ぶ
        if (pageUrl.includes('calendar.html')) {
            console.log("Calendar HTML loaded. Initializing...");
            
            // 1. まずスイッチ（ボタン）を使えるようにする
            initCalendarToggles();
            
            // 2. 初期状態でグリッドを表示するように命令
            switchView('grid'); 
        } else if (pageUrl.includes('dashboard.html')) {
            updateDashboard();
        }
    } catch (error) {
        console.error('Page load error:', error);
        contentArea.innerHTML = `<div style="padding:20px; color:red;">エラー: ${error.message}</div>`;
    }
}

/**
 * カレンダーのスイッチ設定
 */
function initCalendarToggles() {
    const btnGrid = document.getElementById('view-grid');
    const btnList = document.getElementById('view-list');

    if (btnGrid) {
        btnGrid.onclick = () => switchView('grid');
    } else {
        console.error("ID 'view-grid' が見つからないよ！HTMLを確認してね。");
    }

    if (btnList) {
        btnList.onclick = () => switchView('list');
    }
}

/**
 * 表示切り替え
 */
function switchView(viewType) {
    const gridContainer = document.getElementById('view-grid-container');
    const listContainer = document.getElementById('view-list-container');
    const btnGrid = document.getElementById('view-grid');
    const btnList = document.getElementById('view-list');

    if (viewType === 'grid') {
        if (gridContainer) gridContainer.style.display = 'block';
        if (listContainer) listContainer.style.display = 'none';
        
        // ボタンの見た目を「選択中」にする
        btnGrid?.classList.add('active');
        btnList?.classList.remove('active');
        
        // 重要：ここでグリッド（マス目）を描画する関数を呼ぶ
        renderCalendarGrid(); 
    } else {
        if (gridContainer) gridContainer.style.display = 'none';
        if (listContainer) listContainer.style.display = 'block';
        
        btnList?.classList.add('active');
        btnGrid?.classList.remove('active');
        
        // リスト（表）を表示
        loadSchedules();
    }
}

/**
 * カレンダーグリッド（マス目）の生成
 */
async function renderCalendarGrid() {
    const gridEl = document.getElementById('calendar-days');
    if (!gridEl) return;

    gridEl.innerHTML = ''; 

    // 今日の日付情報を取得
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    // 表示対象（現在は2026年3月固定の設定）
    const year = 2026;
    const month = 2; // 3月
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    // 1. 空白マス
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day-cell empty';
        gridEl.appendChild(empty);
    }

    // 2. 日付マス
    for (let d = 1; d <= lastDate; d++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell';
        
        // --- 今日かどうかを判定してクラスを付与 ---
        if (year === todayYear && month === todayMonth && d === todayDate) {
            cell.classList.add('today-highlight'); // 今日を強調するクラス
        }

        cell.innerHTML = `
            <span class="day-number">${d}</span>
            <div id="grid-day-${d}" class="day-content"></div>
        `;
        gridEl.appendChild(cell);
    }

    // 3. データ取得と反映（過去の予定をフィルタリング）
    try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/schedules`);
        const data = await res.json();
        
        // 今日の0時0分のタイムスタンプ（比較用）
        const todayReset = new Date(todayYear, todayMonth, todayDate).getTime();

        data.forEach(item => {
            const dObj = new Date(item.date);
            const itemTime = new Date(dObj.getFullYear(), dObj.getMonth(), dObj.getDate()).getTime();

            // 「今日以降」の予定のみを表示する
            if (itemTime >= todayReset) {
                if (dObj.getFullYear() === year && dObj.getMonth() === month) {
                    const target = document.getElementById(`grid-day-${dObj.getDate()}`);
                    if (target) {
                        const conf = getStatusConfig(item.status);
                        const badge = document.createElement('div');
                        badge.className = `grid-badge ${conf.class}`;
                        badge.innerText = `${conf.label.substring(0, 2)} ${item.employee_name}`;
                        target.appendChild(badge);
                    }
                }
            }
        });
    } catch (e) {
        console.warn('グリッドデータの読み込みに失敗したよ');
    }
}

/**
 * スイッチ（切り替えボタン）の初期化
 */
function initCalendarToggles() {
    const btnGrid = document.getElementById('view-grid'); // HTMLのIDと一致しているか確認
    const btnList = document.getElementById('view-list');

    if (btnGrid) {
        btnGrid.onclick = () => {
            console.log("Grid button clicked"); // デバッグ用
            switchView('grid');
        };
    }

    if (btnList) {
        btnList.onclick = () => {
            console.log("List button clicked"); // デバッグ用
            switchView('list');
        };
    }
}

/**
 * 表示切り替えの実態
 */
function switchView(viewType) {
    const gridContainer = document.getElementById('view-grid-container');
    const listContainer = document.getElementById('view-list-container');
    const btnGrid = document.getElementById('view-grid');
    const btnList = document.getElementById('view-list');

    if (viewType === 'grid') {
        if (gridContainer) gridContainer.style.display = 'block';
        if (listContainer) listContainer.style.display = 'none';
        
        // ボタンの見た目を変える
        btnGrid?.classList.add('active');
        btnList?.classList.remove('active');
        
        // グリッドを再描画
        renderCalendarGrid();
    } else {
        if (gridContainer) gridContainer.style.display = 'none';
        if (listContainer) listContainer.style.display = 'block';
        
        btnList?.classList.add('active');
        btnGrid?.classList.remove('active');
        
        // リストを更新
        loadSchedules();
    }
}

async function deleteSchedule(id) {
    if (!confirm('削除しますか？')) return;
    await fetch(`${window.APP_CONFIG.API_BASE_URL}/schedules/${id}`, { method: 'DELETE' });
    loadSchedules(); renderCalendarGrid();
}

function logout() { localStorage.removeItem('loginUser'); window.location.href = 'login.html'; }