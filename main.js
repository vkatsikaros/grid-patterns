const N = 11;
const COLOR_KEYS = ['a', 'b', 'c'];

const seedInput = document.getElementById('seed');
const regenerateBtn = document.getElementById('regenerate');
const gridEl = document.getElementById('grid');
const gridNumbersEl = document.getElementById('grid-numbers');
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

// overrides[colorIdx][variantIdx] = '#rrggbb' | undefined
const overrides = [{}, {}, {}];

// 1x1 canvas to coerce any CSS color string (including oklch()) to RGB.
const colorCanvas = document.createElement('canvas');
colorCanvas.width = colorCanvas.height = 1;
const colorCtx = colorCanvas.getContext('2d');

function cssColorToHex(cssColor) {
  colorCtx.clearRect(0, 0, 1, 1);
  colorCtx.fillStyle = '#000';
  colorCtx.fillStyle = cssColor;
  colorCtx.fillRect(0, 0, 1, 1);
  const [r, g, b] = colorCtx.getImageData(0, 0, 1, 1).data;
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function variantKey(color, variant) {
  return `v${COLOR_KEYS[color]}${variant}`;
}

function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  for (const k of COLOR_KEYS) {
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

  for (let color = 0; color < 3; color++) {
    for (let variant = 0; variant < 5; variant++) {
      const v = params.get(variantKey(color, variant));
      if (v && HEX_RE.test(v)) overrides[color][variant] = '#' + v.toLowerCase();
    }
  }
}

function syncUrl() {
  const params = new URLSearchParams();
  params.set('seed', seedInput.value);
  for (const k of COLOR_KEYS) {
    params.set(k, colorInputs[k].value.replace(/^#/, ''));
  }
  params.set('scale', Number(scaleInput.value).toFixed(2));
  for (let color = 0; color < 3; color++) {
    for (let variant = 0; variant < 5; variant++) {
      const o = overrides[color][variant];
      if (o) params.set(variantKey(color, variant), o.replace(/^#/, ''));
    }
  }
  const url = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', url);
}

function applyColors() {
  for (const k of COLOR_KEYS) {
    const v = colorInputs[k].value;
    document.documentElement.style.setProperty(`--color-${k}`, v);
    hexLabels[k].textContent = v;
  }
}

function applyScale() {
  document.documentElement.style.setProperty('--scale', scaleInput.value);
  scaleValue.textContent = Number(scaleInput.value).toFixed(2);
}

function applyOverrides() {
  for (let color = 0; color < 3; color++) {
    for (let variant = 0; variant < 5; variant++) {
      const cssVar = `--override-${COLOR_KEYS[color]}-${variant}`;
      const o = overrides[color][variant];
      if (o) {
        document.documentElement.style.setProperty(cssVar, o);
      } else {
        document.documentElement.style.removeProperty(cssVar);
      }
      // Visual indicator on the swatch.
      const swatch = document.querySelector(
        `.swatch[data-color="${color}"][data-variant="${variant}"]`
      );
      if (swatch) swatch.classList.toggle('overridden', !!o);
    }
  }
}

function syncVariantInputs() {
  // Populate each picker's current value so it opens at the right color.
  // Read the swatch's resolved background so OKLCH values come through.
  for (const input of document.querySelectorAll('.variant-picker')) {
    const color = Number(input.dataset.color);
    const variant = Number(input.dataset.variant);
    const o = overrides[color][variant];
    if (o) {
      input.value = o;
      continue;
    }
    const swatch = document.querySelector(
      `.swatch[data-color="${color}"][data-variant="${variant}"]`
    );
    if (!swatch) continue;
    const bg = getComputedStyle(swatch).backgroundColor;
    try {
      input.value = cssColorToHex(bg);
    } catch (_) { /* ignore */ }
  }
}

function randomSeedString() {
  return Math.floor(Math.random() * 0xFFFFFFFF).toString(36);
}

function updateCounts(matrix, n) {
  const counts = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const { color, variant } = matrix[r][c];
      counts[color][variant]++;
    }
  }
  for (const el of document.querySelectorAll('.count')) {
    const color = Number(el.dataset.color);
    const variant = Number(el.dataset.variant);
    el.textContent = counts[color][variant];
  }
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
  renderGrid(gridNumbersEl, matrix, N, { showNumbers: true });
  updateCounts(matrix, N);
  syncUrl();
}

for (const input of Object.values(colorInputs)) {
  input.addEventListener('input', () => {
    applyColors();
    syncVariantInputs();
    syncUrl();
  });
}

scaleInput.addEventListener('input', () => {
  applyScale();
  syncVariantInputs();
  syncUrl();
});

for (const picker of document.querySelectorAll('.variant-picker')) {
  picker.addEventListener('input', () => {
    const color = Number(picker.dataset.color);
    const variant = Number(picker.dataset.variant);
    overrides[color][variant] = picker.value;
    applyOverrides();
    syncUrl();
  });
}

for (const btn of document.querySelectorAll('.reset-variants')) {
  btn.addEventListener('click', () => {
    const color = Number(btn.dataset.color);
    overrides[color] = {};
    applyOverrides();
    syncVariantInputs();
    syncUrl();
  });
}

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
applyOverrides();
syncVariantInputs();
run();
