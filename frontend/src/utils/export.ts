import { toPng, toSvg } from 'html-to-image'
import type { CanvasData } from '../types'

export function exportJSON(data: CanvasData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'orm-diagram.json'
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportPNG(): Promise<void> {
  const el = document.querySelector('.react-flow') as HTMLElement | null
  if (!el) return
  const dataUrl = await toPng(el)
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = 'orm-diagram.png'
  a.click()
}

export async function exportSVG(): Promise<void> {
  const el = document.querySelector('.react-flow') as HTMLElement | null
  if (!el) return
  const dataUrl = await toSvg(el)
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = 'orm-diagram.svg'
  a.click()
}
