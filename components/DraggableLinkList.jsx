'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableLink({ link, index, onToggle, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 border-2 rounded-lg transition-all ${
        isDragging
          ? 'opacity-50 scale-95 border-purple-400 shadow-lg'
          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-move hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
      >
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16M12 4v16" />
        </svg>
      </div>

      {/* Position */}
      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
        {index + 1}
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{link.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{link.url}</p>
      </div>

      {/* Stats */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {link.clicks} clique{link.clicks !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Status Badge */}
      <div
        onClick={() => onToggle(link.id, link.isActive)}
        className={`px-3 py-1 rounded-lg text-sm font-medium transition cursor-pointer hover:opacity-80 ${
          link.isActive
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}
      >
        {link.isActive ? 'Ativo' : 'Inativo'}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onEdit(link)}
          className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          title="Editar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <button
          onClick={() => onDelete(link.id)}
          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Excluir"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function DraggableLinkList({ links, onReorder, onToggle, onEdit, onDelete }) {
  const [linksState, setLinksState] = useState(links)

  // Atualizar estado quando os links mudam externamente
  useEffect(() => {
    setLinksState(links)
  }, [links])

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handler para o fim do drag
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = linksState.findIndex((link) => link.id === active.id)
      const newIndex = linksState.findIndex((link) => link.id === over.id)

      const newLinks = arrayMove(linksState, oldIndex, newIndex)

      // Atualizar posições
      const reorderedLinks = newLinks.map((link, index) => ({
        ...link,
        position: index + 1,
      }))

      setLinksState(reorderedLinks)
      onReorder(reorderedLinks)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={linksState} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {linksState.map((link, index) => (
            <SortableLink
              key={link.id}
              link={link}
              index={index}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}

          {linksState.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-lg">Você ainda não tem links</p>
              <p className="mt-2">Clique em "Adicionar Link" para começar</p>
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}
