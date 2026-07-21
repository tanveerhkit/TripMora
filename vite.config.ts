import { defineConfig, loadEnv, type Connect, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import type { ServerResponse } from 'node:http'

/**
 * Dev-only plugin: run the exact same /api/generate serverless handler inside
 * Vite's dev server, so `npm run dev` works end-to-end (AI included) without
 * needing the Vercel CLI. In production Vercel deploys /api/generate.js as a
 * real serverless function and this plugin is never used.
 */
function apiDevServer(env: Record<string, string>): PluginOption {
  return {
    name: 'tripmora-api-dev',
    apply: 'serve',
    configureServer(server) {
      if (env.GROQ_API_KEY) process.env.GROQ_API_KEY = env.GROQ_API_KEY
      if (env.GROQ_MODEL) process.env.GROQ_MODEL = env.GROQ_MODEL

      type ApiModule = { default: (req: unknown, res: unknown) => Promise<void> }
      let handlerPromise: Promise<ApiModule> | null = null
      const handlerPath = './api/generate.js'

      const middleware: Connect.NextHandleFunction = async (req, res) => {
        // Adapt the raw Node response to the Vercel-style helpers the handler uses.
        const r = res as ServerResponse & {
          status: (c: number) => typeof r
          json: (b: unknown) => typeof r
        }
        r.status = (code: number) => {
          res.statusCode = code
          return r
        }
        r.json = (body: unknown) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
          return r
        }
        try {
          handlerPromise ??= import(/* @vite-ignore */ handlerPath)
          const mod = await handlerPromise
          await mod.default(req, r)
        } catch (err) {
          server.config.logger.error(`[api dev] ${(err as Error)?.message}`)
          if (!res.writableEnded) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Local API error — see terminal.' }))
          }
        }
      }

      server.middlewares.use('/api/generate', middleware)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), apiDevServer(env)],
  }
})
