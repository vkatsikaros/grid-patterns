const N = 11;

const seedInput = document.getElementById('seed');
const regenerateBtn = document.getElementById('regenerate');
const gridEl = document.getElementById('grid');
const colorInputs = {
  a: document.getElementById('color-a'),
  b: document.getElementById('color-b'),
  c: document.getElementById('color-c'),
};

function applyColors() {
  document.documentElement.style.setProperty('--color-a', colorInputs.a.value);
  document.documentElement.style.setProperty('--color-b', colorInputs.b.value);
  document.documentElement.style.setProperty('--color-c', colorInputs.c.value);
}

for (const input of Object.values(colorInputs)) {
  input.addEventListener('input', applyColors);
}
applyColors();

const scaleInput = document.getElementById('scale');
const scaleValue = document.getElementById('scale-value');

function applyScale() {
  document.documentElement.style.setProperty('--scale', scaleInput.value);
  scaleValue.textContent = Number(scaleInput.value).toFixed(2);
}

scaleInput.addEventListener('input', applyScale);
applyScale();

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
}

regenerateBtn.addEventListener('click', () => {
  // Clear the seed so a fresh one is generated; user can also type one in
  // and click regenerate to reproduce.
  if (document.activeElement !== seedInput) seedInput.value = '';
  run();
});

seedInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') run();
});

run();
