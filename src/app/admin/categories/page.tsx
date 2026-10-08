'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { AlertCircle, ChevronRight, FolderOpen, Loader2, Plus, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { CategoryModal, type AdminCategory } from '@/components/admin/CategoryModal'
import { SortableCategoryList } from '@/components/admin/SortableCategoryList'
import CategoriesLoading from './loading'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [deleting, setDeleting] = useState<AdminCategory | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'reorder' | 'delete' | null>(null)
  const mutationLock = useRef(false)
  const addButton = useRef<HTMLButtonElement>(null)
  const deleteTrigger = useRef<HTMLElement | null>(null)

  const loadCategories = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/categories', { cache: 'no-store', signal })
      const data = await response.json()
      if (!response.ok || !Array.isArray(data.categories)) throw new Error(typeof data.error === 'string' ? data.error : 'Unable to load categories.')
      if (!signal?.aborted) setCategories(data.categories)
    } catch (failure) {
      if (!signal?.aborted) setError(failure instanceof Error ? failure.message : 'Unable to load categories. Please try again.')
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
        setHasLoaded(true)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadCategories(controller.signal)
    return () => controller.abort()
  }, [loadCategories])

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function onSaved(category: AdminCategory) {
    setCategories((current) => {
      const existing = current.find((item) => item.id === category.id)
      const saved = { ...category, product_count: category.product_count ?? existing?.product_count ?? 0 }
      return (existing ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved])
        .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
    })
  }

  async function reorder(next: AdminCategory[]) {
    if (mutationLock.current || search.trim()) return
    mutationLock.current = true
    setBusy('reorder')
    setCategories(next)
    try {
      const response = await fetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((category) => category.id) }),
      })
      const data = await response.json()
      if (!response.ok || !Array.isArray(data.categories)) throw new Error(typeof data.error === 'string' ? data.error : 'Unable to save category order.')
      setCategories(data.categories)
      toast.success('Category order saved')
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : 'Unable to save category order.')
      await loadCategories()
    } finally {
      setBusy(null)
      mutationLock.current = false
    }
  }

  async function deleteCategory() {
    if (!deleting || mutationLock.current || (deleting.product_count ?? 0) > 0) return
    mutationLock.current = true
    setBusy('delete')
    setDeleteError(null)
    try {
      const response = await fetch(`/api/admin/categories/${deleting.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok || data.ok !== true) {
        if (typeof data.product_count === 'number') {
          const count = data.product_count
          setDeleting((current) => current ? { ...current, product_count: count } : null)
          setCategories((current) => current.map((category) => category.id === deleting.id ? { ...category, product_count: count } : category))
        }
        throw new Error(typeof data.error === 'string' ? data.error : 'Unable to delete category.')
      }
      setCategories((current) => current.filter((category) => category.id !== deleting.id))
      setDeleting(null)
      toast.success('Category deleted')
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : 'Unable to delete category. Please try again.'
      setDeleteError(message)
      toast.error(message)
    } finally {
      setBusy(null)
      mutationLock.current = false
    }
  }

  const query = search.trim().toLocaleLowerCase()
  const visibleCategories = categories.filter((category) => !query || [category.name_en, category.name_ru, category.name_de, category.slug].some((value) => value?.toLocaleLowerCase().includes(query)))
  const activeCount = categories.filter((category) => category.is_active).length
  const hasProducts = (deleting?.product_count ?? 0) > 0

  if (loading && !hasLoaded) return <CategoriesLoading />

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-[11px] text-[var(--fg-muted)]">
        <Link href="/admin" className="hover:text-[var(--admin-accent-text)]">Admin</Link>
        <ChevronRight size={12} aria-hidden="true" />
        <span aria-current="page">Categories</span>
      </nav>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--admin-accent-text)]">Catalog organisation</p>
          <h1 className="font-serif text-3xl">Categories</h1>
          <p className="mt-2 text-xs leading-relaxed text-[var(--fg-muted)]">Curate your collections and set their order in the catalog.</p>
        </div>
        <button ref={addButton} type="button" onClick={openCreate} disabled={Boolean(busy) || Boolean(error) || loading} className="admin-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
          <Plus size={15} aria-hidden="true" />New category
        </button>
      </header>

      {error ? (
        <section role="alert" className="admin-card px-6 py-12 text-center">
          <AlertCircle size={28} aria-hidden="true" className="mx-auto mb-4 text-[var(--admin-accent-text)]" />
          <h2 className="font-serif text-2xl">Categories could not be loaded</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--fg-muted)]">{error}</p>
          <button type="button" onClick={() => void loadCategories()} className="admin-secondary mt-6">Try again</button>
        </section>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-y border-[var(--border)] py-4">
            <p className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)]"><span className="font-semibold text-[var(--fg)]">{categories.length}</span> categories <span aria-hidden="true" className="mx-2">/</span> <span className="font-semibold text-[var(--fg)]">{activeCount}</span> active</p>
            <div className="relative w-full sm:w-80">
              <label htmlFor="category-search" className="sr-only">Search categories by name or slug</label>
              <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
              <input id="category-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or slug…" className="admin-input !pl-9 !pr-10" />
              {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear category search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--fg-muted)] hover:text-[var(--fg)]"><X size={14} aria-hidden="true" /></button>}
            </div>
          </div>
          <p role="status" className="mb-4 text-xs text-[var(--fg-muted)]">
            {loading ? 'Refreshing categories…' : busy === 'reorder' ? 'Saving catalog order…' : query ? `${visibleCategories.length} matching ${visibleCategories.length === 1 ? 'category' : 'categories'}. Clear search to reorder.` : 'Drag the handles to reorder. With a keyboard, press Space, use the arrow keys, then Space to save.'}
          </p>
          {visibleCategories.length > 0 ? (
            <SortableCategoryList categories={visibleCategories} disabled={Boolean(busy) || loading} reorderDisabled={Boolean(query)} onReorder={(next) => void reorder(next)} onEdit={(category) => { setEditing(category); setModalOpen(true) }} onDelete={(category) => { deleteTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setDeleting(category); setDeleteError(null) }} />
          ) : (
            <section className="admin-card px-6 py-16 text-center">
              <FolderOpen size={32} aria-hidden="true" className="mx-auto mb-4 text-[var(--admin-accent-text)]" />
              <h2 className="font-serif text-2xl">{query ? 'No matching categories' : 'Begin your first collection'}</h2>
              <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-[var(--fg-muted)]">{query ? 'Try another name or slug, or clear your search to see every collection.' : 'Create a category to give your antiques a place in the catalog. You can add translations and arrange collections here.'}</p>
              <button type="button" onClick={query ? () => setSearch('') : openCreate} className="admin-secondary mt-6">{query ? 'Clear search' : 'Create first category'}</button>
            </section>
          )}
        </>
      )}

      <CategoryModal open={modalOpen} onOpenChange={setModalOpen} category={editing} onSaved={onSaved} />
      <AlertDialog.Root open={Boolean(deleting)} onOpenChange={(open) => { if (!open && busy !== 'delete') setDeleting(null) }}>
        <AlertDialog.Portal>
          <div className="admin-theme text-[var(--fg)]">
            <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
            <AlertDialog.Content className="admin-card fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6 shadow-xl" onEscapeKeyDown={(event) => { if (busy === 'delete') event.preventDefault() }} onCloseAutoFocus={(event) => { event.preventDefault(); (deleteTrigger.current?.isConnected ? deleteTrigger.current : addButton.current)?.focus() }}>
              <AlertDialog.Title className="font-serif text-2xl">{hasProducts ? 'Category is in use' : 'Delete category?'}</AlertDialog.Title>
              <AlertDialog.Description className="mt-3 break-words text-sm leading-relaxed text-[var(--fg-muted)]">
                {hasProducts ? `“${deleting?.name_en}” contains ${deleting?.product_count} product(s). Move those products to another category before deleting it.` : `“${deleting?.name_en}” will be permanently removed. This cannot be undone.`}
              </AlertDialog.Description>
              {deleteError && <p role="alert" className="admin-status-red mt-4 p-3 text-xs">{deleteError}</p>}
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <AlertDialog.Cancel disabled={busy === 'delete'} className="admin-secondary disabled:opacity-50">{hasProducts ? 'Close' : 'Cancel'}</AlertDialog.Cancel>
                {!hasProducts && <AlertDialog.Action disabled={busy === 'delete'} onClick={(event) => { event.preventDefault(); void deleteCategory() }} className="inline-flex items-center gap-2 rounded-sm border border-red-800 bg-red-800 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50">
                  {busy === 'delete' && <Loader2 size={14} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
                  {busy === 'delete' ? 'Deleting…' : 'Delete category'}
                </AlertDialog.Action>}
              </div>
            </AlertDialog.Content>
          </div>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}
