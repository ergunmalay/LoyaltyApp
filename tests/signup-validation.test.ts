import { describe, it, expect } from 'vitest'

// ── Copied from signup page (keep in sync) ────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NAME_RE = /^[a-zA-Z\s'\-]{2,50}$/

function validateField(field: string, value: string): string {
  switch (field) {
    case 'businessName':
      if (!value.trim()) return 'Business name is required'
      if (value.trim().length < 2) return 'Must be at least 2 characters'
      if (value.trim().length > 50) return 'Must be 50 characters or fewer'
      return ''
    case 'yourName':
      if (!value.trim()) return 'Your name is required'
      if (!NAME_RE.test(value.trim())) return 'Letters, spaces, hyphens and apostrophes only'
      return ''
    case 'email':
      if (!value.trim()) return 'Email is required'
      if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address'
      return ''
    case 'password':
      if (!value) return 'Password is required'
      if (value.length < 8) return 'Must be at least 8 characters'
      if (!/[0-9]/.test(value)) return 'Include at least one number'
      return ''
    default:
      return ''
  }
}

function friendlyAuthError(message: string): string {
  if (/user already registered/i.test(message)) return 'An account with this email already exists.'
  if (/invalid email/i.test(message)) return 'Please enter a valid email address.'
  if (/password should be at least/i.test(message)) return 'Password must be at least 8 characters.'
  if (/too many requests/i.test(message)) return 'Too many attempts. Please wait a moment.'
  return message
}

// ── Business name ─────────────────────────────────────────────────────────────
describe('validateField — businessName', () => {
  it('rejects empty string', () => {
    expect(validateField('businessName', '')).toBe('Business name is required')
  })
  it('rejects whitespace-only', () => {
    expect(validateField('businessName', '   ')).toBe('Business name is required')
  })
  it('rejects single character', () => {
    expect(validateField('businessName', 'A')).toBe('Must be at least 2 characters')
  })
  it('rejects names over 50 characters', () => {
    expect(validateField('businessName', 'A'.repeat(51))).toBe('Must be 50 characters or fewer')
  })
  it('accepts a normal business name', () => {
    expect(validateField('businessName', 'Grind House')).toBe('')
  })
  it('accepts exactly 50 characters', () => {
    expect(validateField('businessName', 'A'.repeat(50))).toBe('')
  })
})

// ── Your name ─────────────────────────────────────────────────────────────────
describe('validateField — yourName', () => {
  it('rejects empty string', () => {
    expect(validateField('yourName', '')).toBe('Your name is required')
  })
  it('rejects names with numbers', () => {
    expect(validateField('yourName', 'John123')).toBe('Letters, spaces, hyphens and apostrophes only')
  })
  it('rejects names with special characters', () => {
    expect(validateField('yourName', 'John@Doe')).toBe('Letters, spaces, hyphens and apostrophes only')
  })
  it('accepts letters and spaces', () => {
    expect(validateField('yourName', 'Jane Smith')).toBe('')
  })
  it('accepts hyphenated names', () => {
    expect(validateField('yourName', 'Mary-Jane')).toBe('')
  })
  it("accepts names with apostrophes", () => {
    expect(validateField('yourName', "O'Brien")).toBe('')
  })
})

// ── Email ─────────────────────────────────────────────────────────────────────
describe('validateField — email', () => {
  it('rejects empty string', () => {
    expect(validateField('email', '')).toBe('Email is required')
  })
  it('rejects missing @', () => {
    expect(validateField('email', 'notanemail')).toBe('Enter a valid email address')
  })
  it('rejects missing domain', () => {
    expect(validateField('email', 'user@')).toBe('Enter a valid email address')
  })
  it('rejects missing TLD', () => {
    expect(validateField('email', 'user@domain')).toBe('Enter a valid email address')
  })
  it('rejects single-char TLD', () => {
    expect(validateField('email', 'user@domain.c')).toBe('Enter a valid email address')
  })
  it('accepts a valid email', () => {
    expect(validateField('email', 'user@example.com')).toBe('')
  })
  it('accepts email with subdomains', () => {
    expect(validateField('email', 'user@mail.example.co.uk')).toBe('')
  })
  it('trims whitespace before validating', () => {
    expect(validateField('email', '  user@example.com  ')).toBe('')
  })
})

// ── Password ──────────────────────────────────────────────────────────────────
describe('validateField — password', () => {
  it('rejects empty string', () => {
    expect(validateField('password', '')).toBe('Password is required')
  })
  it('rejects passwords under 8 characters', () => {
    expect(validateField('password', 'abc1234')).toBe('Must be at least 8 characters')
  })
  it('rejects passwords without a number', () => {
    expect(validateField('password', 'abcdefgh')).toBe('Include at least one number')
  })
  it('accepts a valid password', () => {
    expect(validateField('password', 'ergun123')).toBe('')
  })
  it('accepts password with number at start', () => {
    expect(validateField('password', '1abcdefg')).toBe('')
  })
  it('accepts exactly 8 characters with a number', () => {
    expect(validateField('password', 'abcdefg1')).toBe('')
  })
})

// ── Friendly auth errors ──────────────────────────────────────────────────────
describe('friendlyAuthError', () => {
  it('maps user already registered', () => {
    expect(friendlyAuthError('User already registered')).toBe('An account with this email already exists.')
  })
  it('maps invalid email', () => {
    expect(friendlyAuthError('invalid email address')).toBe('Please enter a valid email address.')
  })
  it('maps password too short', () => {
    expect(friendlyAuthError('Password should be at least 6 characters')).toBe('Password must be at least 8 characters.')
  })
  it('maps rate limit', () => {
    expect(friendlyAuthError('too many requests')).toBe('Too many attempts. Please wait a moment.')
  })
  it('passes through unknown errors unchanged', () => {
    expect(friendlyAuthError('Some unexpected error')).toBe('Some unexpected error')
  })
})
