// Password hashing with the built-in Web Crypto API (PBKDF2-SHA256, random salt).
// Only the salted hash is stored, never the password.

export type PasswordRecord = {
  salt: string
  hash: string
  iterations: number
}

export const MIN_PASSWORD_LENGTH = 4
const ITERATIONS = 600_000

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256,
  )
  return new Uint8Array(bits)
}

export async function createRecord(password: string, iterations = ITERATIONS): Promise<PasswordRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return { salt: toBase64(salt), hash: toBase64(await derive(password, salt, iterations)), iterations }
}

export async function verifyPassword(password: string, record: PasswordRecord): Promise<boolean> {
  const actual = await derive(password, fromBase64(record.salt), record.iterations)
  const expected = fromBase64(record.hash)
  if (actual.length !== expected.length) return false
  // Compare every byte so timing doesn't reveal where a guess went wrong.
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i]
  return diff === 0
}

/** Returns an error message, or null if the new password is acceptable. */
export function validateNewPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (password !== confirm) return 'The passwords don’t match.'
  return null
}
