const N = 11;

const seedInput = document.getElementById('seed');
const regenerateBtn = document.getElementById('regenerate');
const gridEl = document.getElementById('grid');
const colorInputs = {
  a: document.getElementById('color-a'),
  b: document.getElementById('color-b'),
  c: document.getElementById('color-c'),
};

const hexLabels = {
  a: document.getElementById('hex-a'),
  b: document.getElementById('hex-b'),
  c: document.getElementById('hex-c'),
};

const scaleInput = document.getElementById('scale');
const scaleValue = document.getElementById('scale-value');

const HEX_RE = /^[0-9a-f]{6}$/i;

function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  for (const k of ['a', 'b', 'c']) {
    const v = params.get(k);
    if (v && HEX_RE.test(v)) colorInputs[k].value = '#' + v.toLowerCase();
  }
  const scale = params.get('scale');
  if (scale !== null) {
    const num = Number(scale);
    if (Number.isFinite(num) && num >= 0 && num <= 2) {
      scaleInput.value = String(num);
    }
  }
  const seed = params.get('seed');
  if (seed !== null) seedInput.value = seed;
}

function syncUrl() {
  const params = new URLSearchParams();
  params.set('seed', seedInput.value);
  for (const k of ['a', 'b', 'c']) {
    params.set(k, colorInputs[k].value.replace(/^#/, ''));
  }
  params.set('scale', Number(scaleInput.value).toFixed(2));
  const url = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', url);
}

function applyColors() {
  for (const k of ['a', 'b', 'c']) {
    const v = colorInputs[k].value;
    document.documentElement.style.setProperty(`--color-${k}`, v);
    hexLabels[k].textContent = v;
  }
}

function applyScale() {
  document.documentElement.style.setProperty('--scale', scaleInput.value);
  scaleValue.textContent = Number(scaleInput.value).toFixed(2);
}

function randomSeedString() {
  return Math.floor(Math.random() * 0xFFFFFFFF).toString(36);
}

function run() {
  let seedStr = seedInput.value.trim();
  if (seedStr === '') {
    seedStr = randomSeedString();
    seedInput.value = seedStr;
  }
  const rand = mulberry32(hashSeed(seedStr));
  const matrix = generateGrid({ n: N, rand });
  renderGrid(gridEl, matrix, N);
  syncUrl();
}

for (const input of Object.values(colorInputs)) {
  input.addEventListener('input', () => {
    applyColors();
    syncUrl();
  });
}

scaleInput.addEventListener('input', () => {
  applyScale();
  syncUrl();
});

regenerateBtn.addEventListener('click', () => {
  if (document.activeElement !== seedInput) seedInput.value = '';
  run();
});

seedInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') run();
});

loadFromUrl();
applyColors();
applyScale();
run();
