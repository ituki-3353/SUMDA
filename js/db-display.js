/**
 * SUMDA - DB Display Controller (db-display.js)
 * データの描画とテーブル操作を担当
 */

const DBDisplay = {
    currentData: [],
    
    /**
     * テーブル本体にデータを描画する
     * @param {Array} data 表示するデータの配列
     */
    renderTable: function(data) {
        this.currentData = data;
        const body = document.getElementById('db-table-body');
        const thead = document.getElementById('db-table-thead');
        const countEl = document.getElementById('record-count');
        
        if (!body || !thead) return;

        const isAdmin = localStorage.getItem('isAdmin') === '1';

        // 操作カラムの動的追加 (既存をクリアまたはチェック)
        let headerRow = thead.querySelector('tr');
        if (headerRow && !headerRow.querySelector('.ops-column')) {
            const th = document.createElement('th');
            th.className = 'ops-column';
            th.innerText = '操作';
            headerRow.appendChild(th);
        }

        if (!data || data.length === 0) {
            const colCount = headerRow ? headerRow.cells.length : 10;
            body.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center; padding:20px; color:#999;">釣れた魚がいないのでボウズのようです....</td></tr>`;
            if (countEl) countEl.innerText = '0';
            return;
        }

        // ヘッダー（thead）からキーのリストを取得して、順番を合わせる
        const headers = Array.from(thead.querySelectorAll('th'))
                            .map(th => th.dataset.key)
                            .filter(key => key); // data-key 属性があるものだけ

        // データをループして行を生成
        body.innerHTML = data.map((item, index) => {
            let cells = '';
            if (headers.length > 0) {
                // ヘッダー指定がある場合はその順番で
                cells = headers.map(key => `<td>${this.formatValue(item[key], key)}</td>`).join('');
            } else {
                // 指定がない場合は全ての値
                cells = Object.values(item).map(val => `<td>${this.formatValue(val)}</td>`).join('');
            }

            // 操作ボタンの生成
            let ops = `<td class="ops-cell">
                <button type="button" class="btn-view" onclick="DBDisplay.viewRecord(${index})">参照</button>`;
            
            if (isAdmin) {
                ops += `
                    <button type="button" class="btn-edit" onclick="DBDisplay.editRecord(${index})">編集</button>
                    <button type="button" class="btn-delete-record" onclick="DBDisplay.deleteRecord(${index})">削除</button>`;
            }
            
            ops += `</td>`;

            return `<tr>${cells}${ops}</tr>`;
        }).join('');

        if (countEl) countEl.innerText = data.length;
    },

    /**
     * 値のフォーマット
     */
    formatValue: function(val, key) {
        if (val === null || val === undefined || val === '') return '-';

        // 種別（category）の日本語変換を追加
    if (key === 'category') {
        const labels = { user: '👤 ユーザー', server: '🏠 サーバー', bot: '🤖 Bot' };
        return labels[val] || val;
    }
        
        // ステータス等の装飾
        if (key === 'status' || val === 'online' || val === '加盟中' || val === 'active') {
            const statusClass = (val === 'online' || val === '加盟中' || val === 'active') ? 'status-online' : 'status-offline';
            return `<span class="status-badge ${statusClass}">${val}</span>`;
        }

        // 日時・時間形式データのフォーマット
        if (key === 'updated_at' || key === 'timestamp' || key === 'last_login' || key === 'date' || key === 'created_at') {
            const dateStr = typeof val === 'string' ? val.replace(' ', 'T') : val;
            const d = new Date(dateStr);

            if (!isNaN(d.getTime())) {
                const Y = d.getFullYear();
                const M = String(d.getMonth() + 1).padStart(2, '0');
                const D = String(d.getDate()).padStart(2, '0');
                const h = String(d.getHours()).padStart(2, '0');
                const m = String(d.getMinutes()).padStart(2, '0');
                const s = String(d.getSeconds()).padStart(2, '0');
                return `${Y}/${M}/${D} ${h}:${m}:${s}`;
            }
        }
        
        return val;
    },

    /**
     * 詳細表示 (一般ユーザー用)
     */
    viewRecord: function(index) {
        const item = this.currentData[index];
        if (!item) return;

        const modal = document.getElementById('detail-modal');
        const body = document.getElementById('modal-body');
        const title = document.getElementById('modal-title');

        if (!modal || !body) return;

        title.innerText = '📄 データ詳細照会';
        
        let html = '<div class="detail-grid">';
        for (const [key, value] of Object.entries(item)) {
            html += `
                <div class="detail-label">${key}</div>
                <div class="detail-value">${this.formatValue(value, key)}</div>
            `;
        }
        html += '</div>';

        body.innerHTML = html;
        modal.style.display = 'flex';
    },

    /**
     * 編集 (管理者用)
     */
    editRecord: function(index) {
        const item = this.currentData[index];
        if (!item) return;

        // 現在のビューからタイプを推測
        let type = 'info';
        const title = document.getElementById('current-form-title')?.innerText || '';
        
        if (title.includes('サーバー')) type = 'server';
        else if (title.includes('ユーザー') || title.includes('アカウント')) type = 'user';
        else if (title.includes('荒らし')) type = 'info';

        // 登録/編集タブに切り替え
        const registTab = document.querySelector('.tab-item[data-page="pages/regist.html"]');
        if (registTab) {
            // タブ切り替えイベントをシミュレート（loader.jsに依存）
            registTab.click();
            
            // フォームを開く (少し待機してページ読み込みを待つ)
            setTimeout(() => {
                if (typeof openForm === 'function') {
                    openForm(type, item);
                }
            }, 100);
        } else {
            alert('編集画面へ移動できませんでした。');
        }
    },

    /**
     * 削除 (管理者用)
     */
    deleteRecord: async function(index) {
        const item = this.currentData[index];
        if (!item) return;

        if (!confirm('このレコードを削除してもよろしいですか？\nこの操作は取り消せません。')) {
            return;
        }

        // タイプとIDの特定
        let apiPath = '';
        const title = document.getElementById('current-form-title')?.innerText || '';
        if (title.includes('サーバー')) apiPath = '/servers';
        else if (title.includes('ユーザー') || title.includes('アカウント')) apiPath = '/users';
        else if (title.includes('荒らし')) apiPath = '/trolls';
        else if (title.includes('履歴')) apiPath = '/history';

        // ユーザーテーブルの場合は USER_id を使用する
        const recordId = item.id || item.USER_id;

        if (!apiPath || !recordId) {
            alert('削除対象を特定できませんでした。');
            return;
        }

        try {
            const url = `${window.APP_CONFIG.API_BASE_URL}${apiPath}/${recordId}`;
            console.log('Attempting DELETE:', url);
            
            const res = await fetch(url, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert('✅ 削除しました');
                // 再読み込み
                if (typeof executeSearch === 'function') {
                    executeSearch(); 
                } else if (typeof initDatabaseView === 'function') {
                    // dataTypeの推測
                    const dataType = apiPath.replace('/', '').replace(/s$/, '');
                    initDatabaseView(dataType);
                }
            } else {
                let errorMsg = `Error ${res.status}: ${res.statusText}`;
                try {
                    const contentType = res.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        const err = await res.json();
                        errorMsg = err.message || errorMsg;
                    }
                } catch (jsonErr) {
                    console.error('Error parsing error JSON:', jsonErr);
                }
                alert('❌ 削除失敗: ' + errorMsg);
            }
        } catch (e) {
            console.error('Delete Error:', e);
            alert('❌ 削除中に通信エラーが発生しました');
        }
    },

    closeModal: function() {
        const modal = document.getElementById('detail-modal');
        if (modal) modal.style.display = 'none';
    }
};

// モーダルの外側をクリックして閉じるのを無効化 (ユーザー要望: 戻るボタンのみ)
/*
window.addEventListener('click', (e) => {
    const modal = document.getElementById('detail-modal');
    if (e.target === modal) {
        DBDisplay.closeModal();
    }
});
*/
