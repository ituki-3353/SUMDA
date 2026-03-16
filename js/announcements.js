/*
 * Version0.4
 * SUMDAシステム
 */
/**
 * SUMDA - Announcements Controller
 */

const Announcements = {
    /**
     * お知らせ一覧を取得して表示する
     */
    async fetchAll() {
        // 表示時に既読時間を更新
        localStorage.setItem('last_announcement_check', new Date().toISOString());
        this.updateBadge(0);

        const container = document.getElementById('info-list-container');
        if (!container) return;

        container.innerHTML = '<div style="padding:20px; color:#666;">読み込み中...</div>';

        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/announcements`);
            if (!response.ok) throw new Error('お知らせの取得に失敗しました');

            const data = await response.json();
            this.renderList(data);
        } catch (error) {
            console.error('Fetch announcements error:', error);
            container.innerHTML = `<div style="padding:20px; color:red;">エラー: ${error.message}</div>`;
        }
    },

    /**
     * 新着お知らせをチェックしてバッジとポップアップを表示
     */
    async checkNew(isInitialLogin = false) {
        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/announcements`);
            if (!response.ok) return;

            const items = await response.json();
            if (!items || items.length === 0) return;

            const lastCheck = localStorage.getItem('last_announcement_check');
            const lastCheckDate = lastCheck ? new Date(lastCheck) : new Date(0);

            // 最終確認日時より後に作成されたお知らせを「新着」とする
            const newItems = items.filter(item => new Date(item.created_at) > lastCheckDate);

            if (newItems.length > 0) {
                this.updateBadge(newItems.length);

                // ログイン直後のみポップアップ表示
                if (isInitialLogin) {
                    this.showPopup(newItems.length);
                }
            }
        } catch (e) {
            console.error('Check new announcements failed:', e);
        }
    },

    updateBadge(count) {
        const badge = document.getElementById('announcement-badge');
        if (!badge) return;

        if (count > 0) {
            badge.innerText = count > 9 ? '9+' : count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    },

    showPopup(count) {
        const modal = document.getElementById('detail-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const footer = document.querySelector('.modal-footer');

        if (!modal || !title || !body || !footer) return;

        title.innerText = "📢 新着お知らせ通知";

        body.innerHTML = `
            <div style="padding: 30px 10px; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 20px;">✉️</div>
                <p style="font-size: 1.2rem; color: #1a1a1a; margin-bottom: 10px; font-weight: 500;">
                    新規お知らせが <span style="color: #cf222e; font-size: 1.5rem; font-weight: bold;">${count}</span> 件あります。
                </p>
                <p style="color: #57606a;">
                    上部メニューの「お知らせ」タブよりご確認ください。
                </p>
            </div>
        `;

        // フッターを「OK」ボタンのみに変更
        footer.innerHTML = `
            <button type="button" class="btn-submit" style="width: 120px; margin: 0 auto; display: block;" onclick="DBDisplay.closeModal()">OK</button>
        `;

        modal.style.display = 'flex';
    },

    /**
     * リストをレンダリングする
     */
    renderList(items) {
        const container = document.getElementById('info-list-container');
        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = '<div style="padding:20px; color:#666;">現在お知らせはありません。</div>';
            return;
        }

        const isAdmin = localStorage.getItem('isAdmin') === '1';

        container.innerHTML = items.map((item, index) => {
            const date = new Date(item.created_at).toLocaleDateString('ja-JP');
            const tagClass = this.getTagClass(item.category);
            const tagName = this.getTagName(item.category);
            const importantBadge = item.is_important ? '<span class="info-tag tag-important">重要</span>' : '';

            // 管理者用操作ボタン（!important で色を確実に適用）
            let adminOps = '';
            if (isAdmin) {
                adminOps = `
                    <div class="info-admin-ops">
                        <button class="btn-edit" style="color: white !important;" onclick="Announcements.editAnnouncement(${index})">編集</button>
                        <button class="btn-delete-record" style="color: white !important;" onclick="Announcements.deleteAnnouncement(${item.id})">削除</button>
                    </div>
                `;
            }

            return `
                <div class="info-item ${item.is_important ? 'important-border' : ''}">
                    <div class="info-meta">
                        ${importantBadge}
                        <span class="info-tag ${tagClass}">${tagName}</span>
                        <span class="info-date">${date}</span>
                        ${adminOps}
                    </div>
                    <div class="info-body">
                        <h4 class="info-title">${this.escapeHtml(item.title)}</h4>
                        <p>${this.escapeHtml(item.content).replace(/
/g, '<br>')}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        // データを保持しておく（編集用）
        this.lastData = items;
    },

    /**
     * お知らせの編集
     */
    editAnnouncement(index) {
        const item = this.lastData[index];
        if (!item) return;

        const registTab = document.querySelector('.tab-item[data-page="pages/regist.html"]');
        if (registTab) {
            registTab.click();
            // 登録ページがロードされるのを待ってからフォームを開く
            setTimeout(() => {
                if (typeof openForm === 'function') {
                    openForm('announcement', item);
                }
            }, 100);
        }
    },

    /**
     * お知らせの削除
     */
    async deleteAnnouncement(id) {
        if (!confirm('このお知らせを削除してもよろしいですか？')) return;

        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/announcements/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: localStorage.getItem('internal_user_id') // 認証用に USER_id を送信
                })
            });

            if (response.ok) {
                alert('✅ 削除しました');
                this.fetchAll(); // 再読み込み
            } else {
                const err = await response.json();
                alert('❌ 削除失敗: ' + (err.message || 'サーバーエラー'));
            }
        } catch (e) {
            console.error('Delete announcement error:', e);
            alert('❌ 通信エラーが発生しました');
        }
    },

    getTagClass(category) {
        switch (category) {
            case 'new': return 'tag-new';
            case 'update': return 'tag-update';
            case 'maintenance': return 'tag-maintenance';
            default: return 'tag-info';
        }
    },

    getTagName(category) {
        switch (category) {
            case 'new': return 'NEW';
            case 'update': return 'UPDATE';
            case 'maintenance': return 'MAINTENANCE';
            default: return 'INFO';
        }
    },

    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};

/**
 * お知らせ登録フォームの初期化 (forms.js から呼ばれる想定)
 */
function setupAnnouncementForm(editData = null) {
    const fields = document.getElementById('dynamic-fields');
    if (!fields) return;

    fields.innerHTML = `
        <div class="form-group">
            <label>タイトル</label>
            <input type="text" id="ann-title" class="form-control" placeholder="お知らせのタイトル" required value="${editData?.title || ''}">
        </div>
        <div class="form-group">
            <label>カテゴリー</label>
            <select id="ann-category" class="form-control">
                <option value="info" ${editData?.category === 'info' ? 'selected' : ''}>一般 (INFO)</option>
                <option value="new" ${editData?.category === 'new' ? 'selected' : ''}>新機能 (NEW)</option>
                <option value="update" ${editData?.category === 'update' ? 'selected' : ''}>更新 (UPDATE)</option>
                <option value="maintenance" ${editData?.category === 'maintenance' ? 'selected' : ''}>メンテナンス (MAINTENANCE)</option>
            </select>
        </div>
        <div class="form-group">
            <label>重要度</label>
            <div style="display:flex; align-items:center; gap:10px; margin-top:5px;">
                <input type="checkbox" id="ann-important" ${editData?.is_important ? 'checked' : ''} style="width:20px; height:20px;">
                <span>重要なお知らせとして強調表示する</span>
            </div>
        </div>
        <div class="form-group">
            <label>内容</label>
            <textarea id="ann-content" class="form-control" rows="6" placeholder="お知らせの詳細内容" required>${editData?.content || ''}</textarea>
        </div>
    `;
}
