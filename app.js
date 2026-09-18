const STORAGE_KEY = 'blood-pressure-records';
const THEME_KEY = 'blood-pressure-theme';

const form = document.getElementById('blood-form');
const recordList = document.getElementById('record-list');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');
const latestPressure = document.getElementById('latest-pressure');
const latestStatus = document.getElementById('latest-status');
const latestTime = document.getElementById('latest-time');
const weeklyCount = document.getElementById('weekly-count');
const averagePulse = document.getElementById('average-pulse');
const recordCount = document.getElementById('record-count');
const todayDate = document.getElementById('today-date');
const exportButton = document.getElementById('export-btn');
const clearButton = document.getElementById('clear-btn');

const RANGES = {
  systolic: { min: 60, max: 250, label: '收縮壓' },
  diastolic: { min: 30, max: 150, label: '舒張壓' },
  pulse: { min: 30, max: 220, label: '脈搏' },
};

const getTheme = () => {
  const savedTheme = localStorage.getItem(THEME_KEY);
  return savedTheme === 'light' ? 'light' : 'dark';
};

const applyTheme = (theme) => {
  const resolvedTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', resolvedTheme);

  if (!themeToggle || !themeIcon || !themeLabel) {
    return;
  }

  if (resolvedTheme === 'light') {
    themeIcon.textContent = '☀️';
    themeLabel.textContent = '淺色';
    themeToggle.setAttribute('aria-label', '切換為深色佈景主題');
  } else {
    themeIcon.textContent = '🌙';
    themeLabel.textContent = '深色';
    themeToggle.setAttribute('aria-label', '切換為淺色佈景主題');
  }
};

const toggleTheme = () => {
  const currentTheme = getTheme();
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
};

const getRecords = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved)
      ? saved.filter((record) => record && record.id && record.createdAt)
      : [];
  } catch {
    return [];
  }
};

const saveRecords = (records) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
};

const getPressureStatus = (systolic, diastolic) => {
  if (systolic < 120 && diastolic < 80) {
    return { label: '正常', className: 'normal' };
  }

  if (systolic < 130 && diastolic < 85) {
    return { label: '偏高', className: 'warning' };
  }

  return { label: '高血壓', className: 'high' };
};

const createText = (tagName, className, text) => {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
};

const isInRange = (field, value) => value >= RANGES[field].min && value <= RANGES[field].max;

const renderSummary = (records) => {
  if (todayDate) {
    todayDate.textContent = new Intl.DateTimeFormat('zh-TW', { month: 'long', day: 'numeric' }).format(new Date());
  }

  if (recordCount) recordCount.textContent = `${records.length} 筆紀錄`;
  if (!records.length) {
    if (latestPressure) latestPressure.textContent = '--/--';
    if (latestStatus) latestStatus.textContent = '等待紀錄';
    if (latestTime) latestTime.textContent = '尚無資料';
    if (weeklyCount) weeklyCount.textContent = '0';
    if (averagePulse) averagePulse.textContent = '--';
    return;
  }

  const latest = records[0];
  const status = getPressureStatus(Number(latest.systolic), Number(latest.diastolic));
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyRecords = records.filter((record) => new Date(record.createdAt).getTime() >= weekStart);
  const pulseTotal = records.reduce((total, record) => total + Number(record.pulse), 0);

  if (latestPressure) latestPressure.textContent = `${latest.systolic}/${latest.diastolic}`;
  if (latestStatus) {
    latestStatus.textContent = status.label;
    latestStatus.className = `tag ${status.className}`;
  }
  if (latestTime) latestTime.textContent = formatDateTime(latest.createdAt).slice(0, 16);
  if (weeklyCount) weeklyCount.textContent = String(weeklyRecords.length);
  if (averagePulse) averagePulse.textContent = String(Math.round(pulseTotal / records.length));
};

const renderRecords = () => {
  const records = getRecords();
  renderSummary(records);

  if (!records.length) {
    recordList.replaceChildren(createText('li', 'empty-state', '尚未有任何血壓紀錄，從上方新增第一筆測量吧。'));
    return;
  }

  const fragment = document.createDocumentFragment();
  records.forEach((record) => {
    const status = getPressureStatus(Number(record.systolic), Number(record.diastolic));
    const item = document.createElement('li');
    item.className = 'record-item';

    const top = document.createElement('div');
    top.className = 'record-top';
    top.append(
      createText('div', 'blood-value', `${record.systolic}/${record.diastolic} mmHg`),
      createText('span', `tag ${status.className}`, status.label),
    );

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.append(
      createText('div', '', `脈搏：${record.pulse} 次/分`),
      createText('div', '', `用藥情況：${record.medication}`),
      createText('div', '', `紀錄時間：${formatDateTime(record.createdAt)}`),
    );

    const note = createText('p', 'note', `備註：${record.notes || '無備註'}`);
    const deleteButton = createText('button', 'delete-btn', '刪除');
    deleteButton.type = 'button';
    deleteButton.dataset.recordId = record.id;
    deleteButton.setAttribute('aria-label', `刪除 ${formatDateTime(record.createdAt)} 的紀錄`);

    item.append(top, meta, note, deleteButton);
    fragment.appendChild(item);
  });
  recordList.replaceChildren(fragment);
};

recordList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-record-id]');
  if (!deleteButton) return;

  const recordId = Number(deleteButton.dataset.recordId);
  if (!window.confirm('確定要刪除這筆血壓紀錄嗎？')) return;

  saveRecords(getRecords().filter((record) => Number(record.id) !== recordId));
  renderRecords();
});

exportButton?.addEventListener('click', () => {
  const records = getRecords();
  if (!records.length) {
    alert('目前沒有可匯出的紀錄。');
    return;
  }

  const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pulsecare-records-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

clearButton?.addEventListener('click', () => {
  if (!getRecords().length) return;
  if (!window.confirm('確定要清除全部血壓紀錄嗎？此操作無法復原。')) return;

  saveRecords([]);
  renderRecords();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const systolic = document.getElementById('systolic').value.trim();
  const diastolic = document.getElementById('diastolic').value.trim();
  const pulse = document.getElementById('pulse').value.trim();
  const medication = document.getElementById('medication').value;
  const notes = document.getElementById('notes').value.trim();
  const values = {
    systolic: Number(systolic),
    diastolic: Number(diastolic),
    pulse: Number(pulse),
  };

  if (!systolic || !diastolic || !pulse || !medication) {
    alert('請完整填寫所有必要欄位。');
    return;
  }

  const invalidField = Object.keys(RANGES).find((field) => !Number.isInteger(values[field]) || !isInRange(field, values[field]));
  if (invalidField) {
    const range = RANGES[invalidField];
    alert(`${range.label}請輸入 ${range.min} 至 ${range.max} 之間的整數。`);
    return;
  }

  const newRecord = {
    id: Date.now(),
    ...values,
    medication,
    notes,
    createdAt: new Date().toISOString(),
  };

  const records = getRecords();
  records.unshift(newRecord);
  saveRecords(records);
  renderRecords();
  form.reset();
  document.getElementById('systolic').focus();
});

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

applyTheme(getTheme());
renderRecords();
