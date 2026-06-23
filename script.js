const loginForm = document.getElementById('loginForm');
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const loginMessage = document.getElementById('loginMessage');
const sessionInfo = document.getElementById('sessionInfo');
const userLabel = document.getElementById('userLabel');
const logoutBtn = document.getElementById('logoutBtn');

const surveyForm = document.getElementById('surveyForm');
const surveyTableBody = document.getElementById('surveyTableBody');
const fileInput = document.getElementById('fileInput');
const uploadMessage = document.getElementById('uploadMessage');

const totalCount = document.getElementById('totalCount');
const avgAge = document.getElementById('avgAge');
const avgScore = document.getElementById('avgScore');

const DEMO_USER = 'admin';
const DEMO_PASS = '123456';

let responses = [];

function setMessage(el, text, isError = false) {
  el.textContent = text;
  el.classList.remove('ok', 'error');
  if (text) {
    el.classList.add(isError ? 'error' : 'ok');
  }
}

function saveResponses() {
  localStorage.setItem('surveyResponses', JSON.stringify(responses));
}

function loadResponses() {
  try {
    const data = JSON.parse(localStorage.getItem('surveyResponses') || '[]');
    responses = Array.isArray(data) ? data : [];
  } catch {
    responses = [];
  }
}

function renderTable() {
  surveyTableBody.innerHTML = '';
  responses.forEach((r) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(r.name)}</td>
      <td>${Number(r.age) || ''}</td>
      <td>${escapeHtml(r.city)}</td>
      <td>${Number(r.score) || ''}</td>
      <td>${escapeHtml(r.comments || '')}</td>
    `;
    surveyTableBody.appendChild(row);
  });
}

function renderStats() {
  const count = responses.length;
  totalCount.textContent = count;

  if (!count) {
    avgAge.textContent = '0';
    avgScore.textContent = '0';
    return;
  }

  const ageSum = responses.reduce((acc, item) => acc + (Number(item.age) || 0), 0);
  const scoreSum = responses.reduce((acc, item) => acc + (Number(item.score) || 0), 0);

  avgAge.textContent = (ageSum / count).toFixed(1);
  avgScore.textContent = (scoreSum / count).toFixed(1);
}

function refresh() {
  renderTable();
  renderStats();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });
    return normalizeRow(row);
  });
}

function normalizeRow(row) {
  return {
    name: row.name || '',
    age: Number(row.age) || 0,
    city: row.city || '',
    score: Number(row.score) || 0,
    comments: row.comments || '',
  };
}

function validRow(row) {
  return row.name && row.city && row.age > 0 && row.score >= 1 && row.score <= 5;
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  if (user === DEMO_USER && pass === DEMO_PASS) {
    localStorage.setItem('sessionUser', user);
    openSession(user);
    setMessage(loginMessage, 'Ingreso exitoso');
  } else {
    setMessage(loginMessage, 'Credenciales inválidas', true);
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('sessionUser');
  closeSession();
});

surveyForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = normalizeRow({
    name: document.getElementById('name').value.trim(),
    age: document.getElementById('age').value.trim(),
    city: document.getElementById('city').value.trim(),
    score: document.getElementById('score').value.trim(),
    comments: document.getElementById('comments').value.trim(),
  });

  if (!validRow(data)) {
    setMessage(uploadMessage, 'Revisa los campos del formulario (edad y satisfacción válidas)', true);
    return;
  }

  responses.push(data);
  saveResponses();
  refresh();
  surveyForm.reset();
  setMessage(uploadMessage, 'Respuesta guardada correctamente');
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const text = await file.text();
  let loadedRows = [];

  try {
    if (file.name.toLowerCase().endsWith('.json')) {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('JSON no es un arreglo');
      loadedRows = parsed.map(normalizeRow);
    } else if (file.name.toLowerCase().endsWith('.csv')) {
      loadedRows = parseCsv(text);
    } else {
      throw new Error('Formato no soportado');
    }
  } catch (error) {
    setMessage(uploadMessage, `Error al procesar archivo: ${error.message}`, true);
    return;
  }

  const validRows = loadedRows.filter(validRow);
  responses = [...responses, ...validRows];
  saveResponses();
  refresh();

  setMessage(uploadMessage, `Se cargaron ${validRows.length} registros válidos de ${loadedRows.length}`);
  fileInput.value = '';
});

function openSession(user) {
  userLabel.textContent = `Sesión: ${user}`;
  sessionInfo.classList.remove('hidden');
  loginSection.classList.add('hidden');
  appSection.classList.remove('hidden');
}

function closeSession() {
  sessionInfo.classList.add('hidden');
  loginSection.classList.remove('hidden');
  appSection.classList.add('hidden');
  setMessage(loginMessage, '');
}

(function init() {
  loadResponses();
  refresh();
  const sessionUser = localStorage.getItem('sessionUser');
  if (sessionUser) openSession(sessionUser);
})();
