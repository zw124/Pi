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
}

function openSheet(kind) {
  activePicker = kind
  draftValue = state[kind]
  sheetTitle.textContent = kind === 'from' ? 'Translate from' : 'Translate to'
  languageSearch.value = ''
  renderLanguages()
  sheet.hidden = false
  backdrop.hidden = false
  requestAnimationFrame(() => {
    sheet.classList.add('open')
    backdrop.classList.add('open')
    languageSearch.focus()
  })
}

function closeSheet(save = false) {
  if (save) state[activePicker] = draftValue
  sheet.classList.remove('open')
  backdrop.classList.remove('open')
  setTimeout(() => { sheet.hidden = true; backdrop.hidden = true }, 180)
  sync()
}

document.querySelectorAll('[data-picker]').forEach((button) => button.addEventListener('click', () => openSheet(button.dataset.picker)))
document.getElementById('closeSheet').addEventListener('click', () => closeSheet(false))
document.getElementById('doneSheet').addEventListener('click', () => closeSheet(true))
backdrop.addEventListener('click', () => closeSheet(false))
languageSearch.addEventListener('input', renderLanguages)
languageList.addEventListener('click', (e) => {
  const option = e.target.closest('[data-code]')
  if (!option) return
  draftValue = option.dataset.code
  renderLanguages()
})

sceneGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-scene]')
  if (!btn) return
  state.scene = btn.dataset.scene
  sceneGrid.querySelectorAll('button[data-scene]').forEach((chip) => chip.classList.toggle('active', chip === btn))
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

sync()
