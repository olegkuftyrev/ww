import { useEffect, useState } from 'react'
import { useTheme } from '@/features/theme/theme-provider'

const GRID_SIZE = 40 // Размер клетки сетки

// Элементы интерфейса, которые должны блокировать подсветку сетки
const INTERFACE_SELECTORS = [
  'button',
  'a',
  'input',
  'textarea',
  'select',
  '[data-slot]', // ShadCN компоненты
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[tabindex]',
  '.cursor-pointer',
  'form',
]

export function IronManGrid() {
  const { theme } = useTheme()
  const [highlightedCell, setHighlightedCell] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (theme !== 'iron-man') {
      setHighlightedCell(null)
      return
    }

    const isOverInterface = (element: Element | null): boolean => {
      if (!element || element === document.body || element === document.documentElement) {
        return false
      }

      const target = element as HTMLElement

      // Проверяем, является ли элемент частью интерфейса (сам элемент или его родитель)
      for (const selector of INTERFACE_SELECTORS) {
        if (target.matches?.(selector)) {
          return true
        }
        // Проверяем родителей
        let parent = target.parentElement
        let depth = 0
        while (parent && depth < 10) {
          if (parent.matches?.(selector)) {
            return true
          }
          parent = parent.parentElement
          depth++
        }
      }

      // Проверяем, есть ли у элемента или его родителя z-index больше 1
      const computedStyle = window.getComputedStyle(target)
      const zIndex = parseInt(computedStyle.zIndex || 'auto', 10)

      if (!isNaN(zIndex) && zIndex > 1) {
        return true
      }

      // Проверяем родительские элементы
      let parent = target.parentElement
      let depth = 0
      while (parent && parent !== document.body && depth < 10) {
        const parentStyle = window.getComputedStyle(parent)
        const parentZIndex = parseInt(parentStyle.zIndex || 'auto', 10)
        if (!isNaN(parentZIndex) && parentZIndex > 1) {
          return true
        }
        parent = parent.parentElement
        depth++
      }

      return false
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as Element
      // Если курсор над элементом интерфейса, не подсвечиваем сетку
      if (isOverInterface(target)) {
        setHighlightedCell(null)
        return
      }

      // Вычисляем координаты клетки, на которую наведена мышь
      const cellX = Math.floor(e.clientX / GRID_SIZE) * GRID_SIZE
      const cellY = Math.floor(e.clientY / GRID_SIZE) * GRID_SIZE
      setHighlightedCell({ x: cellX, y: cellY })
    }

    const handleMouseLeave = () => {
      setHighlightedCell(null)
    }

    document.addEventListener('mousemove', handleMouseMove, true) // capture phase
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [theme])

  if (theme !== 'iron-man') return null

  return (
    <>
      {/* Сетка в клеточку */}
      <div
        className="iron-man-grid-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(oklch(0.7 0.15 230 / 0.2) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.7 0.15 230 / 0.2) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          backgroundPosition: '0 0',
        }}
      />

      {/* Подсветка конкретной клетки сетки - только когда курсор НЕ над интерфейсом */}
      {highlightedCell && (
        <div
          className="iron-man-cell-highlight"
          style={{
            position: 'fixed',
            top: highlightedCell.y,
            left: highlightedCell.x,
            width: `${GRID_SIZE}px`,
            height: `${GRID_SIZE}px`,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  )
}
