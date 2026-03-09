import type { CanvasData } from '../types'

export async function parseDB(conn: {
  host: string
  port: number
  user: string
  password: string
  database: string
}): Promise<CanvasData> {
  const response = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(conn),
  })
  if (!response.ok) {
    const err = (await response.json()) as { detail?: string }
    throw new Error(err.detail ?? `Parse failed: ${response.status}`)
  }
  return response.json() as Promise<CanvasData>
}

export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch('/api/health')
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`)
  }
  const data = (await response.json()) as { status: string }
  return data
}

export async function generateCode(
  target: 'sqlalchemy' | 'django' | 'sql',
  data: CanvasData
): Promise<{ code: string }> {
  const response = await fetch(`/api/generate/${target}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = (await response.json()) as { detail?: string }
    throw new Error(err.detail ?? `Generate failed: ${response.status}`)
  }
  return response.json() as Promise<{ code: string }>
}

export async function saveProject(data: CanvasData): Promise<void> {
  const response = await fetch('/api/project/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = (await response.json()) as { detail?: string }
    throw new Error(err.detail ?? `Save failed: ${response.status}`)
  }
}

export async function loadProject(): Promise<CanvasData> {
  const response = await fetch('/api/project/load')
  if (!response.ok) {
    const err = (await response.json()) as { detail?: string }
    throw new Error(err.detail ?? `Load failed: ${response.status}`)
  }
  return response.json() as Promise<CanvasData>
}
