/**
 * SUMDA - Search Controller (search.js)
 */
let currentDBData = [];

async function initDatabaseView(type) {
    let apiPath = '';
    switch (type) {
        case 'server':  apiPath = '/servers'; break;
        case 'troll':   apiPath = '/trolls'; break;
        case 'user':    apiPath = '/users'; break;
        case 'history': apiPath = '/history'; break;
        default: 
            console.error("Unknown data type:", type);
            return;
    }

    try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}${apiPath}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        currentDBData = await res.json();
        
        // 表示担当に丸投げ！
        DBDisplay.renderTable(currentDBData);
    } catch (e) {
        console.error("Data fetch failed:", e);
        const body = document.getElementById('db-table-body');
        if (body) body.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:20px; color:red;">データの取得に失敗しました。</td></tr>`;
    }
}

function executeSearch() {
    const queryInput = document.getElementById('db-search-input');
    if (!queryInput) return;
    
    const query = queryInput.value.toLowerCase();
    const filtered = currentDBData.filter(item => 
        Object.values(item).some(val => String(val).toLowerCase().includes(query))
    );
    
    // 検索後も表示担当に丸投げ！
    DBDisplay.renderTable(filtered);
}