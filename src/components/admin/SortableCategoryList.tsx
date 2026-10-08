'use client'

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { AdminCategory } from './CategoryModal'

interface SortableCategoryListProps {
  categories: AdminCategory[]
  disabled?: boolean
  reorderDisabled?: boolean
  onReorder: (categories: AdminCategory[]) => void
  onEdit: (category: AdminCategory) => void
  onDelete: (category: AdminCategory) => void
}

export function SortableCategoryList({ categories, disabled = false, reorderDisabled = false, onReorder, onEdit, onDelete }: SortableCategoryListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (disabled || reorderDisabled || !over || active.id === over.id) return
    const oldIndex = categories.findIndex((category) => category.id === active.id)
    const newIndex = categories.findIndex((category) => category.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onReorder(arrayMove(categories, oldIndex, newIndex))
  }

  return (
    <div className="admin-card">
      <div aria-hidden="true" className="hidden grid-cols-[2rem_minmax(0,1fr)_5rem_6rem_8rem] items-center gap-4 border-b border-[var(--border)] bg-[var(--bg)] px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-[var(--fg-muted)] md:grid">
        <span />
        <span>Category</span>
        <span className="text-right">Products</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{ screenReaderInstructions: { draggable: 'To reorder this category, press Space to pick it up, use the arrow keys to move it, and press Space to drop. Press Escape to cancel.' } }}
      >
        <SortableContext items={categories.map((category) => category.id)} strategy={verticalListSortingStrategy}>
          <ul aria-label="Categories in catalog order" className="divide-y divide-[var(--border)]">
            {categories.map((category) => (
              <SortableCategoryRow key={category.id} category={category} disabled={disabled} reorderDisabled={reorderDisabled} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableCategoryRow({ category, disabled, reorderDisabled, onEdit, onDelete }: Pick<SortableCategoryListProps, 'disabled' | 'reorderDisabled' | 'onEdit' | 'onDelete'> & { category: AdminCategory }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: category.id, disabled: disabled || reorderDisabled })

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, position: 'relative', zIndex: isDragging ? 1 : undefined }} className={`grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-3 gap-y-3 bg-[var(--admin-card)] p-4 md:grid-cols-[2rem_minmax(0,1fr)_5rem_6rem_8rem] md:gap-4 md:px-5 ${isDragging ? 'shadow-lg ring-2 ring-[#8B6F47]' : ''}`}>
      <button ref={setActivatorNodeRef} type="button" {...attributes} {...listeners} disabled={disabled || reorderDisabled} aria-label={`Reorder ${category.name_en}`} title={reorderDisabled ? 'Clear search to reorder categories' : 'Drag to reorder, or use Space and arrow keys'} className="touch-none rounded-sm p-2 text-[var(--fg-muted)] transition-colors hover:text-[var(--admin-accent-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B6F47] disabled:cursor-not-allowed disabled:opacity-30">
        <GripVertical size={16} aria-hidden="true" />
      </button>
      <div className="min-w-0">
        <p className="break-words text-sm font-medium">{category.name_en}</p>
        <p className="mt-1 break-words text-xs text-[var(--fg-muted)]">{category.name_ru}{category.name_de ? ` · ${category.name_de}` : ''}</p>
        <p className="mt-1 break-all font-mono text-[11px] text-[var(--fg-muted)]">/{category.slug}</p>
      </div>
      <p className="col-start-2 text-xs text-[var(--fg-muted)] md:col-start-auto md:text-right"><span className="font-medium text-[var(--fg)]">{category.product_count ?? '—'}</span><span className="ml-1 md:sr-only">products</span></p>
      <span className={`col-start-2 w-fit px-2 py-1 text-[11px] font-medium uppercase tracking-wider md:col-start-auto ${category.is_active ? 'admin-status-green' : 'admin-status-amber'}`}>{category.is_active ? 'Active' : 'Hidden'}</span>
      <div className="col-start-2 flex gap-2 md:col-start-auto md:justify-end">
        <button type="button" onClick={() => onEdit(category)} disabled={disabled} aria-label={`Edit ${category.name_en}`} className="inline-flex items-center gap-1.5 rounded-sm px-2 py-2 text-xs text-[var(--fg-muted)] transition-colors hover:text-[var(--admin-accent-text)] disabled:opacity-40">
          <Pencil size={14} aria-hidden="true" /><span>Edit</span>
        </button>
        <button type="button" onClick={() => onDelete(category)} disabled={disabled} aria-label={`Delete ${category.name_en}`} className="flex min-h-11 min-w-11 items-center justify-center rounded-sm p-2 text-[var(--fg-muted)] transition-colors hover:text-red-800 disabled:opacity-40 dark:hover:text-red-300">
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}
