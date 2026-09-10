import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createCheckoutDraft,
  firstAllowedCheckoutStep,
  safeCheckoutDraft,
  validateContact,
  validateDelivery,
} from './checkout'
import {
  readReceiptCapability,
  removeReceiptCapability,
  saveReceiptCapability,
} from './receiptCapability'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('checkout state machine', () => {
  it('guards steps in order without discarding a valid draft', () => {
    const draft = createCheckoutDraft()
    expect(firstAllowedCheckoutStep(draft)).toBe('contact')

    draft.contact = { email: 'guest@example.test' }
    expect(firstAllowedCheckoutStep(draft)).toBe('delivery')

    draft.delivery = {
      recipientName: 'Анна Пара',
      city: 'Москва',
      addressLine: 'Тестовая улица, 7',
    }
    expect(firstAllowedCheckoutStep(draft)).toBe('payment')

    draft.payment = 'demo_success'
    expect(firstAllowedCheckoutStep(draft)).toBe('review')
  })

  it('validates contact and delivery fields used by the forms', () => {
    expect(validateContact({ email: 'bad', phone: 'abc' })).toEqual({
      email: 'Введите корректный email.',
      phone: 'Проверьте формат телефона.',
    })
    expect(
      validateDelivery({ recipientName: 'A', city: '', addressLine: 'x' }),
    ).toEqual({
      recipientName: 'Укажите получателя.',
      city: 'Укажите город.',
      addressLine: 'Укажите полный адрес.',
    })
  })

  it('sanitizes persisted draft fields and rotates an invalid idempotency key', () => {
    const randomUUID = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    const draft = safeCheckoutDraft({
      idempotencyKey: 'not-a-uuid',
      contact: { email: 'x'.repeat(300), phone: '+79990000000', extra: 'drop' },
      delivery: {
        recipientName: 'Получатель',
        city: 'Москва',
        addressLine: 'Адрес для доставки',
        postalCode: '1'.repeat(30),
      },
      payment: 'real_card',
      cardNumber: '4111111111111111',
    })

    expect(randomUUID).toHaveBeenCalledOnce()
    expect(draft.idempotencyKey).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    expect(draft.contact?.email).toHaveLength(254)
    expect(draft.delivery?.postalCode).toHaveLength(16)
    expect(draft).not.toHaveProperty('payment')
    expect(JSON.stringify(draft)).not.toContain('4111111111111111')
  })
})

describe('guest receipt capability storage', () => {
  it('stores the opaque token only in sessionStorage and removes it explicitly', () => {
    saveReceiptCapability('PR-2026-001', 'opaque-secret')

    expect(readReceiptCapability('PR-2026-001')).toBe('opaque-secret')
    expect(JSON.stringify(localStorage)).not.toContain('opaque-secret')

    removeReceiptCapability('PR-2026-001')
    expect(readReceiptCapability('PR-2026-001')).toBeUndefined()
  })

  it('migrates a legacy same-session capability without changing the token', () => {
    sessionStorage.setItem('para:guest-receipt:PR-2026-002', 'legacy-opaque-secret')

    expect(readReceiptCapability('PR-2026-002')).toBe('legacy-opaque-secret')
    expect(sessionStorage.getItem('solecraft:guest-receipt:PR-2026-002')).toBe(
      'legacy-opaque-secret',
    )
    expect(sessionStorage.getItem('para:guest-receipt:PR-2026-002')).toBeNull()
  })
})
