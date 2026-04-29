// Color indices: 0 = A (blue, top), 1 = B (green, bottom-right), 2 = C (purple, top-left).
const COLOR_NAMES = ['a', 'b', 'c'];

// Higher k -> sharper falloff so corners trend toward pure colors.
const BIAS_EXPONENT = 3;

// 5 lightness variants per main color: 0=darkest, 1=darker, 2=main,
// 3=lighter, 4=lightest. Each has a preferred row position (0=top, 1=bottom).
// Soft bias only — we want a mix, not strong clustering.
const VARIANT_TARGETS = [0, 0.25, 0.5, 0.75, 1];
const VARIANT_BIAS_STRENGTH = 1.5;
const VARIANT_BIAS_FLOOR = 0.2;

function biasWeights(row, col, n) {
  const y = n === 1 ? 0 : row / (n - 1);
  const x = n === 1 ? 0 : col / (n - 1);
  const k = BIAS_EXPONENT;
  const wA = Math.pow(1 - y, k);
  const wB = Math.pow((x + y) / 2, k);
  const wC = Math.pow(((1 - x) + (1 - y)) / 2, k);
  return [wA, wB, wC];
}

function pickColor(weights, forbidden, rand) {
  // Zero out forbidden colors. With 3 colors and at most 2 distinct
  // neighbors (left, above), at least one weight remains nonzero.
  const w = weights.slice();
  for (const f of forbidden) w[f] = 0;

  let total = w[0] + w[1] + w[2];
  if (total === 0) {
    const allowed = [0, 1, 2].filter(i => !forbidden.includes(i));
    return allowed[Math.floor(rand() * allowed.length)];
  }

  const u = rand() * total;
  let acc = 0;
  for (let i = 0; i < 3; i++) {
    acc += w[i];
    if (u < acc) return i;
  }
  return 2;
}

function pickVariant(row, n, rand) {
  const y = n === 1 ? 0.5 : row / (n - 1);
  const w = VARIANT_TARGETS.map(t =>
    Math.max(VARIANT_BIAS_FLOOR, 1 - VARIANT_BIAS_STRENGTH * Math.abs(y - t))
  );
  const total = w.reduce((a, b) => a + b, 0);
  const u = rand() * total;
  let acc = 0;
  for (let i = 0; i < w.length; i++) {
    acc += w[i];
    if (u < acc) return i;
  }
  return w.length - 1;
}

function generateGrid({ n, rand }) {
  // Each cell consumes exactly 2 PRNG draws (color, variant) in row-major
  // order — keep this stable for seed reproducibility.
  const matrix = Array.from({ length: n }, () => new Array(n));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const forbidden = [];
      if (c > 0) forbidden.push(matrix[r][c - 1].color);
      if (r > 0) forbidden.push(matrix[r - 1][c].color);
      const color = pickColor(biasWeights(r, c, n), forbidden, rand);
      const variant = pickVariant(r, n, rand);
      matrix[r][c] = { color, variant };
    }
  }
  return matrix;
}

function renderGrid(gridEl, matrix, n, { showNumbers = false } = {}) {
  gridEl.style.setProperty('--n', n);
  gridEl.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const { color, variant } = matrix[r][c];
      const cell = document.createElement('div');
      // For the numbered grid, always paint the lightest variant so the
      // number stays readable; the digit itself encodes the true variant.
      const displayVariant = showNumbers ? 4 : variant;
      cell.className = `cell color-${COLOR_NAMES[color]}-${displayVariant}`;
      if (showNumbers) {
        // 15 unique numbers across 3 colors x 5 variants:
        // A=1..5, B=6..10, C=11..15 (darkest -> lightest within each).
        cell.classList.add('numbered');
        cell.textContent = color * 5 + variant + 1;
      }
      frag.appendChild(cell);
    }
  }
  gridEl.appendChild(frag);
}

window.generateGrid = generateGrid;
window.renderGrid = renderGrid;
