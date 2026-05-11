import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.join(__dirname, 'public')
const port = Number(process.env.PORT || 3000)
const deepgramKey = process.env.DEEPGRAM_API_KEY || ''

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers })
  res.end(body)
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

function safeJoin(base, target) {
  const targetPath = path.posix.normalize('/' + target).replace(/^\/+/, '')
  return path.join(base, targetPath)
}

function transcriptFromDeepgram(payload) {
  const alt = payload?.results?.channels?.[0]?.alternatives?.[0]
  const transcript = alt?.transcript?.trim() || ''
  const translation = alt?.translation?.trim() || payload?.results?.translation?.trim() || transcript
  return { transcript, translation }
}

async function handleTranscribe(req, res) {
  if (!deepgramKey) {
    return send(
      res,
      200,
      JSON.stringify({
        transcript: '',
        translation: '',
        note: 'Set DEEPGRAM_API_KEY to enable live transcription.',
      }),
      { 'Content-Type': 'application/json; charset=utf-8' },
    )
  }

  const audio = await readBody(req)
  if (!audio.length) {
    return send(res, 400, JSON.stringify({ error: 'Empty audio body.' }), { 'Content-Type': 'application/json; charset=utf-8' })
  }

  const url = new URL('https://api.deepgram.com/v1/listen')
  url.searchParams.set('model', 'nova-3')
  url.searchParams.set('smart_format', 'true')
  url.searchParams.set('punctuate', 'true')
  url.searchParams.set('detect_language', 'true')
  url.searchParams.set('translate', 'true')
  url.searchParams.set('utterances', 'false')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Token ${deepgramKey}`,
      'Content-Type': req.headers['content-type'] || 'audio/webm',
    },
    body: audio,
  })

  const text = await response.text()
  if (!response.ok) {
    return send(res, response.status, JSON.stringify({ error: text.slice(0, 500) }), { 'Content-Type': 'application/json; charset=utf-8' })
  }

  let parsed = {}
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = {}
  }

  const { transcript, translation } = transcriptFromDeepgram(parsed)
  return send(
    res,
    200,
    JSON.stringify({ transcript, translation, raw: parsed?.metadata?.request_id ? undefined : undefined }),
    { 'Content-Type': 'application/json; charset=utf-8' },
  )
}

async function serveStatic(req, res, pathname) {
  const filePath = pathname === '/' ? '/index.html' : pathname === '/translate' ? '/translate.html' : pathname
  const absolute = safeJoin(publicDir, filePath)

  try {
    const data = await fs.readFile(absolute)
    const ext = path.extname(absolute)
    send(res, 200, data, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' })
  } catch {
    const data = await fs.readFile(path.join(publicDir, 'index.html'))
    send(res, 200, data, { 'Content-Type': 'text/html; charset=utf-8' })
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost')

  if (req.method === 'POST' && url.pathname === '/api/transcribe') {
    try {
      return await handleTranscribe(req, res)
    } catch (error) {
      return send(res, 500, JSON.stringify({ error: error?.message || 'Transcribe failed.' }), { 'Content-Type': 'application/json; charset=utf-8' })
    }
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return await serveStatic(req, res, url.pathname)
  }

  send(res, 405, 'Method Not Allowed')
})

server.listen(port, () => {
  console.log(`PI Translate running on http://localhost:${port}`)
})
