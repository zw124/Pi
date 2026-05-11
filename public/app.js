const statusEl = document.getElementById('status')
const toggleBtn = document.getElementById('toggleBtn')
const clearBtn = document.getElementById('clearBtn')
const originalEl = document.getElementById('originalText')
const translatedEl = document.getElementById('translatedText')
const modeText = document.getElementById('modeText')
const noiseText = document.getElementById('noiseText')

const params = new URLSearchParams(location.search)
const from = params.get('from') || 'zh'
const to = params.get('to') || 'en'
const scene = params.get('scene') || 'school'
const custom = params.get('custom') || ''

let mediaRecorder = null
let stream = null
let isRecording = false
let silenceTimer = null
let chunks = []
let activeTranscript = ''
let activeTranslation = ''
let speechStart = 0
let lastSoundAt = 0

const mimeCandidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
const languageMap = {
  auto: 'Auto detect', af: 'Afrikaans', sq: 'Albanian', am: 'Amharic', ar: 'Arabic', hy: 'Armenian', az: 'Azerbaijani', eu: 'Basque', bn: 'Bengali', bs: 'Bosnian', bg: 'Bulgarian', ca: 'Catalan', ceb: 'Cebuano', zh: 'Chinese', 'zh-TW': 'Chinese (Traditional)', hr: 'Croatian', cs: 'Czech', da: 'Danish', nl: 'Dutch', en: 'English', et: 'Estonian', fi: 'Finnish', fr: 'French', gl: 'Galician', ka: 'Georgian', de: 'German', el: 'Greek', gu: 'Gujarati', ht: 'Haitian Creole', ha: 'Hausa', he: 'Hebrew', hi: 'Hindi', hmn: 'Hmong', hu: 'Hungarian', is: 'Icelandic', ig: 'Igbo', id: 'Indonesian', ga: 'Irish', it: 'Italian', ja: 'Japanese', jv: 'Javanese', kn: 'Kannada', kk: 'Kazakh', km: 'Khmer', ko: 'Korean', ku: 'Kurdish', ky: 'Kyrgyz', lo: 'Lao', la: 'Latin', lv: 'Latvian', lt: 'Lithuanian', lb: 'Luxembourgish', mk: 'Macedonian', mg: 'Malagasy', ms: 'Malay', ml: 'Malayalam', mt: 'Maltese', mi: 'Maori', mr: 'Marathi', mn: 'Mongolian', my: 'Myanmar', ne: 'Nepali', no: 'Norwegian', ny: 'Nyanja', ps: 'Pashto', fa: 'Persian', pl: 'Polish', pt: 'Portuguese', pa: 'Punjabi', ro: 'Romanian', ru: 'Russian', sm: 'Samoan', gd: 'Scots Gaelic', sr: 'Serbian', st: 'Sesotho', sn: 'Shona', sd: 'Sindhi', si: 'Sinhala', sk: 'Slovak', sl: 'Slovenian', so: 'Somali', es: 'Spanish', su: 'Sundanese', sw: 'Swahili', sv: 'Swedish', tl: 'Tagalog', tg: 'Tajik', ta: 'Tamil', te: 'Telugu', th: 'Thai', tr: 'Turkish', uk: 'Ukrainian', ur: 'Urdu', uz: 'Uzbek', vi: 'Vietnamese', cy: 'Welsh', xh: 'Xhosa', yi: 'Yiddish', yo: 'Yoruba', zu: 'Zulu'
}

modeText.textContent = `${scene === 'other' ? (custom || 'Other') : scene[0].toUpperCase() + scene.slice(1)} · ${languageMap[from] || from} → ${languageMap[to] || to}`

function setStatus(text) { statusEl.textContent = text }
function setZone(el, value, fallback) { el.textContent = value || fallback }
function pickMimeType() { return mimeCandidates.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || '' }
function volumeRms(blob) { return blob.size < 500 ? 0 : 1 }
function isNoise(blob) { return volumeRms(blob) === 0 }
function appendChunkText(chunkText, translatedText) {
  if (chunkText) activeTranscript = activeTranscript ? `${activeTranscript} ${chunkText}` : chunkText
  if (translatedText) activeTranslation = activeTranslation ? `${activeTranslation} ${translatedText}` : translatedText
  setZone(originalEl, activeTranscript, 'Waiting.')
  setZone(translatedEl, activeTranslation, 'Translation.')
}

async function sendChunk(blob) {
  if (isNoise(blob)) {
    setStatus('Noise ignored.')
    return
  }

  const response = await fetch(`/api/transcribe?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&scene=${encodeURIComponent(scene)}&custom=${encodeURIComponent(custom)}`, {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'audio/webm' },
    body: blob,
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Transcribe failed')
  if (data.note) { setStatus(data.note); return }
  if (data.transcript || data.translation) appendChunkText(data.transcript, data.translation)
  setStatus(data.speechFinal ? 'Final.' : 'Listening…')
}

function stopAll(message = 'Stopped.') {
  if (silenceTimer) clearTimeout(silenceTimer)
  silenceTimer = null
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
  if (stream) stream.getTracks().forEach((track) => track.stop())
  mediaRecorder = null
  stream = null
  isRecording = false
  toggleBtn.textContent = 'Start'
  toggleBtn.classList.remove('recording')
  setStatus(message)
}

async function startRecording() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mimeType = pickMimeType()
  mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
  chunks = []
  speechStart = Date.now()
  lastSoundAt = Date.now()

  mediaRecorder.ondataavailable = async (event) => {
    if (!event.data || !event.data.size) return
    if (!isRecording) return
    if (!isNoise(event.data)) {
      lastSoundAt = Date.now()
      chunks.push(event.data)
    }
    if (silenceTimer) clearTimeout(silenceTimer)
    silenceTimer = setTimeout(async () => {
      const silentFor = Date.now() - lastSoundAt
      if (silentFor < 500) return
      if (!chunks.length) return stopAll('Silent.')
      const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' })
      chunks = []
      try { await sendChunk(blob) } catch (error) { setStatus(error.message) }
      stopAll('Silent.')
    }, 500)
  }

  mediaRecorder.start(100)
  isRecording = true
  toggleBtn.textContent = 'End'
  toggleBtn.classList.add('recording')
  setStatus('Listening…')
}

toggleBtn.addEventListener('click', async () => {
  try { if (isRecording) stopAll(); else await startRecording() }
  catch (error) { stopAll(error.message || 'Mic permission needed.') }
})

clearBtn.addEventListener('click', () => {
  activeTranscript = ''
  activeTranslation = ''
  setZone(originalEl, '', 'Waiting.')
  setZone(translatedEl, '', 'Translation.')
  setStatus('Ready.')
})

setZone(originalEl, '', 'Waiting.')
setZone(translatedEl, '', 'Translation.')
