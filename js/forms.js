/*
 * Version0.4
 * SUMDAシステム
 */
/**
 * SUMDA - Forms Controller (Integrated Registration)
 */

function openForm(type, editData = null) {
    const menu = document.getElementById('regist-menu-grid');
    const formArea = document.getElementById('regist-form-area');
    const fields = document.getElementById('dynamic-fields');
    const title = document.getElementById('current-form-title');

    if (!menu || !formArea || !fields) return;

    menu.style.display = 'none';
    formArea.style.display = 'block';

    const submitBtnArea = document.querySelector('.form-actions');
    if (submitBtnArea) {
        submitBtnArea.style.display = 'block';
    }

    const modeText = editData ? '編集' : '登録';

    // --- 1. スケジュール・会議フォーム ---
    if (type === 'schedule') {
        title.innerText = `📅 予定・会議の${modeText}`;
        fields.innerHTML = `
            <div class="form-group"><label>対象日</label><input type="date" id="reg-date" class="form-control" value="${editData?.date?.split('T')[0] || ''}" required></div>
            <div class="form-group"><label>対応者/議長</label><input type="text" id="reg-employee" class="form-control" value="${editData?.employee_name || localStorage.getItem('loginUser') || ''}" required></div>
            <div class="form-group"><label>状況・種別</label>
                <select id="reg-status" class="form-control" onchange="toggleMeetingFields(this.value)">
                    <option value="0" ${editData?.status == 0 ? 'selected' : ''}>✅ 対応可能</option>
                    <option value="10" ${editData?.status == 10 ? 'selected' : ''}>📅 会議・打ち合わせ</option>
                    <option value="1" ${editData?.status == 1 ? 'selected' : ''}>🟦 午前のみ</option>
                    <option value="2" ${editData?.status == 2 ? 'selected' : ''}>🟨 午後のみ</option>
                    <option value="4" ${editData?.status == 4 ? 'selected' : ''}>❌ 対応不可</option>
                </select>
            </div>
            <div id="meeting-fields" style="display: ${editData?.status == 10 ? 'block' : 'none'}; border-left: 3px solid #007bff; padding-left: 15px; margin-top: 10px; background: #f8f9fa; border-radius: 4px; padding-top: 5px;">
                <div class="form-group"><label>開始時間</label><input type="time" id="reg-discus-time" class="form-control" value="${editData?.discus_st_time || ''}"></div>
                <div class="form-group"><label>会議内容/アジェンダ</label><textarea id="reg-discus-info" class="form-control" rows="3">${editData?.discus_info || ''}</textarea></div>
            </div>
            <div class="form-group"><label>補足メモ</label><textarea id="reg-memo" class="form-control">${editData?.memo || ''}</textarea></div>
        `;
    // --- 2. 荒らし情報（種別選択） ---
    } else if (type === 'info') {
        title.innerText = `📝 荒らし情報の種別選択`;
        if (submitBtnArea) submitBtnArea.style.display = 'none';
        fields.innerHTML = `
            <div class="regist-menu-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px;">
                <div class="menu-card" onclick="setupInfoForm('user')"><div class="menu-icon">👤</div><h4>ユーザー</h4></div>
                <div class="menu-card" onclick="setupInfoForm('server')"><div class="menu-icon">🏠</div><h4>サーバー</h4></div>
                <div class="menu-card" onclick="setupInfoForm('bot')"><div class="menu-icon">🤖</div><h4>Bot</h4></div>
            </div>
        `;

    // --- 3. サーバー管理 ---
    } else if (type === 'server') {
        title.innerText = `📊 加入サーバー管理${modeText}`;
        fields.innerHTML = `
            <div class="form-group"><label>サーバー名</label><input type="text" id="sv-name" class="form-control" value="${editData?.server_name || ''}" required></div>
            <div class="form-group"><label>招待コード</label><input type="text" id="sv-code" class="form-control" value="${editData?.invite_code || ''}"></div>
            <div class="form-group"><label>オーナー(ユーザー名)</label><input type="text" id="sv-owner" class="form-control" value="${editData?.owner_name || ''}"></div>
        `;

    // --- 4. スタッフ管理 ---
    } else if (type === 'user') {
        title.innerText = `👥 スタッフ管理${modeText}`;
        const isUserAdmin = editData ? (editData.isAdmin || editData.is_admin === 1 || editData.role === 'admin') : false;
        fields.innerHTML = `
            <div class="form-group"><label>ユーザー名</label><input type="text" id="staff-username" class="form-control" value="${editData?.username || ''}" required></div>
            <div class="form-group"><label>パスワード${editData ? '(変更する場合)' : ''}</label><input type="password" id="staff-password" class="form-control" ${editData ? '' : 'required'}></div>
            <div class="form-group"><label>権限</label> 
                <select id="staff-role" class="form-control">
                    <option value="admin" ${isUserAdmin ? 'selected' : ''}>管理者</option>
                    <option value="staff" ${!isUserAdmin ? 'selected' : ''}>スタッフ</option>
                </select>
            </div>
        `;
    // --- 5. お知らせ登録 ---
    } else if (type === 'announcement') {
        title.innerText = `📢 お知らせ${modeText}`;
        if (typeof setupAnnouncementForm === 'function') {
            setupAnnouncementForm(editData);
        }
    }

    const form = document.getElementById('main-regist-form');
    if (form) {
        form.dataset.editId = editData?.id || editData?.USER_id || '';
        form.dataset.formType = type;
        form.onsubmit = handleFormSubmit;
    }
}

// 会議フィールドの表示切り替え
function toggleMeetingFields(val) {
    const meetingFields = document.getElementById('meeting-fields');
    if (meetingFields) {
        meetingFields.style.display = (val == "10") ? 'block' : 'none';
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const type = form.dataset.formType;
    const editId = form.dataset.editId;
    
    let apiPath = '', payload = {};

    try {
// --- スケジュール保存処理 ---
        if (type === 'schedule') {
            apiPath = '/schedules';
            payload = {
                date: document.getElementById('reg-date').value,
                employee_name: document.getElementById('reg-employee').value,
                status: parseInt(document.getElementById('reg-status').value),
                memo: document.getElementById('reg-memo')?.value || '',
                // 場所を省いた会議情報
                discus_st_time: document.getElementById('reg-discus-time')?.value || null,
                discus_info: document.getElementById('reg-discus-info')?.value || null
            };

        // --- 荒らし情報保存処理 ---
        } else if (type === 'info') {
            apiPath = '/trolls'; 
            const targetIdEl = document.getElementById('info-target-id');
            const targetNameEl = document.getElementById('info-target-name');

            if (!targetIdEl || !targetNameEl) {
                alert('種別を選択して入力フォームを完成させてください。');
                return;
            }

            // 安全なユーザー情報取得
            let loginUser = {};
            const storedUser = localStorage.getItem('loginUser');
            if (storedUser) {
                try { loginUser = JSON.parse(storedUser); } 
                catch (e) { loginUser = { username: storedUser, id: null }; }
            }

            payload = {
                category: form.dataset.infoCategory,
                target_id: targetIdEl.value,
                target_name: targetNameEl.value,
                reason: document.getElementById('info-detail').value,
                evidence_url: document.getElementById('info-evidence')?.value || null,
                invite_code: document.getElementById('info-invite-code')?.value || null,
                reporter_id: loginUser.id || loginUser.USER_id || loginUser.username || 'Unknown'
            };

        } else if (type === 'server') {
            apiPath = '/servers';
            payload = {
                server_name: document.getElementById('sv-name').value,
                invite_code: document.getElementById('sv-code').value,
                owner_name: document.getElementById('sv-owner').value
            };
        } else if (type === 'user') {
            apiPath = '/users';
            const role = document.getElementById('staff-role').value;
            payload = {
                username: document.getElementById('staff-username').value,
                isAdmin: role === 'admin',
                role: role
            };
            const pass = document.getElementById('staff-password').value;
            if (pass) payload.password = pass;
        } else if (type === 'announcement') {
            apiPath = '/announcements';
            const internalId = localStorage.getItem('internal_user_id');
            console.log("Announcement save attempt. userId:", internalId); // デバッグ用

            payload = {
                title: document.getElementById('ann-title').value,
                content: document.getElementById('ann-content').value,
                category: document.getElementById('ann-category').value,
                is_important: document.getElementById('ann-important').checked,
                userId: internalId ? parseInt(internalId) : null // 数値に変換して送信
            };
        }

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
            if (type === 'schedule' && typeof loadSchedules === 'function') { 
                loadSchedules(); 
                renderCalendarGrid(); 
            }
        } else {
            const err = await res.json();
            alert('❌ 保存失敗: ' + (err.message || res.statusText));
        }
    } catch (err) { 
        console.error('Save Error:', err);
        alert('❌ 保存に失敗しました。詳細はコンソールを確認してください。'); 
    }
}

function hideRegistForm() {
    const menu = document.getElementById('regist-menu-grid');
    const formArea = document.getElementById('regist-form-area');
    const fields = document.getElementById('dynamic-fields');

    if (menu) menu.style.display = 'grid';
    if (formArea) formArea.style.display = 'none';
    if (fields) fields.innerHTML = '';
}

function setupInfoForm(category) {
    const fields = document.getElementById('dynamic-fields');
    const title = document.getElementById('current-form-title');
    const form = document.getElementById('main-regist-form');
    const submitBtnArea = document.querySelector('.form-actions');

    const labels = { user: 'ユーザー', server: 'サーバー', bot: 'Bot' };
    title.innerText = `📝 荒らし情報登録 (${labels[category]})`;
    
    form.dataset.infoCategory = category;
    if (submitBtnArea) submitBtnArea.style.display = 'block';

    fields.innerHTML = `
        <div class="form-group"><label>${labels[category]} ID</label><input type="text" id="info-target-id" class="form-control" placeholder="Discord ID等" required></div>
        <div class="form-group"><label>名前 / 表示名</label><input type="text" id="info-target-name" class="form-control" placeholder="名前" required></div>
        ${category === 'server' ? `<div class="form-group"><label>招待コード</label><input type="text" id="info-invite-code" class="form-control" placeholder="https://discord.gg/..."></div>` : ''}
        <div class="form-group"><label>詳細・理由</label><textarea id="info-detail" class="form-control" rows="4" placeholder="行為の内容など" required></textarea></div>
        <div class="form-group"><label>証拠URL</label><input type="url" id="info-evidence" class="form-control" placeholder="https://..."></div>
    `;
}