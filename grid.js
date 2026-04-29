// Color indices: 0 = A (blue, top), 1 = B (green, bottom-right), 2 = C (purple, top-left).
const COLOR_CLASSES = ['color-a', 'color-b', 'color-c'];

// Higher k -> sharper falloff so corners trend toward pure colors.
const BIAS_EXPONENT = 3;

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
    // Defensive: positional weights all zero (corner degeneracy). Pick
    // uniformly from non-forbidden indices.
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

function generateGrid({ n, rand }) {
  const matrix = Array.from({ length: n }, () => new Array(n));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const forbidden = [];
      if (c > 0) forbidden.push(matrix[r][c - 1]);
      if (r > 0) forbidden.push(matrix[r - 1][c]);
      matrix[r][c] = pickColor(biasWeights(r, c, n), forbidden, rand);
    }
  }
  return matrix;
}

function renderGrid(gridEl, matrix, n) {
  gridEl.style.setProperty('--n', n);
  gridEl.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const cell = document.createElement('div');
      cell.className = `cell ${COLOR_CLASSES[matrix[r][c]]}`;
      frag.appendChild(cell);
    }
  }
  gridEl.appendChild(frag);
}

window.generateGrid = generateGrid;
window.renderGrid = renderGrid;
