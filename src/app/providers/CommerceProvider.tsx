/* eslint-disable react-refresh/only-export-components */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import type { OwnerCommerceRepository } from '../../entities/account/api/OwnerCommerceRepository'
import type { CartHandoff, CartLineInput } from '../../entities/cart/model/cartHandoff'
import type { GuestCartLine } from '../../entities/cart/model/guestCartStore'
import { useGuestCartStore } from '../../entities/cart/model/guestCartStore'
import { useGuestWishlistStore } from '../../entities/wishlist/model/guestWishlistStore'
import { useLocale } from '../../shared/i18n/locale'
import { useAuth } from './AuthProvider'

type CommerceContextValue = {
  cartLines: GuestCartLine[]
  cartPending: boolean
  addCartLine: (input: CartLineInput) => void
  setCartQuantity: (inventoryId: string, quantity: number) => void
  removeCartLine: (inventoryId: string) => GuestCartLine | undefined
  restoreCartLine: (line: GuestCartLine) => void
  clearCart: () => void
  wishlistProductIds: string[]
  wishlistPending: boolean
  toggleWishlist: (productId: string) => void
  mergeStatus: 'idle' | 'merging' | 'success' | 'error'
  announcement?: { id: number; text: string }
}

const CommerceContext = createContext<CommerceContextValue | undefined>(undefined)

export function CommerceProvider({
  repository,
  children,
}: {
  repository: OwnerCommerceRepository
  children: ReactNode
}) {
  const auth = useAuth()
  const { text } = useLocale()
  const queryClient = useQueryClient()
  const guestCartLines = useGuestCartStore((state) => state.lines)
  const guestWishlistIds = useGuestWishlistStore((state) => state.productIds)
  const [mergeStatus, setMergeStatus] =
    useState<CommerceContextValue['mergeStatus']>('idle')
  const [announcement, setAnnouncement] =
    useState<CommerceContextValue['announcement']>()
  const announcementId = useRef(0)
  const mergeInFlight = useRef(false)
  const userId = auth.user?.id
  const announce = useCallback((text: string) => {
    announcementId.current += 1
    setAnnouncement({ id: announcementId.current, text })
  }, [])

  const cartKey = useMemo(() => ['owner', userId, 'cart'] as const, [userId])
  const wishlistKey = useMemo(() => ['owner', userId, 'wishlist'] as const, [userId])
  const ownerCart = useQuery({
    queryKey: cartKey,
    queryFn: () => repository.getCart(),
    enabled: Boolean(userId),
  })
  const ownerWishlist = useQuery({
    queryKey: wishlistKey,
    queryFn: () => repository.getWishlistIds(),
    enabled: Boolean(userId),
  })

  useEffect(() => {
    if (
      !userId ||
      mergeInFlight.current ||
      (!guestCartLines.length && !guestWishlistIds.length)
    )
      return
    const cartSnapshot = [...guestCartLines]
    const wishlistSnapshot = [...guestWishlistIds]
    mergeInFlight.current = true
    setMergeStatus('merging')
    void repository.mergeGuest(cartSnapshot, wishlistSnapshot).then(
      async () => {
        useGuestCartStore.getState().consumeMerged(cartSnapshot)
        useGuestWishlistStore.getState().consumeMerged(wishlistSnapshot)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: cartKey }),
          queryClient.invalidateQueries({ queryKey: wishlistKey }),
        ])
        setMergeStatus('success')
        mergeInFlight.current = false
      },
      () => {
        setMergeStatus('error')
        announce(
          text(
            'Не удалось объединить гостевые данные. Локальная копия сохранена.',
            'Could not merge guest data. The local copy is preserved.',
          ),
        )
        mergeInFlight.current = false
      },
    )
  }, [
    cartKey,
    guestCartLines,
    guestWishlistIds,
    queryClient,
    repository,
    announce,
    text,
    userId,
    wishlistKey,
  ])

  const cartMutation = useMutation({
    mutationFn: async (action: {
      type: 'quantity' | 'remove' | 'restore' | 'clear'
      line?: GuestCartLine
      inventoryId?: string
      quantity?: number
    }) => {
      if (action.type === 'quantity')
        await repository.setCartQuantity(action.inventoryId!, action.quantity!)
      if (action.type === 'remove') await repository.removeCartLine(action.inventoryId!)
      if (action.type === 'restore') await repository.mergeGuest([action.line!], [])
      if (action.type === 'clear') await repository.clearCart()
    },
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey: cartKey })
      const previous = queryClient.getQueryData<GuestCartLine[]>(cartKey) ?? []
      const next =
        action.type === 'clear'
          ? []
          : action.type === 'remove'
            ? previous.filter((line) => line.inventoryId !== action.inventoryId)
            : action.type === 'restore'
              ? [
                  ...previous.filter(
                    (line) => line.inventoryId !== action.line!.inventoryId,
                  ),
                  action.line!,
                ]
              : previous.map((line) =>
                  line.inventoryId === action.inventoryId
                    ? {
                        ...line,
                        quantity: action.quantity!,
                        updatedAt: new Date().toISOString(),
                      }
                    : line,
                )
      queryClient.setQueryData(cartKey, next)
      return { previous }
    },
    onError: (_error, _action, context) => {
      queryClient.setQueryData(cartKey, context?.previous)
      announce(
        text(
          'Изменение корзины не сохранено. Предыдущее состояние восстановлено.',
          'The cart change was not saved. The previous state was restored.',
        ),
      )
    },
    onSuccess: (_data, action) => {
      announce(
        action.type === 'quantity'
          ? text('Количество в корзине обновлено.', 'Cart quantity updated.')
          : action.type === 'remove'
            ? text('Позиция удалена из корзины.', 'Item removed from cart.')
            : action.type === 'restore'
              ? text('Позиция возвращена в корзину.', 'Item restored to cart.')
              : text('Корзина очищена.', 'Cart cleared.'),
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: cartKey }),
  })

  const wishlistMutation = useMutation({
    mutationFn: async ({ productId, add }: { productId: string; add: boolean }) => {
      if (add) await repository.addWishlist(productId)
      else await repository.removeWishlist(productId)
    },
    onMutate: async ({ productId, add }) => {
      await queryClient.cancelQueries({ queryKey: wishlistKey })
      const previous = queryClient.getQueryData<string[]>(wishlistKey) ?? []
      queryClient.setQueryData(
        wishlistKey,
        add
          ? [...new Set([...previous, productId])]
          : previous.filter((id) => id !== productId),
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(wishlistKey, context?.previous)
      announce(
        text(
          'Изменение избранного не сохранено. Предыдущее состояние восстановлено.',
          'The wishlist change was not saved. The previous state was restored.',
        ),
      )
    },
    onSuccess: (_data, variables) =>
      announce(
        variables.add
          ? text('Товар добавлен в избранное.', 'Product added to wishlist.')
          : text('Товар убран из избранного.', 'Product removed from wishlist.'),
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: wishlistKey }),
  })

  const cartLines = useMemo(
    () => (userId ? (ownerCart.data ?? []) : guestCartLines),
    [guestCartLines, ownerCart.data, userId],
  )
  const wishlistProductIds = useMemo(
    () => (userId ? (ownerWishlist.data ?? []) : guestWishlistIds),
    [guestWishlistIds, ownerWishlist.data, userId],
  )
  const value = useMemo<CommerceContextValue>(
    () => ({
      cartLines,
      cartPending: cartMutation.isPending || (Boolean(userId) && ownerCart.isPending),
      addCartLine(input) {
        if (cartMutation.isPending) return
        if (!userId) {
          useGuestCartStore.getState().add(input)
          return
        }
        const current = cartLines.find((line) => line.inventoryId === input.inventoryId)
        const maximum = Math.min(10, input.maxQuantity ?? 10)
        const quantity = Math.min(maximum, (current?.quantity ?? 0) + input.quantity)
        cartMutation.mutate({
          type: 'restore',
          line: {
            inventoryId: input.inventoryId,
            quantity,
            updatedAt: new Date().toISOString(),
          },
        })
      },
      setCartQuantity(inventoryId, quantity) {
        if (cartMutation.isPending) return
        if (userId) cartMutation.mutate({ type: 'quantity', inventoryId, quantity })
        else {
          useGuestCartStore.getState().setQuantity(inventoryId, quantity)
          announce(text('Количество в корзине обновлено.', 'Cart quantity updated.'))
        }
      },
      removeCartLine(inventoryId) {
        const line = cartLines.find((item) => item.inventoryId === inventoryId)
        if (!line || cartMutation.isPending) return undefined
        if (userId) cartMutation.mutate({ type: 'remove', inventoryId })
        else {
          useGuestCartStore.getState().remove(inventoryId)
          announce(text('Позиция удалена из корзины.', 'Item removed from cart.'))
        }
        return line
      },
      restoreCartLine(line) {
        if (cartMutation.isPending) return
        if (userId) cartMutation.mutate({ type: 'restore', line })
        else {
          useGuestCartStore.getState().restore(line)
          announce(text('Позиция возвращена в корзину.', 'Item restored to cart.'))
        }
      },
      clearCart() {
        if (cartMutation.isPending) return
        if (userId) cartMutation.mutate({ type: 'clear' })
        else {
          useGuestCartStore.getState().clear()
          announce(text('Корзина очищена.', 'Cart cleared.'))
        }
      },
      wishlistProductIds,
      wishlistPending:
        wishlistMutation.isPending || (Boolean(userId) && ownerWishlist.isPending),
      toggleWishlist(productId) {
        if (wishlistMutation.isPending) return
        if (userId)
          wishlistMutation.mutate({
            productId,
            add: !wishlistProductIds.includes(productId),
          })
        else {
          const wasActive = wishlistProductIds.includes(productId)
          useGuestWishlistStore.getState().toggle(productId)
          announce(
            wasActive
              ? text('Товар убран из избранного.', 'Product removed from wishlist.')
              : text('Товар добавлен в избранное.', 'Product added to wishlist.'),
          )
        }
      },
      mergeStatus,
      ...(announcement ? { announcement } : {}),
    }),
    [
      cartLines,
      cartMutation,
      announce,
      announcement,
      mergeStatus,
      ownerCart.isPending,
      ownerWishlist.isPending,
      userId,
      wishlistMutation,
      wishlistProductIds,
      text,
    ],
  )

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>
}

export function useCommerce() {
  const value = useContext(CommerceContext)
  const guestCartLines = useGuestCartStore((state) => state.lines)
  const guestWishlistIds = useGuestWishlistStore((state) => state.productIds)
  return (
    value ?? {
      cartLines: guestCartLines,
      cartPending: false,
      addCartLine: (input: CartLineInput) => useGuestCartStore.getState().add(input),
      setCartQuantity: (inventoryId: string, quantity: number) =>
        useGuestCartStore.getState().setQuantity(inventoryId, quantity),
      removeCartLine: (inventoryId: string) =>
        useGuestCartStore.getState().remove(inventoryId),
      restoreCartLine: (line: GuestCartLine) =>
        useGuestCartStore.getState().restore(line),
      clearCart: () => useGuestCartStore.getState().clear(),
      wishlistProductIds: guestWishlistIds,
      wishlistPending: false,
      toggleWishlist: (productId: string) =>
        useGuestWishlistStore.getState().toggle(productId),
      mergeStatus: 'idle',
    }
  )
}

export function useCommerceCartHandoff(fallback: CartHandoff): CartHandoff {
  const value = useContext(CommerceContext)
  return useMemo(
    () => (value ? { add: value.addCartLine } : fallback),
    [fallback, value],
  )
}
