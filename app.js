const STORAGE_KEY = 'blood-pressure-records';
const THEME_KEY = 'blood-pressure-theme';

const form = document.getElementById('blood-form');
const recordList = document.getElementById('record-list');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');

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
    return Array.isArray(saved) ? saved : [];
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

const renderRecords = () => {
  const records = getRecords();

  if (!records.length) {
    recordList.innerHTML = '<li class="empty-state">尚未有任何血壓紀錄</li>';
    return;
  }

  recordList.innerHTML = records
    .map((record) => {
      const status = getPressureStatus(Number(record.systolic), Number(record.diastolic));
      const notes = record.notes ? record.notes : '無備註';

      return `
        <li class="record-item">
          <div class="record-top">
            <div class="blood-value">${record.systolic}/${record.diastolic} mmHg</div>
            <span class="tag ${status.className}">${status.label}</span>
          </div>
          <div class="meta">
            <div>脈搏：${record.pulse} 次/分</div>
            <div>用藥情況：${record.medication}</div>
            <div>紀錄時間：${formatDateTime(record.createdAt)}</div>
          </div>
          <p class="note">備註：${notes}</p>
        </li>
      `;
    })
    .join('');
};

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const systolic = document.getElementById('systolic').value.trim();
  const diastolic = document.getElementById('diastolic').value.trim();
  const pulse = document.getElementById('pulse').value.trim();
  const medication = document.getElementById('medication').value;
  const notes = document.getElementById('notes').value.trim();

  if (!systolic || !diastolic || !pulse || !medication) {
    alert('請完整填寫所有必要欄位。');
    return;
  }

  const newRecord = {
    id: Date.now(),
    systolic: Number(systolic),
    diastolic: Number(diastolic),
    pulse: Number(pulse),
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
