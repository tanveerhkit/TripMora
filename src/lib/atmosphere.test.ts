import { describe, expect, it } from 'vitest'
import { getAtmosphere } from './atmosphere'

describe('getAtmosphere', () => {
  it('maps alpine and winter language to mountain', () => {
    expect(getAtmosphere('Snowy mountain escape in Kashmir').id).toBe('mountain')
  })

  it('maps weather signals to rain', () => {
    expect(getAtmosphere({ destination: 'London', weather: 'Rainy and misty' }).id).toBe('rain')
  })

  it('maps terrain and destination signals to forest and tropical themes', () => {
    expect(getAtmosphere({ terrain: 'forest', style: 'nature' }).id).toBe('forest')
    expect(getAtmosphere({ destination: 'Kerala', tags: ['backwaters', 'coast'] }).id).toBe('tropical')
  })

  it('maps desert and urban destinations correctly', () => {
    expect(getAtmosphere('Golden dunes and Marrakech souks').id).toBe('desert')
    expect(getAtmosphere('A neon city nightlife weekend in Tokyo').id).toBe('city')
    expect(getAtmosphere({ destination: 'Dubai', atmosphere: 'city' }).id).toBe('city')
  })

  it('falls back to open road for unknown input', () => {
    expect(getAtmosphere('A quiet place somewhere new').id).toBe('explore')
  })
})
