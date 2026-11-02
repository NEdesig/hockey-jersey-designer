const canvas = document.getElementById('designCanvas');
const ctx = canvas.getContext('2d');

// Устанавливаем логический размер канваса
canvas.width = 800;
canvas.height = 800;

// Состояние дизайна
let state = {
    bodyColor: '#f28c28',
    stripeColor: '#ffffff',
    pattern: 'solid',
    playerName: 'PLAYER',
    playerNumber: '97',
    elements: [] // Массив для логотипов и текста, которые можно двигать
};

// --- БАЗОВАЯ ОТРИСОВКА ---

function drawJersey() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовка свитера (упрощенная 2D форма)
    ctx.fillStyle = state.bodyColor;
    ctx.beginPath();
    // Основа (торс)
    ctx.roundRect(200, 150, 400, 500, 40); 
    // Рукава
    ctx.roundRect(100, 180, 120, 200, 40);
    ctx.roundRect(580, 180, 120, 200, 40);
    ctx.fill();

    // Воротник
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(400, 150, 70, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Узоры
    if (state.pattern === 'stripes') {
        ctx.fillStyle = state.stripeColor;
        ctx.fillRect(200, 400, 400, 40); // Пояс
        ctx.fillRect(200, 220, 400, 20); // Грудь
    } else if (state.pattern === 'shoulders') {
        ctx.fillStyle = state.stripeColor;
        ctx.fillRect(100, 180, 120, 80); // Плечо левое
        ctx.fillRect(580, 180, 120, 80); // Плечо правое
        ctx.fillRect(200, 150, 400, 80); // Верх торса
    }

    // Отрисовка шорт (снизу)
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.roundRect(250, 650, 300, 150, 20);
    ctx.fill();
    
    // Отрисовка гетр (справа)
    ctx.fillStyle = state.bodyColor;
    ctx.beginPath();
    ctx.roundRect(600, 650, 60, 150, 10);
    ctx.roundRect(680, 650, 60, 150, 10);
    ctx.fill();
    
    // Полоски на гетрах
    ctx.fillStyle = state.stripeColor;
    ctx.fillRect(600, 700, 60, 20);
    ctx.fillRect(680, 700, 60, 20);

    // Отрисовка динамических элементов (лого, текст)
    state.elements.forEach(el => {
        ctx.save();
        if (el.type === 'image') {
            ctx.drawImage(el.img, el.x, el.y, el.width, el.height);
        } else if (el.type === 'text') {
            ctx.fillStyle = el.color;
            ctx.font = `bold ${el.size}px 'Stapel', sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(el.text, el.x, el.y);
        }
        // Рамка вокруг активного элемента (для удобства)
        if (el.isDragging) {
            ctx.strokeStyle = '#6c5ce7';
            ctx.lineWidth = 2;
            ctx.strokeRect(el.x - 5, el.y - 5, el.width || ctx.measureText(el.text).width + 10, el.height || el.size + 10);
        }
        ctx.restore();
    });
}

// --- ЛОГИКА ИНТЕРФЕЙСА ---

// Переключение вкладок
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
});

// Изменение цвета корпуса (через ползунок оттенка)
document.getElementById('hue-slider').addEventListener('input', (e) => {
    const hue = e.target.value;
    state.bodyColor = `hsl(${hue}, 80%, 50%)`;
    document.getElementById('body-color').value = rgbToHex(state.bodyColor); // Синхронизация
    drawJersey();
});

// Изменение цвета через пипетку
document.getElementById('body-color').addEventListener('input', (e) => {
    state.bodyColor = e.target.value;
    drawJersey();
});

document.getElementById('stripe-color').addEventListener('input', (e) => {
    state.stripeColor = e.target.value;
    drawJersey();
});

// Изменение узора
function changePattern(type) {
    state.pattern = type;
    drawJersey();
}

// Загрузка логотипа
document.getElementById('logo-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Добавляем лого в центр груди
                state.elements.push({
                    type: 'image',
                    img: img,
                    x: 350,
                    y: 300,
                    width: 100,
                    height: 100,
                    isDragging: false
                });
                drawJersey();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Обновление текста (Имя и номер)
function updateText() {
    const name = document.getElementById('player-name').value.toUpperCase();
    const num = document.getElementById('player-number').value;
    
    // Удаляем старый текст
    state.elements = state.elements.filter(el => el.type !== 'text');

    if (name) {
        state.elements.push({
            type: 'text',
            text: name,
            x: 400,
            y: 250,
            size: 40,
            color: '#ffffff',
            isDragging: false
        });
    }
    if (num) {
        state.elements.push({
            type: 'text',
            text: num,
            x: 400,
            y: 550,
            size: 100,
            color: '#ffffff',
            isDragging: false
        });
    }
    drawJersey();
}

// --- ПЕРЕТАСКИВАНИЕ ЭЛЕМЕНТОВ (Мышь и Тач) ---

let activeElement = null;
let offsetX = 0;
let offsetY = 0;

function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX = evt.clientX;
    let clientY = evt.clientY;

    if (evt.touches && evt.touches.length > 0) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
    }

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function startDrag(e) {
    const pos = getMousePos(e);
    // Ищем элемент сверху вниз (последний добавленный)
    for (let i = state.elements.length - 1; i >= 0; i--) {
        const el = state.elements[i];
        let hit = false;
        
        if (el.type === 'image') {
            hit = pos.x >= el.x && pos.x <= el.x + el.width && pos.y >= el.y && pos.y <= el.y + el.height;
        } else if (el.type === 'text') {
            ctx.font = `bold ${el.size}px 'Stapel', sans-serif`;
            const width = ctx.measureText(el.text).width;
            hit = pos.x >= el.x - width/2 && pos.x <= el.x + width/2 && pos.y >= el.y - el.size && pos.y <= el.y + 10;
        }

        if (hit) {
            activeElement = el;
            el.isDragging = true;
            offsetX = pos.x - el.x;
            offsetY = pos.y - el.y;
            
            // Перемещаем элемент в конец массива, чтобы он был поверх
            state.elements.splice(i, 1);
            state.elements.push(el);
            break;
        }
    }
    drawJersey();
}

function drag(e) {
    if (activeElement) {
        e.preventDefault(); // Предотвращаем скролл на мобильных
        const pos = getMousePos(e);
        activeElement.x = pos.x - offsetX;
        activeElement.y = pos.y - offsetY;
        drawJersey();
    }
}

function endDrag() {
    if (activeElement) {
        activeElement.isDragging = false;
        activeElement = null;
        drawJersey();
    }
}

canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', drag);
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('mouseleave', endDrag);

canvas.addEventListener('touchstart', startDrag, {passive: false});
canvas.addEventListener('touchmove', drag, {passive: false});
canvas.addEventListener('touchend', endDrag);

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

// Сохранение в PNG
function saveDesign() {
    const link = document.createElement('a');
    link.download = 'hockey_design.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Конвертация HSL в HEX для инпута цвета (упрощенно)
function rgbToHex(hslStr) {
    // Это упрощенная заглушка, так как браузеры сами конвертируют hsl в input color,
    // но для точной синхронизации лучше использовать canvas или специализированные функции.
    // В данном демо достаточно того, что input type="color" принимает hex, 
    // а мы передаем hsl в canvas.
    return '#f28c28'; 
}

// Инициализация
function init() {
    // Полифилл для roundRect, если браузер старый
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.beginPath();
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            this.closePath();
            return this;
        };
    }
    
    drawJersey();
}

init();
