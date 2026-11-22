'use client'

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { Link, useRouter } from '@/i18n/navigation'

/**
 * Same-document View Transitions for App Router navigations.
 *
 * The page cross-fades like a turning catalogue leaf, and the photo of the piece you clicked
 * travels from its card into the product gallery (and back again from the product page to its
 * card in the catalogue). Browsers without `document.startViewTransition`, and visitors who
 * prefer reduced motion, simply navigate.
 *
 * How the shared photo works: every photo that can travel carries `data-vt-photo="<product id>"`.
 * Right before the transition the photo in the clicked link (or the page's primary photo) gets
 * `view-transition-name: vt-photo`; once the new route has committed, the photo with the same
 * product id on the new page gets the same name, so the browser morphs one into the other.
 */

type StartViewTransition = (update: () => Promise<void>) => { finished: Promise<void> }
type Navigate = () => void
type Start = (navigate: Navigate, source?: HTMLElement | null) => void

const SHARED_NAME = 'vt-photo'
const STORAGE_KEY = 've:vt-photo'
const MAX_WAIT_MS = 3500

const StartContext = createContext<Start | null>(null)

function clearSharedNames() {
  document.querySelectorAll<HTMLElement>('[data-vt-photo]').forEach((element) => {
    element.style.viewTransitionName = ''
  })
}

function isOnScreen(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight
}

function remember(id: string | null) {
  try {
    if (id) sessionStorage.setItem(STORAGE_KEY, id)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable (private mode) — the page transition still runs */
  }
}

function recall(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function ViewTransitionsProvider({ children }: { children: ReactNode }) {
  const [finish, setFinish] = useState<(() => void) | null>(null)

  // Runs after the new route has committed: name the destination photo, then let the browser animate.
  useEffect(() => {
    if (!finish) return
    const id = recall()
    if (id) {
      const target = document.querySelector<HTMLElement>(`[data-vt-photo="${CSS.escape(id)}"]`)
      if (target && isOnScreen(target)) target.style.viewTransitionName = SHARED_NAME
    }
    finish()
    setFinish(null)
  }, [finish])

  const start = useCallback<Start>((navigate, source) => {
    const startViewTransition = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition
    if (!startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate()
      return
    }

    clearSharedNames()
    const shared =
      source?.querySelector<HTMLElement>('[data-vt-photo]') ??
      document.querySelector<HTMLElement>('[data-vt-primary]')
    if (shared && isOnScreen(shared)) {
      shared.style.viewTransitionName = SHARED_NAME
      remember(shared.dataset.vtPhoto ?? null)
    } else {
      remember(null)
    }

    const transition = startViewTransition.call(document, () => new Promise<void>((resolve) => {
      // Never freeze the page for long if the next route is slow to load
      const fallback = window.setTimeout(resolve, MAX_WAIT_MS)
      startTransition(() => {
        navigate()
        setFinish(() => () => {
          window.clearTimeout(fallback)
          resolve()
        })
      })
    }))
    transition.finished.catch(() => {}).finally(clearSharedNames)
  }, [])

  return <StartContext.Provider value={start}>{children}</StartContext.Provider>
}

/** Drop-in replacement for the i18n `Link` that navigates through a view transition. */
export function TransitionLink({ href, onClick, locale, target, ...props }: ComponentProps<typeof Link>) {
  const router = useRouter()
  const start = useContext(StartContext)

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      !start ||
      typeof href !== 'string' ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (target && target !== '_self')
    ) {
      return
    }
    event.preventDefault()
    const source = event.currentTarget
    start(() => router.push(href, locale ? { locale } : undefined), source)
  }

  return <Link href={href} locale={locale} target={target} onClick={handleClick} {...props} />
}
