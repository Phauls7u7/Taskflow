// Registro del Service Worker para funcionamiento Offline e instalable
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Error al registrar Service Worker:', err);
    });
  });
}

// Captura de evento de instalación nativa de Chrome
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const container = document.getElementById('native-install-container');
  if (container) container.style.display = 'block';
});

async function triggerNativeInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    showToast('Instalando aplicación...');
  }
  deferredPrompt = null;
  closeInstallModal();
}

// Estado de la aplicación y persistencia en localStorage
const STORAGE_KEY = 'taskflow_pwa_items_v1';
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let selectedCategory = 'General';
let currentFilter = 'Todas';

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  renderAll();
}

// Navegación entre los 3 apartados
function switchTab(sectionId, btnEl) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if (btnEl) {
    btnEl.classList.add('active');
  } else {
    const targetBtn = document.querySelector(`.nav-item[data-target="${sectionId}"]`);
    if (targetBtn) targetBtn.classList.add('active');
  }
}

// Selección de categoría en formulario
document.querySelectorAll('#category-selector .cat-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('#category-selector .cat-pill').forEach(p => p.classList.remove('selected'));
    pill.classList.add('selected');
    selectedCategory = pill.dataset.cat;
  });
});

// Selección de filtro en Pendientes
document.querySelectorAll('#filter-bar .cat-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('#filter-bar .cat-pill').forEach(p => p.classList.remove('selected'));
    pill.classList.add('selected');
    currentFilter = pill.dataset.filter;
    renderAll();
  });
});

// Guardar o editar nota
document.getElementById('note-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const titleInput = document.getElementById('note-title');
  const descInput = document.getElementById('note-desc');
  const editId = document.getElementById('edit-id').value;

  const title = titleInput.value.trim();
  const desc = descInput.value.trim();
  if (!title) return;

  if (editId) {
    const idx = tasks.findIndex(t => t.id === editId);
    if (idx !== -1) {
      tasks[idx].title = title;
      tasks[idx].desc = desc;
      tasks[idx].category = selectedCategory;
      showToast('Nota actualizada');
    }
  } else {
    tasks.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title,
      desc,
      category: selectedCategory,
      done: false,
      createdAt: new Date().toLocaleString('es-SV', { dateStyle: 'short', timeStyle: 'short' })
    });
    showToast('Agregada a pendientes');
  }

  resetForm();
  saveTasks();
  switchTab('sec-pending');
});

function resetForm() {
  document.getElementById('note-form').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('form-mode-badge').textContent = 'Nueva';
  document.getElementById('submit-btn-text').textContent = 'Guardar en Pendientes';
  document.getElementById('cancel-edit-btn').style.display = 'none';
  selectedCategory = 'General';
  document.querySelectorAll('#category-selector .cat-pill').forEach(p => {
    p.classList.toggle('selected', p.dataset.cat === 'General');
  });
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  document.getElementById('edit-id').value = task.id;
  document.getElementById('note-title').value = task.title;
  document.getElementById('note-desc').value = task.desc || '';
  selectedCategory = task.category || 'General';

  document.querySelectorAll('#category-selector .cat-pill').forEach(p => {
    p.classList.toggle('selected', p.dataset.cat === selectedCategory);
  });

  document.getElementById('form-mode-badge').textContent = 'Editando';
  document.getElementById('submit-btn-text').textContent = 'Guardar cambios';
  document.getElementById('cancel-edit-btn').style.display = 'block';
  switchTab('sec-add');
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  task.completedAt = task.done
    ? new Date().toLocaleString('es-SV', { dateStyle: 'short', timeStyle: 'short' })
    : null;
  saveTasks();
  showToast(task.done ? 'Movida a cosas ya hechas' : 'Devuelta a pendientes');
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  showToast('Nota eliminada');
}

function clearAllDone() {
  tasks = tasks.filter(t => !t.done);
  saveTasks();
  showToast('Historial de hechas limpiado');
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function createTaskElement(task) {
  const div = document.createElement('div');
  div.className = 'task-item' + (task.done ? ' done' : '');
  div.innerHTML = `
    <button class="check-btn" title="${task.done ? 'Desmarcar' : 'Marcar como hecha'}" onclick="toggleTask('${task.id}')">
      ${task.done ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
    </button>
    <div class="task-content">
      <div class="task-title">${escapeHTML(task.title)}</div>
      ${task.desc ? `<div class="task-desc">${escapeHTML(task.desc)}</div>` : ''}
      <div class="task-meta">
        <span class="tag">${escapeHTML(task.category || 'General')}</span>
        <span>${task.done && task.completedAt ? 'Hecha: ' + task.completedAt : 'Creada: ' + task.createdAt}</span>
      </div>
    </div>
    <div class="task-actions">
      ${!task.done ? `
        <button class="mini-btn edit" title="Editar" onclick="editTask('${task.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
      ` : ''}
      <button class="mini-btn delete" title="Eliminar" onclick="deleteTask('${task.id}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;
  return div;
}

function renderAll() {
  const pendingAll = tasks.filter(t => !t.done);
  const doneAll = tasks.filter(t => t.done);

  // Actualizar contadores
  document.getElementById('pending-count-badge').textContent = pendingAll.length;
  const navPending = document.getElementById('nav-pending-badge');
  navPending.textContent = pendingAll.length;
  navPending.style.display = pendingAll.length > 0 ? 'inline-block' : 'none';

  const navDone = document.getElementById('nav-done-badge');
  navDone.textContent = doneAll.length;
  navDone.style.display = doneAll.length > 0 ? 'inline-block' : 'none';

  document.getElementById('clear-done-btn').style.display = doneAll.length > 0 ? 'inline-block' : 'none';

  // Render Pendientes
  const pendingContainer = document.getElementById('pending-list');
  pendingContainer.innerHTML = '';
  const filteredPending = currentFilter === 'Todas'
    ? pendingAll
    : pendingAll.filter(t => t.category === currentFilter);

  if (filteredPending.length === 0) {
    pendingContainer.innerHTML = `
      <div class="empty-state">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        <p>No hay tareas pendientes en esta vista.</p>
      </div>`;
  } else {
    filteredPending.forEach(t => pendingContainer.appendChild(createTaskElement(t)));
  }

  // Render Hechas
  const doneContainer = document.getElementById('done-list');
  doneContainer.innerHTML = '';
  if (doneAll.length === 0) {
    doneContainer.innerHTML = `
      <div class="empty-state">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="16 10 11 15 8 12"></polyline>
        </svg>
        <p>Aún no has completado ninguna nota o tarea.</p>
      </div>`;
  } else {
    doneAll.forEach(t => doneContainer.appendChild(createTaskElement(t)));
  }
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function openInstallModal() {
  document.getElementById('install-modal').classList.add('open');
}

function closeInstallModal() {
  document.getElementById('install-modal').classList.remove('open');
}

// Inicializar vista
renderAll();
