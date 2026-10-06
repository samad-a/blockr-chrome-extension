import { describe, expect, it } from 'vitest'
import { createRecord, validateNewPassword, verifyPassword } from './password'

// A low iteration count keeps the tests fast; production uses far more.
const FAST = 1000

describe('password hashing', () => {
  it('accepts the right password and rejects a wrong one', async () => {
    const record = await createRecord('hunter22', FAST)
    expect(await verifyPassword('hunter22', record)).toBe(true)
    expect(await verifyPassword('hunter23', record)).toBe(false)
    expect(await verifyPassword('', record)).toBe(false)
  })

  it('never stores the password and salts every record differently', async () => {
    const a = await createRecord('same-password', FAST)
    const b = await createRecord('same-password', FAST)
    expect(JSON.stringify(a)).not.toContain('same-password')
    expect(a.salt).not.toBe(b.salt)
    expect(a.hash).not.toBe(b.hash)
  })
})

describe('validateNewPassword', () => {
  it('requires a minimum length and a matching confirmation', () => {
    expect(validateNewPassword('abc', 'abc')).toMatch(/at least 4/)
    expect(validateNewPassword('abcd', 'abce')).toMatch(/match/)
    expect(validateNewPassword('abcd', 'abcd')).toBeNull()
  })
})
