const languages = [
  ['auto', 'Auto detect'], ['af', 'Afrikaans'], ['sq', 'Albanian'], ['am', 'Amharic'], ['ar', 'Arabic'], ['hy', 'Armenian'], ['az', 'Azerbaijani'],
  ['eu', 'Basque'], ['bn', 'Bengali'], ['bs', 'Bosnian'], ['bg', 'Bulgarian'], ['ca', 'Catalan'], ['ceb', 'Cebuano'], ['zh', 'Chinese'],
  ['zh-TW', 'Chinese (Traditional)'], ['hr', 'Croatian'], ['cs', 'Czech'], ['da', 'Danish'], ['nl', 'Dutch'], ['en', 'English'], ['et', 'Estonian'],
  ['fi', 'Finnish'], ['fr', 'French'], ['gl', 'Galician'], ['ka', 'Georgian'], ['de', 'German'], ['el', 'Greek'], ['gu', 'Gujarati'], ['ht', 'Haitian Creole'],
  ['ha', 'Hausa'], ['he', 'Hebrew'], ['hi', 'Hindi'], ['hmn', 'Hmong'], ['hu', 'Hungarian'], ['is', 'Icelandic'], ['ig', 'Igbo'], ['id', 'Indonesian'],
  ['ga', 'Irish'], ['it', 'Italian'], ['ja', 'Japanese'], ['jv', 'Javanese'], ['kn', 'Kannada'], ['kk', 'Kazakh'], ['km', 'Khmer'], ['ko', 'Korean'],
  ['ku', 'Kurdish'], ['ky', 'Kyrgyz'], ['lo', 'Lao'], ['la', 'Latin'], ['lv', 'Latvian'], ['lt', 'Lithuanian'], ['lb', 'Luxembourgish'], ['mk', 'Macedonian'],
  ['mg', 'Malagasy'], ['ms', 'Malay'], ['ml', 'Malayalam'], ['mt', 'Maltese'], ['mi', 'Maori'], ['mr', 'Marathi'], ['mn', 'Mongolian'], ['my', 'Myanmar'],
  ['ne', 'Nepali'], ['no', 'Norwegian'], ['ny', 'Nyanja'], ['ps', 'Pashto'], ['fa', 'Persian'], ['pl', 'Polish'], ['pt', 'Portuguese'], ['pa', 'Punjabi'],
  ['ro', 'Romanian'], ['ru', 'Russian'], ['sm', 'Samoan'], ['gd', 'Scots Gaelic'], ['sr', 'Serbian'], ['st', 'Sesotho'], ['sn', 'Shona'], ['sd', 'Sindhi'],
  ['si', 'Sinhala'], ['sk', 'Slovak'], ['sl', 'Slovenian'], ['so', 'Somali'], ['es', 'Spanish'], ['su', 'Sundanese'], ['sw', 'Swahili'], ['sv', 'Swedish'],
  ['tl', 'Tagalog'], ['tg', 'Tajik'], ['ta', 'Tamil'], ['te', 'Telugu'], ['th', 'Thai'], ['tr', 'Turkish'], ['uk', 'Ukrainian'], ['ur', 'Urdu'],
  ['uz', 'Uzbek'], ['vi', 'Vietnamese'], ['cy', 'Welsh'], ['xh', 'Xhosa'], ['yi', 'Yiddish'], ['yo', 'Yoruba'], ['zu', 'Zulu'],
]

const state = { from: 'zh', to: 'en', scene: 'school', custom: '' }
const byCode = Object.fromEntries(languages)
let activePicker = 'from'
let draftValue = state.from
let previousCode = state.from

const fromName = document.getElementById('fromName')
const toName = document.getElementById('toName')
const sceneGrid = document.getElementById('sceneGrid')
const customScene = document.getElementById('customScene')
const goBtn = document.getElementById('goBtn')
const sheet = document.getElementById('languageSheet')
const backdrop = document.getElementById('sheetBackdrop')
const sheetTitle = document.getElementById('sheetTitle')
const languageSearch = document.getElementById('languageSearch')
const languageList = document.getElementById('languageList')

function sync() {
  fromName.textContent = byCode[state.from]
  toName.textContent = byCode[state.to]
  const params = new URLSearchParams({ from: state.from, to: state.to, scene: state.scene, custom: state.custom })
  goBtn.href = `/translate?${params.toString()}`
}

function renderLanguages() {
  const query = languageSearch.value.trim().toLowerCase()
  const source = activePicker === 'from' ? languages : languages.filter(([code]) => code !== 'auto')
  const filtered = source.filter(([code, name]) => `${name} ${code}`.toLowerCase().includes(query))
  languageList.innerHTML = filtered.map(([code, name]) => `
    <button class="language-option ${code === draftValue ? 'selected' : ''}" type="button" data-code="${code}" role="option" aria-selected="${code === draftValue}">
      <span>${name}</span><small>${code.toUpperCase()}</small>
    </button>
  `).join('') || '<div class="empty-state">No language found.</div>'

  // GSAP: stagger entrance for each option
  const options = languageList.querySelectorAll('.language-option')
  gsap.fromTo(options, { opacity: 0, y: 12, scale: 0.96 }, {
    opacity: 1, y: 0, scale: 1,
    duration: 0.35, ease: 'back.out(1.4)', stagger: 0.025,
    overwrite: 'auto',
  })
}

function openSheet(kind) {
  activePicker = kind
  draftValue = previousCode = state[kind]
  sheetTitle.textContent = kind === 'from' ? 'Translate from' : 'Translate to'
  languageSearch.value = ''
  sheet.hidden = false
  backdrop.hidden = false
  renderLanguages()

  // Reset sheet position before animating in
  gsap.set(sheet, { y: '110%' })
  gsap.set(backdrop, { opacity: 0 })

  requestAnimationFrame(() => {
    // GSAP timeline for sheet entrance
    const tl = gsap.timeline()
    tl.to(backdrop, { opacity: 1, duration: 0.25, ease: 'power2.out' })
      .to(sheet, { y: '0%', duration: 0.45, ease: 'expo.out' }, '<0.05')
      // Scale pulse on the selected item
      .fromTo('.language-option.selected', { scale: 0.85 }, { scale: 1, duration: 0.35, ease: 'elastic.out(1, 0.4)' }, '<0.1')
  })
  setTimeout(() => languageSearch.focus(), 100)
}

function closeSheet(save = false) {
  if (save) state[activePicker] = draftValue

  // GSAP exit animation
  const tl = gsap.timeline({
    onComplete: () => { sheet.hidden = true; backdrop.hidden = true; sync() }
  })
  tl.to(sheet, { y: '110%', duration: 0.35, ease: 'expo.in' })
    .to(backdrop, { opacity: 0, duration: 0.2, ease: 'power2.in' }, '<0.1')
}

document.querySelectorAll('[data-picker]').forEach((button) => button.addEventListener('click', () => openSheet(button.dataset.picker)))
document.getElementById('closeSheet').addEventListener('click', () => closeSheet(false))
document.getElementById('doneSheet').addEventListener('click', () => closeSheet(true))
backdrop.addEventListener('click', () => closeSheet(false))
languageSearch.addEventListener('input', renderLanguages)
languageList.addEventListener('click', (e) => {
  const option = e.target.closest('[data-code]')
  if (!option) return
  previousCode = draftValue
  draftValue = option.dataset.code
  renderLanguages()

  // GSAP ripple on selection
  const rect = option.getBoundingClientRect()
  gsap.fromTo(option, { scale: 0.92 }, {
    scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)',
  })
})

// GSAP scene chip switch
sceneGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-scene]')
  if (!btn || btn.classList.contains('active')) return
  state.scene = btn.dataset.scene
  sceneGrid.querySelectorAll('button[data-scene]').forEach((chip) => chip.classList.toggle('active', chip === btn))
  gsap.fromTo(btn, { scale: 0.85 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.4)' })
  sync()
})

customScene.addEventListener('input', () => {
  state.custom = customScene.value.trim()
  if (state.custom) {
    state.scene = 'other'
    sceneGrid.querySelectorAll('button[data-scene]').forEach((chip) => chip.classList.toggle('active', chip.dataset.scene === 'other'))
  }
  sync()
})

// Entrance animation for the setup card
gsap.from('.glass-card', { y: 24, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 })
gsap.fromTo('.setup-title', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.25 })
gsap.fromTo('.setup-copy', { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.4 })
gsap.fromTo('.language-row', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.5 })
gsap.fromTo('.scene-chip', { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.7 })

sync()