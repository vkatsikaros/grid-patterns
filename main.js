const N = 11;

const seedInput = document.getElementById('seed');
const regenerateBtn = document.getElementById('regenerate');
const gridEl = document.getElementById('grid');

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
