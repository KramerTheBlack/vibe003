// Управление темой
function setTheme(theme) {
    document.body.className = '';
    document.body.classList.add('theme-' + theme);
    localStorage.setItem('editorTheme', theme);
    updateStatus('Тема изменена на ' + theme.toUpperCase());
}

// Загрузка сохранённой темы
function loadTheme() {
    const savedTheme = localStorage.getItem('editorTheme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme('rosneft');
    }
}

// Статус
function updateStatus(message) {
    document.getElementById('status').textContent = message;
    setTimeout(() => {
        document.getElementById('status').textContent = 'Готов';
    }, 3000);
}

// Сохранение документа
async function saveDocument() {
    const content = document.getElementById('editor').value;
    const filename = document.getElementById('filename').value || 'document.txt';
    
    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: content,
                filename: filename
            })
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            updateStatus('Файл сохранён: ' + data.filepath);
        } else {
            updateStatus('Ошибка сохранения');
        }
    } catch (error) {
        updateStatus('Ошибка соединения');
        console.error('Error:', error);
    }
}

// Загрузка списка файлов
async function loadFileList() {
    try {
        const response = await fetch('/api/list');
        const data = await response.json();
        return data.files || [];
    } catch (error) {
        console.error('Error loading file list:', error);
        return [];
    }
}

// Открытие модального окна загрузки
async function loadDocument() {
    const files = await loadFileList();
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    
    if (files.length === 0) {
        fileList.innerHTML = '<p>Нет сохранённых файлов</p>';
    } else {
        files.forEach(filename => {
            const div = document.createElement('div');
            div.className = 'file-item';
            div.textContent = filename;
            div.onclick = () => loadFile(filename);
            fileList.appendChild(div);
        });
    }
    
    document.getElementById('loadModal').style.display = 'flex';
}

// Загрузка конкретного файла
async function loadFile(filename) {
    try {
        const response = await fetch('/api/load?filename=' + encodeURIComponent(filename));
        const data = await response.json();
        
        if (data.content !== undefined) {
            document.getElementById('editor').value = data.content;
            document.getElementById('filename').value = data.filename;
            updateStatus('Файл загружен: ' + data.filename);
        }
    } catch (error) {
        updateStatus('Ошибка загрузки');
        console.error('Error:', error);
    }
    
    closeModal();
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('loadModal').style.display = 'none';
}

// Новый документ
function newDocument() {
    document.getElementById('editor').value = '';
    document.getElementById('filename').value = 'document.txt';
    updateStatus('Создан новый документ');
}

// Закрытие модального окна по клику вне его
window.onclick = function(event) {
    const modal = document.getElementById('loadModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', loadTheme);

// Горячие клавиши
document.addEventListener('keydown', function(e) {
    // Ctrl+S - сохранить
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveDocument();
    }
    // Ctrl+N - новый документ
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        newDocument();
    }
});
