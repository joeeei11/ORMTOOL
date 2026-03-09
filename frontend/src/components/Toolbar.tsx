import { useState } from 'react'
import type { Entity, Relation, RelationType, CanvasData } from '../types'
import { useCanvasStore } from '../store/canvas'
import { generateCode, saveProject, loadProject } from '../services/api'
import { exportJSON, exportPNG, exportSVG } from '../utils/export'

type GenerateTarget = 'sqlalchemy' | 'django' | 'sql'

const TARGET_LABELS: Record<GenerateTarget, string> = {
  sqlalchemy: 'SQLAlchemy',
  django: 'Django ORM',
  sql: 'SQL',
}

interface ToolbarProps {
  onOpenConnect: () => void
}

export default function Toolbar({ onOpenConnect }: ToolbarProps) {
  const addEntity = useCanvasStore((s) => s.addEntity)
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const setGeneratedCode = useCanvasStore((s) => s.setGeneratedCode)
  const getCanvasData = useCanvasStore((s) => s.getCanvasData)
  const loadFromData = useCanvasStore((s) => s.loadFromData)

  const [target, setTarget] = useState<GenerateTarget>('sqlalchemy')
  const [loading, setLoading] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const buildCanvasData = (): CanvasData => {
    const entities: Entity[] = nodes.map((node) => ({
      id: node.id,
      name: node.data['name'] as string,
      fields: node.data['fields'] as Entity['fields'],
    }))
    const relations: Relation[] = edges.map((edge) => {
      const targetNode = nodes.find((n) => n.id === edge.target)
      const targetName = (targetNode?.data['name'] as string ?? 'entity').toLowerCase()
      return {
        id: edge.id,
        type: ((edge.data as Record<string, unknown>)?.['type'] as RelationType) ?? 'one_to_many',
        source: edge.source,
        target: edge.target,
        source_field: 'id',
        target_field: `${targetName}_id`,
      }
    })
    return { entities, relations }
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const data = buildCanvasData()
      const result = await generateCode(target, data)
      setGeneratedCode(result.code)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Code generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleExportJSON = () => {
    setExportOpen(false)
    exportJSON(getCanvasData())
  }

  const handleExportPNG = async () => {
    setExportOpen(false)
    setExportLoading(true)
    try {
      await exportPNG()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'PNG export failed')
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportSVG = async () => {
    setExportOpen(false)
    setExportLoading(true)
    try {
      await exportSVG()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'SVG export failed')
    } finally {
      setExportLoading(false)
    }
  }

  const handleSaveProject = async () => {
    setExportOpen(false)
    setExportLoading(true)
    try {
      await saveProject(getCanvasData())
      alert('保存成功')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setExportLoading(false)
    }
  }

  const handleLoadProject = async () => {
    setExportOpen(false)
    setExportLoading(true)
    try {
      const data = await loadProject()
      loadFromData(data)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Load failed')
    } finally {
      setExportLoading(false)
    }
  }

  const menuItems: { label: string; onClick: () => void }[] = [
    { label: '导出 JSON', onClick: handleExportJSON },
    { label: '导出 PNG', onClick: handleExportPNG },
    { label: '导出 SVG', onClick: handleExportSVG },
    { label: '保存项目', onClick: handleSaveProject },
    { label: '加载项目', onClick: handleLoadProject },
  ]

  return (
    <div
      style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid #e0e0e0',
        background: '#fff',
        gap: 8,
      }}
    >
      <span style={{ fontWeight: 'bold', marginRight: 16 }}>ORM Visualizer</span>
      <button
        onClick={() => addEntity()}
        style={{
          padding: '6px 14px',
          cursor: 'pointer',
          border: '1px solid #ccc',
          borderRadius: 4,
          background: '#f0f0f0',
          fontSize: 14,
        }}
      >
        添加实体
      </button>
      <button
        onClick={onOpenConnect}
        style={{
          padding: '6px 14px',
          cursor: 'pointer',
          border: '1px solid #27ae60',
          borderRadius: 4,
          background: '#27ae60',
          color: '#fff',
          fontSize: 14,
        }}
      >
        连接数据库
      </button>

      {/* Export dropdown */}
      <div style={{ position: 'relative' }}>
        {exportOpen && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setExportOpen(false)}
          />
        )}
        <button
          onClick={() => setExportOpen((v) => !v)}
          disabled={exportLoading}
          style={{
            padding: '6px 14px',
            cursor: exportLoading ? 'not-allowed' : 'pointer',
            border: '1px solid #8e44ad',
            borderRadius: 4,
            background: exportLoading ? '#ccc' : '#8e44ad',
            color: '#fff',
            fontSize: 14,
          }}
        >
          {exportLoading ? '处理中...' : '导出 ▾'}
        </button>
        {exportOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,.15)',
              zIndex: 100,
              minWidth: 130,
            }}
          >
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 16px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  fontSize: 14,
                  cursor: 'pointer',
                  color: '#333',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value as GenerateTarget)}
          style={{
            padding: '5px 8px',
            border: '1px solid #ccc',
            borderRadius: 4,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {(Object.keys(TARGET_LABELS) as GenerateTarget[]).map((key) => (
            <option key={key} value={key}>
              {TARGET_LABELS[key]}
            </option>
          ))}
        </select>
        <button
          onClick={handleGenerate}
          disabled={loading || nodes.length === 0}
          style={{
            padding: '6px 14px',
            cursor: loading || nodes.length === 0 ? 'not-allowed' : 'pointer',
            border: '1px solid #4a90e2',
            borderRadius: 4,
            background: loading || nodes.length === 0 ? '#ccc' : '#4a90e2',
            color: '#fff',
            fontSize: 14,
          }}
        >
          {loading ? '生成中...' : '生成代码'}
        </button>
      </div>
    </div>
  )
}
