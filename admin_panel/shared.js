export function byId(id) {
  return document.getElementById(id);
}

export function setText(id, value) {
  byId(id).textContent = value || '';
}

export function setHtml(id, value) {
  byId(id).innerHTML = value || '';
}

export function setStatus(id, value, tone = 'neutral') {
  const element = byId(id);

  if (!element) {
    return;
  }

  element.textContent = value || '';
  element.className = `status-panel${value ? ` tone-${tone}` : ''}`;
}

export function setButtonBusy(id, isBusy, busyLabel) {
  const button = byId(id);

  if (!button) {
    return;
  }

  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent || '';
  }

  button.disabled = isBusy;
  button.textContent = isBusy ? busyLabel : button.dataset.defaultLabel;
}

export function parseCommaList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatCommaList(values = []) {
  return values.join(', ');
}

export function parseAlternativeLines(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label = '', description = '', url = ''] = line.split('|').map((part) => part.trim());
      return { description, label, url };
    })
    .filter((item) => item.label && item.description && item.url);
}

export function formatAlternativeLines(values = []) {
  return values.map((item) => `${item.label} | ${item.description} | ${item.url}`).join('\n');
}

export function nullableNumber(value) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function inputValue(value) {
  return value === null || value === undefined ? '' : String(value);
}

export function formatDateTime(value) {
  if (!value) {
    return 'No timestamp';
  }

  const dateValue = new Date(value);

  if (Number.isNaN(dateValue.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dateValue);
}
