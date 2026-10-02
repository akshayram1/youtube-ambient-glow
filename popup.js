'use strict';
const defaults = { enabled: true, intensity: 55, blur: 90, saturation: 140, speed: 12, smoothing: 65 };
const units = { intensity: '%', blur: 'px', saturation: '%', speed: '', smoothing: '%' };
function render(values) {
  for (const key of Object.keys(defaults)) {
    const input = document.getElementById(key);
    if (key === 'enabled') input.checked = values[key];
    else { input.value = values[key]; document.getElementById(`${key}-value`).textContent = `${values[key]}${units[key]}`; }
  }
}
chrome.storage.local.get(defaults, render);
for (const key of Object.keys(defaults)) {
  document.getElementById(key).addEventListener('input', event => {
    const value = key === 'enabled' ? event.target.checked : Number(event.target.value);
    if (key !== 'enabled') document.getElementById(`${key}-value`).textContent = `${value}${units[key]}`;
    chrome.storage.local.set({ [key]: value });
  });
}
document.getElementById('reset').addEventListener('click', () => { chrome.storage.local.set(defaults); render(defaults); });
