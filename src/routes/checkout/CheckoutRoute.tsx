import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'

import { checkoutStepPath, checkoutSuccessPath, paths } from '../../app/router/paths'
import { useCommerce } from '../../app/providers/CommerceProvider'
import type { CartRepository } from '../../entities/cart/api/CartRepository'
import { calculateCartTotals } from '../../entities/cart/model/cartTotals'
import { useCartView } from '../../entities/cart/ui/useCartView'
import type { CheckoutRepository } from '../../entities/checkout/api/CheckoutRepository'
import { CheckoutError } from '../../entities/checkout/api/CheckoutRepository'
import {
  createCheckoutDraft,
  firstAllowedCheckoutStep,
  safeCheckoutDraft,
  validateContact,
  validateDelivery,
  type CheckoutDraft,
  type CheckoutStep,
  type CheckoutValidationErrors,
  type DemoPaymentScenario,
} from '../../entities/checkout/model/checkout'
import { saveReceiptCapability } from '../../entities/checkout/model/receiptCapability'
import { formatMoney } from '../../shared/lib/formatMoney'
import {
  checkoutDraftStorageKey,
  legacyCheckoutDraftStorageKey,
  migrateStorageKey,
} from '../../shared/config/storageKeys'
import { Button } from '../../shared/ui/Button/Button'
import { useLocale } from '../../shared/i18n/locale'
import styles from './CheckoutRoute.module.scss'

const steps: CheckoutStep[] = ['contact', 'delivery', 'payment', 'review']
const errorTargetIds: Record<string, string> = {
  email: 'checkout-email',
  phone: 'checkout-phone',
  recipientName: 'checkout-recipient-name',
  city: 'checkout-city',
  addressLine: 'checkout-address',
  payment: 'checkout-payment',
}

function readDraft(): CheckoutDraft {
  try {
    migrateStorageKey(sessionStorage, checkoutDraftStorageKey, [
      legacyCheckoutDraftStorageKey,
    ])
    return safeCheckoutDraft(
      JSON.parse(sessionStorage.getItem(checkoutDraftStorageKey) ?? 'null'),
    )
  } catch {
    return createCheckoutDraft()
  }
}

function formText(data: FormData, name: string): string {
  const value = data.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

function ErrorSummary({
  errors,
  focusRef,
}: {
  errors: CheckoutValidationErrors
  focusRef: RefObject<HTMLDivElement | null>
}) {
  const { text } = useLocale()
  if (!Object.keys(errors).length) return null
  return (
    <div ref={focusRef} className={styles.errors} role="alert" tabIndex={-1}>
      <strong>{text('Проверьте поля', 'Check the fields')}</strong>
      <ul>
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>
            <a href={`#${errorTargetIds[field] ?? 'checkout-title'}`}>{error}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CheckoutRoute({
  checkoutRepository,
  cartRepository,
}: {
  checkoutRepository: CheckoutRepository
  cartRepository: CartRepository
}) {
  const { locale, intlLocale, text } = useLocale()
  const labels: Record<CheckoutStep, string> = {
    contact: text('Контакт', 'Contact'),
    delivery: text('Доставка', 'Delivery'),
    payment: text('Демо-оплата', 'Demo payment'),
    review: text('Проверка', 'Review'),
  }
  const navigate = useNavigate()
  const { step: rawStep = '' } = useParams()
  const validStep = steps.includes(rawStep as CheckoutStep)
  const step = validStep ? (rawStep as CheckoutStep) : 'contact'
  const commerce = useCommerce()
  const cartView = useCartView(cartRepository)
  const [draft, setDraftState] = useState(readDraft)
  const [errors, setErrors] = useState<CheckoutValidationErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const totals = calculateCartTotals(cartView.subtotal)

  const setDraft = (next: CheckoutDraft) => {
    setDraftState(next)
    sessionStorage.setItem(checkoutDraftStorageKey, JSON.stringify(next))
  }

  const allowed = firstAllowedCheckoutStep(draft)
  const allowedIndex = steps.indexOf(allowed)
  const stepIndex = steps.indexOf(step)
  if (!created && !commerce.cartPending && commerce.cartLines.length === 0) {
    return <Navigate to={paths.cart} replace />
  }
  if (!validStep) {
    return <Navigate to={paths.checkoutContact} replace />
  }
  if (stepIndex > allowedIndex) {
    return <Navigate to={checkoutStepPath(allowed)} replace />
  }

  const focusErrors = (next: CheckoutValidationErrors) => {
    setErrors(next)
    requestAnimationFrame(() => errorRef.current?.focus())
  }

  const saveContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const contact = { email: formText(data, 'email'), phone: formText(data, 'phone') }
    const nextErrors = validateContact(contact, locale)
    if (Object.keys(nextErrors).length) return focusErrors(nextErrors)
    setErrors({})
    setDraft({ ...draft, contact })
    void navigate(checkoutStepPath('delivery'))
  }

  const saveDelivery = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const delivery = {
      recipientName: formText(data, 'recipientName'),
      city: formText(data, 'city'),
      addressLine: formText(data, 'addressLine'),
      postalCode: formText(data, 'postalCode'),
    }
    const nextErrors = validateDelivery(delivery, locale)
    if (Object.keys(nextErrors).length) return focusErrors(nextErrors)
    setErrors({})
    setDraft({ ...draft, delivery })
    void navigate(checkoutStepPath('payment'))
  }

  const savePayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payment = new FormData(event.currentTarget).get(
      'payment',
    ) as DemoPaymentScenario | null
    if (!payment)
      return focusErrors({
        payment: text('Выберите демо-сценарий.', 'Choose a demo scenario.'),
      })
    setErrors({})
    setDraft({ ...draft, payment })
    void navigate(checkoutStepPath('review'))
  }

  const submitOrder = async () => {
    if (!draft.contact || !draft.delivery || !draft.payment || submitting) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const result = await checkoutRepository.createOrder({
        lines: commerce.cartLines,
        draft: {
          contact: draft.contact,
          delivery: draft.delivery,
          payment: draft.payment,
          idempotencyKey: draft.idempotencyKey,
        },
      })
      if (result.receiptToken)
        saveReceiptCapability(result.orderNumber, result.receiptToken)
      sessionStorage.removeItem(checkoutDraftStorageKey)
      sessionStorage.removeItem(legacyCheckoutDraftStorageKey)
      setCreated(true)
      commerce.clearCart()
      void navigate(checkoutSuccessPath(result.orderNumber), { replace: true })
    } catch (error) {
      const kind = error instanceof CheckoutError ? error.kind : 'backend'
      setSubmitError(
        kind === 'declined'
          ? text(
              'Демо-платёж отклонён. Выберите успешный сценарий или повторите.',
              'Demo payment declined. Choose the success scenario or retry.',
            )
          : kind === 'timeout'
            ? text(
                'Демо-платёж не ответил. Корзина сохранена — повторите.',
                'Demo payment timed out. Your cart is preserved—retry.',
              )
            : kind === 'conflict'
              ? text(
                  'Остаток изменился. Вернитесь в корзину и обновите позицию.',
                  'Stock changed. Return to the cart and update the item.',
                )
              : text(
                  'Заказ не создан. Данные и корзина сохранены для повтора.',
                  'Order not created. Your data and cart are preserved for retry.',
                ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={styles.page} aria-labelledby="checkout-title">
      <header>
        <p>
          {text('Оформление / шаг', 'Checkout / step')} {stepIndex + 1}{' '}
          {text('из', 'of')} 4
        </p>
        <h1 id="checkout-title">{labels[step]}</h1>
      </header>
      <ol
        className={styles.steps}
        aria-label={text('Шаги оформления', 'Checkout steps')}
      >
        {steps.map((item, index) => (
          <li key={item} aria-current={item === step ? 'step' : undefined}>
            <span>{index + 1}</span>
            {labels[item]}
          </li>
        ))}
      </ol>
      <ErrorSummary errors={errors} focusRef={errorRef} />

      {step === 'contact' ? (
        <form className={styles.form} onSubmit={saveContact} noValidate>
          <label htmlFor="checkout-email">
            Email
            <input
              id="checkout-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={Boolean(errors.email) || undefined}
              aria-describedby={errors.email ? 'checkout-email-error' : undefined}
              defaultValue={draft.contact?.email ?? ''}
            />
            {errors.email ? (
              <span id="checkout-email-error" className={styles.fieldError}>
                {errors.email}
              </span>
            ) : null}
          </label>
          <label htmlFor="checkout-phone">
            {text('Телефон, необязательно', 'Phone, optional')}
            <input
              id="checkout-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone) || undefined}
              aria-describedby={errors.phone ? 'checkout-phone-error' : undefined}
              defaultValue={draft.contact?.phone ?? ''}
            />
            {errors.phone ? (
              <span id="checkout-phone-error" className={styles.fieldError}>
                {errors.phone}
              </span>
            ) : null}
          </label>
          <Button type="submit">{text('К доставке', 'Continue to delivery')}</Button>
        </form>
      ) : null}

      {step === 'delivery' ? (
        <form className={styles.form} onSubmit={saveDelivery} noValidate>
          <label htmlFor="checkout-recipient-name">
            {text('Получатель', 'Recipient')}
            <input
              id="checkout-recipient-name"
              name="recipientName"
              autoComplete="name"
              required
              aria-invalid={Boolean(errors.recipientName) || undefined}
              aria-describedby={
                errors.recipientName ? 'checkout-recipient-name-error' : undefined
              }
              defaultValue={draft.delivery?.recipientName ?? ''}
            />
            {errors.recipientName ? (
              <span id="checkout-recipient-name-error" className={styles.fieldError}>
                {errors.recipientName}
              </span>
            ) : null}
          </label>
          <label htmlFor="checkout-city">
            {text('Город', 'City')}
            <input
              id="checkout-city"
              name="city"
              autoComplete="address-level2"
              required
              aria-invalid={Boolean(errors.city) || undefined}
              aria-describedby={errors.city ? 'checkout-city-error' : undefined}
              defaultValue={draft.delivery?.city ?? ''}
            />
            {errors.city ? (
              <span id="checkout-city-error" className={styles.fieldError}>
                {errors.city}
              </span>
            ) : null}
          </label>
          <label htmlFor="checkout-address">
            {text('Адрес', 'Address')}
            <input
              id="checkout-address"
              name="addressLine"
              autoComplete="street-address"
              required
              aria-invalid={Boolean(errors.addressLine) || undefined}
              aria-describedby={
                errors.addressLine ? 'checkout-address-error' : undefined
              }
              defaultValue={draft.delivery?.addressLine ?? ''}
            />
            {errors.addressLine ? (
              <span id="checkout-address-error" className={styles.fieldError}>
                {errors.addressLine}
              </span>
            ) : null}
          </label>
          <label htmlFor="checkout-postal-code">
            {text('Индекс, необязательно', 'Postal code, optional')}
            <input
              id="checkout-postal-code"
              name="postalCode"
              inputMode="numeric"
              autoComplete="postal-code"
              defaultValue={draft.delivery?.postalCode ?? ''}
            />
          </label>
          <div className={styles.actions}>
            <Link to={checkoutStepPath('contact')}>{text('Назад', 'Back')}</Link>
            <Button type="submit">
              {text('К демо-оплате', 'Continue to demo payment')}
            </Button>
          </div>
        </form>
      ) : null}

      {step === 'payment' ? (
        <form className={styles.form} onSubmit={savePayment}>
          <div className={styles.demoNotice}>
            <strong>{text('Только демонстрация', 'Demo only')}</strong>
            <p>
              {text(
                'Мы не запрашиваем номер карты, CVV, срок действия или реальные платёжные credentials.',
                'We do not request a card number, CVV, expiry date, or real payment credentials.',
              )}
            </p>
          </div>
          <fieldset
            id="checkout-payment"
            aria-invalid={Boolean(errors.payment) || undefined}
            aria-describedby={errors.payment ? 'checkout-payment-error' : undefined}
          >
            <legend>{text('Сценарий демо-платежа', 'Demo payment scenario')}</legend>
            <label>
              <input
                type="radio"
                name="payment"
                value="demo_success"
                defaultChecked={draft.payment === 'demo_success'}
              />
              {text('Успешная демо-оплата', 'Successful demo payment')}
            </label>
            <label>
              <input
                type="radio"
                name="payment"
                value="demo_decline"
                defaultChecked={draft.payment === 'demo_decline'}
              />
              {text('Отклонение для проверки ошибки', 'Decline to test recovery')}
            </label>
            <label>
              <input
                type="radio"
                name="payment"
                value="demo_timeout"
                defaultChecked={draft.payment === 'demo_timeout'}
              />
              {text('Таймаут для проверки повтора', 'Timeout to test retry')}
            </label>
            {errors.payment ? (
              <p id="checkout-payment-error" className={styles.fieldError}>
                {errors.payment}
              </p>
            ) : null}
          </fieldset>
          <div className={styles.actions}>
            <Link to={checkoutStepPath('delivery')}>{text('Назад', 'Back')}</Link>
            <Button type="submit">{text('Проверить заказ', 'Review order')}</Button>
          </div>
        </form>
      ) : null}

      {step === 'review' ? (
        <div className={styles.review}>
          <div>
            <h2>{text('Контакт и доставка', 'Contact and delivery')}</h2>
            <p>{draft.contact?.email}</p>
            <p>
              {draft.delivery?.recipientName}, {draft.delivery?.city},{' '}
              {draft.delivery?.addressLine}
            </p>
            <Link to={checkoutStepPath('contact')}>{text('Изменить', 'Edit')}</Link>
          </div>
          <div>
            <h2>{text('Состав', 'Items')}</h2>
            <p>
              {text('Позиций', 'Lines')}: {commerce.cartLines.length}.{' '}
              {text('Количество', 'Quantity')}:{' '}
              {commerce.cartLines.reduce((sum, line) => sum + line.quantity, 0)}.
            </p>
            <p>
              {text(
                'Сервер повторно проверит точные SKU, цены и остатки.',
                'The server will recheck exact SKUs, prices, and stock.',
              )}
            </p>
            <Link to={paths.cart}>{text('Изменить корзину', 'Edit cart')}</Link>
          </div>
          <aside aria-label={text('Итого заказа', 'Order total')}>
            <p>
              <span>{text('Подытог', 'Subtotal')}</span>
              <strong>
                {formatMoney(
                  { amountMinor: totals.subtotalMinor, currency: 'RUB' },
                  intlLocale,
                )}
              </strong>
            </p>
            <p>
              <span>{text('Доставка', 'Delivery')}</span>
              <strong>
                {totals.deliveryMinor
                  ? formatMoney(
                      { amountMinor: totals.deliveryMinor, currency: 'RUB' },
                      intlLocale,
                    )
                  : text('Бесплатно', 'Free')}
              </strong>
            </p>
            <p>
              <span>{text('Итого', 'Total')}</span>
              <strong>
                {formatMoney(
                  {
                    amountMinor: totals.estimatedTotalMinor,
                    currency: 'RUB',
                  },
                  intlLocale,
                )}
              </strong>
            </p>
          </aside>
          {submitError ? (
            <div className={styles.submitError} role="alert">
              {submitError}
            </div>
          ) : null}
          <Button
            type="button"
            isLoading={submitting}
            onClick={() => void submitOrder()}
          >
            {text('Создать демо-заказ', 'Create demo order')}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
