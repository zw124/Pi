const statusEl = document.getElementById('status')
const toggleBtn = document.getElementById('toggleBtn')
const clearBtn = document.getElementById('clearBtn')
const originalEl = document.getElementById('originalText')
const translatedEl = document.getElementById('translatedText')
const contextButtons = [...document.querySelectorAll('[data-context]')]

let activeContext = 'school'
let recorder = null
let stream = null
let isRecording = false

const mimeCandidates = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
]

function setStatus(text) {
  statusEl.textContent = text
}

function setActiveContext(value) {
  activeContext = value
  contextButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.context === value))
}

function appendText(el, next) {
  if (!next) return
  if (el.classList.contains('zone-empty')) {
    el.classList.remove('zone-empty')
    el.textContent = next
    return
  }
  el.textContent = `${el.textContent}\n${next}`.trim()
}

async function sendChunk(blob) {
  const response = await fetch('/api/transcribe?context=' + encodeURIComponent(activeContext), {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'audio/webm' },
    body: blob,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Transcribe failed')

  if (data.note) {
    setStatus(data.note)
    return
  }

  if (data.transcript) appendText(originalEl, data.transcript)
  if (data.translation) appendText(translatedEl, data.translation)
  if (!data.transcript && !data.translation) setStatus('No speech detected.')
}

function pickMimeType() {
  return mimeCandidates.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || ''
}

async function startRecording() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mimeType = pickMimeType()
  recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

  recorder.ondataavailable = async (event) => {
    if (!event.data || !event.data.size) return
    try {
      await sendChunk(event.data)
    } catch (error) {
      setStatus(error.message)
    }
  }

  recorder.start(1800)
  isRecording = true
  toggleBtn.textContent = 'Stop'
  setStatus(`Listening for ${activeContext} mode…`)
}

function stopRecording() {
  if (recorder && recorder.state !== 'inactive') recorder.stop()
  if (stream) stream.getTracks().forEach((track) => track.stop())
  recorder = null
  stream = null
  isRecording = false
  toggleBtn.textContent = 'Start'
  setStatus('Stopped.')
}

contextButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    setActiveContext(btn.dataset.context)
    if (!isRecording) setStatus(`Mode: ${activeContext}`)
  })
})

toggleBtn.addEventListener('click', async () => {
  try {
    if (isRecording) stopRecording()
    else await startRecording()
  } catch (error) {
    setStatus(error.message || 'Mic permission needed.')
  }
})

clearBtn.addEventListener('click', () => {
  originalEl.textContent = 'Waiting for speech…'
  translatedEl.textContent = 'Translation will appear here.'
  originalEl.classList.add('zone-empty')
  translatedEl.classList.add('zone-empty')
  setStatus(`Mode: ${activeContext}`)
})

setActiveContext(activeContext)
