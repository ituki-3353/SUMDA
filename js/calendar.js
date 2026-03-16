/*
 * Version0.4
 * SUMDAシステム
 */
/**
 * SUMDA - Calendar & Schedule Controller
 */

/**
 * ステータス数値からラベルとCSSクラスを返す
 */
function getStatusConfig(n) {
    const statusNum = Number(n);
    const configs = { 
        0: { label: "✅ 対応可能", class: "badge-ok" }, 
        1: { label: "🟦 午前のみ", class: "badge-morning" },
        2: { label: "🟨 午後のみ", class: "badge-afternoon" },
        3: { label: "⬜️ 深夜のみ", class: "badge-midnight" },
        4: { label: "❌ 対応不可", class: "badge-ng" } ,
        10: { label: "📆 会議予定", class: "badge-discus" } 
    };
    return configs[statusNum] || { label: "取得できません。", class: "badge-default" };
}

/**
 * スケジュールリスト（表形式）の読み込み
 */
async function loadSchedules() {
    const listEl = document.getElementById('schedule-list');
    if (!listEl) return;

    const today = new Date();
    const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/schedules`);
        const data = await res.json();
        
        listEl.innerHTML = '';

        data.forEach(item => {
            const d = new Date(item.date);
            const itemTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

            if (itemTime >= todayReset) {
                const tr = document.createElement('tr');
                if (itemTime === todayReset) {
                    tr.style.backgroundColor = '#fff9e6';
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

        if (listEl.innerHTML === '') {
            listEl.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">今日以降の予定はありません。</td></tr>';
        }
    } catch (e) {
        console.warn('リストの読み込みに失敗しました:', e);
    }
}

/**
 * カレンダーグリッド（マス目）の生成
 */
async function renderCalendarGrid() {
    const gridEl = document.getElementById('calendar-days');
    if (!gridEl) return;

    gridEl.innerHTML = ''; 

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    // 表示対象（現在は2026年3月固定）
    const year = 2026;
    const month = 2; // 3月
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day-cell empty';
        gridEl.appendChild(empty);
    }

    for (let d = 1; d <= lastDate; d++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell';
        if (year === todayYear && month === todayMonth && d === todayDate) {
            cell.classList.add('today-highlight');
        }
        cell.innerHTML = `
            <span class="day-number">${d}</span>
            <div id="grid-day-${d}" class="day-content"></div>
        `;
        gridEl.appendChild(cell);
    }

    try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/schedules`);
        const data = await res.json();
        const todayReset = new Date(todayYear, todayMonth, todayDate).getTime();

        data.forEach(item => {
            const dObj = new Date(item.date);
            const itemTime = new Date(dObj.getFullYear(), dObj.getMonth(), dObj.getDate()).getTime();

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
        console.warn('グリッドデータの読み込みに失敗しました');
    }
}

/**
 * カレンダースイッチの初期化
 */
function initCalendarToggles() {
    const btnGrid = document.getElementById('view-grid');
    const btnList = document.getElementById('view-list');
    if (btnGrid) btnGrid.onclick = () => switchView('grid');
    if (btnList) btnList.onclick = () => switchView('list');
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
        btnGrid?.classList.add('active');
        btnList?.classList.remove('active');
        renderCalendarGrid();
    } else {
        if (gridContainer) gridContainer.style.display = 'none';
        if (listContainer) listContainer.style.display = 'block';
        btnList?.classList.add('active');
        btnGrid?.classList.remove('active');
        loadSchedules();
    }
}

async function deleteSchedule(id) {
    if (!confirm('削除しますか？')) return;
    try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/schedules/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadSchedules(); 
            renderCalendarGrid();
        }
    } catch (e) {
        console.error('Delete Error:', e);
    }
}