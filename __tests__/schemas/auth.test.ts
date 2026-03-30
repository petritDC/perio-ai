import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '@/lib/schemas/auth'

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'dr@clinic.com', password: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'secret123' })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 chars', () => {
    const result = loginSchema.safeParse({ email: 'dr@clinic.com', password: 'short' })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'dr@clinic.com',
      password: 'secret123',
      fullName: 'Dr. Maya Chen',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty fullName', () => {
    const result = registerSchema.safeParse({
      email: 'dr@clinic.com',
      password: 'secret123',
      fullName: '',
    })
    expect(result.success).toBe(false)
  })
})
