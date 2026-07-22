import { describe, expect, it } from 'vitest'
import { parseModelJson, repairJson } from './safe'

/**
 * The model occasionally breaks otherwise-valid JSON in two ways: a trailing
 * comma, or truncation (cut off mid-response). These guard the repair pass that
 * recovers both so the user never sees a "not valid JSON" error for them.
 */
describe('repairJson', () => {
  it('drops a trailing comma in an object', () => {
    expect(JSON.parse(repairJson('{"a":1,}'))).toEqual({ a: 1 })
  })

  it('drops a trailing comma in an array', () => {
    expect(JSON.parse(repairJson('{"xs":[1,2,3,]}'))).toEqual({ xs: [1, 2, 3] })
  })

  it('closes an object truncated after a complete value', () => {
    expect(JSON.parse(repairJson('{"a":1,"b":2'))).toEqual({ a: 1, b: 2 })
  })

  it('closes a string and brackets truncated mid-string', () => {
    // cut off inside the "tip" value
    const out = parseModelJson('{"days":[{"tip":"go early in the mor')
    expect((out as { days: { tip: string }[] }).days[0].tip).toContain('go early')
  })

  it('closes nested arrays/objects left open by truncation', () => {
    const out = repairJson('{"days":[{"stops":[{"title":"Louvre"')
    const parsed = JSON.parse(out) as { days: { stops: { title: string }[] }[] }
    expect(parsed.days[0].stops[0].title).toBe('Louvre')
  })

  it('does not touch a comma that lives inside a string', () => {
    expect(JSON.parse(repairJson('{"note":"eggs, milk, bread"}'))).toEqual({
      note: 'eggs, milk, bread',
    })
  })
})

describe('parseModelJson', () => {
  it('parses clean JSON unchanged', () => {
    expect(parseModelJson('{"ok":true}')).toEqual({ ok: true })
  })

  it('unwraps a ```json fenced block', () => {
    expect(parseModelJson('```json\n{"ok":true}\n```')).toEqual({ ok: true })
  })

  it('recovers a trailing comma without the repair changing good data', () => {
    expect(parseModelJson('{"a":[1,2,],"b":3,}')).toEqual({ a: [1, 2], b: 3 })
  })
})
