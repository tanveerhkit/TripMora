import vercelHandler from '../../api/generate.js'

export default async function handler(event) {
  const isRequest = typeof event?.method === 'string'
  const method = isRequest ? event.method : event?.httpMethod
  let body = isRequest ? await event.text() : event?.body

  if (!isRequest && event?.isBase64Encoded && typeof body === 'string') {
    body = Buffer.from(body, 'base64').toString('utf8')
  }

  const headers = {}
  let statusCode = 200
  let jsonBody = null
  let ended = false

  const req = {
    method,
    body,
    async *[Symbol.asyncIterator]() {},
  }

  const res = {
    setHeader(name, value) {
      headers[name] = value
    },
    status(code) {
      statusCode = code
      return res
    },
    json(value) {
      jsonBody = value
      ended = true
      return res
    },
  }

  try {
    await vercelHandler(req, res)
  } catch (error) {
    console.error('Netlify function error', error)
    if (!ended) {
      statusCode = 500
      jsonBody = { error: 'Internal server error.' }
    }
  }

  return new Response(JSON.stringify(jsonBody ?? {}), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}
