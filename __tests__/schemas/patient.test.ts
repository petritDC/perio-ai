import { describe, it, expect } from 'vitest'
import { createPatientSchema } from '@/lib/schemas/patient'

describe('createPatientSchema', () => {
  it('accepts valid patient with only required fields', () => {
    const result = createPatientSchema.safeParse({ full_name: 'Arben Krasniqi' })
    expect(result.success).toBe(true)
  })

  it('rejects missing full_name', () => {
    const result = createPatientSchema.safeParse({ full_name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = createPatientSchema.safeParse({ full_name: 'Test', email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('accepts empty string email (treated as no email)', () => {
    const result = createPatientSchema.safeParse({ full_name: 'Test', email: '' })
    expect(result.success).toBe(true)
  })
})
