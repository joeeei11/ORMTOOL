import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import type { EntityField } from '../types'
import { useCanvasStore } from '../store/canvas'

function EntityNode({ id, data }: NodeProps) {
  const name = data['name'] as string
  const fields = data['fields'] as EntityField[]
  const selectNode = useCanvasStore((s) => s.selectNode)

  return (
    <div
      onClick={() => selectNode(id)}
      style={{
        minWidth: 180,
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div
        style={{
          padding: '8px 12px',
          fontWeight: 'bold',
          textAlign: 'center',
          borderBottom: '1px solid #e0e0e0',
          background: '#fff',
        }}
      >
        {name}
      </div>

      <div style={{ background: '#f5f5f5' }}>
        {fields.map((field, i) => (
          <div
            key={i}
            style={{
              padding: '4px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              borderBottom: '1px solid #ebebeb',
            }}
          >
            <span>
              {field.primary_key && (
                <span
                  style={{
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: 3,
                    padding: '0 4px',
                    fontSize: 10,
                    marginRight: 4,
                  }}
                >
                  PK
                </span>
              )}
              {field.name}
            </span>
            <span style={{ color: '#888', fontStyle: 'italic' }}>{field.type}</span>
          </div>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default memo(EntityNode)
