import { defineConfig, loadEnv, type Connect, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import type { ServerResponse } from 'node:http'
import { statSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

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
      // Mirror the AI env vars the serverless handler reads into process.env so
      // the same code path runs in dev. loadEnv gives us the .env values here,
      // but the handler reads process.env.
      for (const key of ['GEMINI_API_KEY', 'GEMINI_MODEL']) {
        if (env[key]) process.env[key] = env[key]
      }

      type ApiModule = { default: (req: unknown, res: unknown) => Promise<void> }
      const handlerFile = resolve(process.cwd(), 'api/generate.js')
      let handlerPromise: Promise<ApiModule> | null = null
      let lastMtime = 0

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
          // Re-import when api/generate.js changes so edits hot-reload without a
          // full dev-server restart (the module URL is busted with its mtime).
          // The specifier is a plain variable + absolute file URL so esbuild
          // leaves it as a runtime import instead of trying to bundle it.
          const mtime = statSync(handlerFile).mtimeMs
          if (!handlerPromise || mtime !== lastMtime) {
            lastMtime = mtime
            const specifier = `${pathToFileURL(handlerFile).href}?t=${mtime}`
            handlerPromise = import(/* @vite-ignore */ specifier)
          }
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
