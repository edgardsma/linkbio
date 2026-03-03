'use client'

import { useState } from 'react'

export default function DraggableLinkList({ links, onReorder }) {
  const [draggedLink, setDraggedLink] = useState(null)
  const [draggedOver, setDraggedOver] = useState(null)

  const handleDragStart = (e, link) => {
    e.dataTransfer.effectAllowed = 'move'
    setDraggedLink(link)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    setDraggedOver(index)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()

    if (draggedLink === null) return

    const dragIndex = links.findIndex(l => l.id === draggedLink.id)

    if (dragIndex === dropIndex) {
      setDraggedLink(null)
      setDraggedOver(null)
      return
    }

    // Criar nova ordem
    const newLinks = [...links]
    const [movedLink] = newLinks.splice(dragIndex, 1)
    newLinks.splice(dropIndex, 0, movedLink)

    // Atualizar posições
    const reorderedLinks = newLinks.map((link, index) => ({
      ...link,
      position: index,
    }))

    onReorder(reorderedLinks)
    setDraggedLink(null)
    setDraggedOver(null)
  }

  const handleDragEnd = () => {
    setDraggedLink(null)
    setDraggedOver(null)
  }

  return (
    <div className="space-y-3">
      {links.map((link, index) => (
        <div
          key={link.id}
          draggable
          onDragStart={(e) => handleDragStart(e, link)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-4 p-4 border-2 rounded-lg transition-all cursor-move ${
            draggedLink?.id === link.id
              ? 'opacity-50 scale-95 border-purple-300'
              : draggedOver === index
              ? 'border-purple-400 border-dashed bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }
          }`}
        >
          {/* Drag Handle */}
          <div className="flex-shrink-0 cursor-move">
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

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                link.isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {link.isActive ? 'Ativo' : 'Inativo'}
            </div>
          </div>
        </div>
      ))}

      {links.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-lg">Arraste links para cá</p>
          <p className="mt-2">Ou clique em "Adicionar Link"</p>
        </div>
      )}
    </div>
  )
}
