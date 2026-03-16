/*
 * Version0.4
 * SUMDAシステム
 */
// 種別選択のフロート（モーダル）を表示する
function showTypeSelection() {
    document.getElementById('type-selection-modal').style.display = 'flex';
}

// 選択された種別に応じてフォームを切り替える
function selectType(type) {
    // モーダルを閉じる
    document.getElementById('type-selection-modal').style.display = 'none';
    
    // 全フォームを一旦非表示に
    const forms = document.querySelectorAll('.registration-form');
    forms.forEach(f => f.style.display = 'none');

    // 選んだ種別のフォームを表示
    const targetForm = document.getElementById(`form-${type}`);
    if (targetForm) {
        targetForm.style.display = 'block';
        targetForm.dataset.type = type; // 送信時に判別するため
    }
}

// 送信処理
async function handleReportSubmit(event, type) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    // 種別情報を追加
    data.category = type; 

    try {
        const res = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            alert('登録が完了しました');
            location.reload();
        }
    } catch (err) {
        console.error('送信エラー:', err);
    }
}