const state = { from: 'zh', to: 'en', scene: 'school', custom: '' }
const fromGrid = document.getElementById('fromGrid')
const toGrid = document.getElementById('toGrid')
const sceneGrid = document.getElementById('sceneGrid')
const customScene = document.getElementById('customScene')
const goBtn = document.getElementById('goBtn')

function setActive(grid, selector, value) {
  grid.querySelectorAll(selector).forEach((btn) => btn.classList.toggle('active', btn.dataset.value === value || btn.dataset.scene === value))
}

function sync() {
  const params = new URLSearchParams({ from: state.from, to: state.to, scene: state.scene, custom: state.custom })
  goBtn.href = `/translate?${params.toString()}`
}

fromGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-value]')
  if (!btn) return
  state.from = btn.dataset.value
  setActive(fromGrid, 'button[data-value]', state.from)
  sync()
})

toGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-value]')
  if (!btn) return
  state.to = btn.dataset.value
  setActive(toGrid, 'button[data-value]', state.to)
  sync()
})

sceneGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-scene]')
  if (!btn) return
  state.scene = btn.dataset.scene
  setActive(sceneGrid, 'button[data-scene]', state.scene)
  sync()
})

customScene.addEventListener('input', () => {
  state.custom = customScene.value.trim()
  if (state.custom) state.scene = 'other'
  sync()
})

sync()
