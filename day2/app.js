// App State
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let filter = 'all';

// DOM Elements
const form = document.getElementById('add-form');
const input = document.getElementById('todo-input');
const timerInput = document.getElementById('timer-input');
const todoList = document.getElementById('todo-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const toast = document.getElementById('notification-toast');
const enableNotifBtn = document.getElementById('enable-notif');

// Check Notifications Permission
function checkNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        toast.classList.remove('hidden');
    }
}

enableNotifBtn.addEventListener('click', () => {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            toast.classList.add('hidden');
        }
    });
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.error('SW reg fail:', err));
    });
}

// Render Todos
function render() {
    todoList.innerHTML = '';
    
    let filtered = todos;
    if (filter === 'active') filtered = todos.filter(t => !t.done);
    if (filter === 'done') filtered = todos.filter(t => t.done);

    filtered.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.done ? 'done' : ''}`;
        
        let timerText = '';
        if (todo.timerTime && !todo.done) {
            const timeLeft = Math.max(0, Math.ceil((todo.timerTime - Date.now()) / 60000));
            if (timeLeft > 0) {
                timerText = `<div class="todo-timer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    ${timeLeft}m left
                </div>`;
            }
        }

        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.done ? 'checked' : ''} onchange="toggleDone('${todo.id}')">
            <div class="todo-content">
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                ${timerText}
            </div>
            <div class="todo-actions">
                <button class="icon-btn delete" onclick="deleteTodo('${todo.id}')" aria-label="Delete">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;
        todoList.appendChild(li);
    });

    localStorage.setItem('todos', JSON.stringify(todos));
}

// Add Todo
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const mins = parseInt(timerInput.value);
    const newTodo = {
        id: Date.now().toString(),
        text,
        done: false,
        timerTime: mins > 0 ? Date.now() + mins * 60000 : null
    };

    todos.push(newTodo);
    input.value = '';
    timerInput.value = '';

    if (newTodo.timerTime) {
        scheduleNotification(newTodo.text, mins * 60000);
    }

    render();
});

// Toggle Done
window.toggleDone = (id) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.done = !todo.done;
        render();
    }
};

// Delete Todo
window.deleteTodo = (id) => {
    todos = todos.filter(t => t.id !== id);
    render();
};

// Schedule Notification
function scheduleNotification(title, delayMs) {
    if ('Notification' in window && Notification.permission === 'granted') {
        setTimeout(() => {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('Task Reminder', {
                    body: title,
                    icon: 'icon.svg',
                    vibrate: [200, 100, 200]
                });
            }).catch(() => {
                // Fallback if SW not ready
                new Notification('Task Reminder', { body: title, icon: 'icon.svg' });
            });
        }, delayMs);
    }
}

// Filters
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filter = btn.dataset.filter;
        render();
    });
});

// Utils
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Initial render
checkNotificationPermission();
render();

// Update timers every minute
setInterval(render, 60000);
