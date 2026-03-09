import { useCanvasStore } from '../store/canvas'
import type { EntityField, FieldType } from '../types'

const FIELD_TYPES: FieldType[] = [
  'Integer',
  'String',
  'Text',
  'Boolean',
  'Float',
  'DateTime',
  'Date',
]

const sidebarStyle: React.CSSProperties = {
  width: 260,
  minWidth: 260,
  borderLeft: '1px solid #e0e0e0',
  overflowY: 'auto',
  background: '#fafafa',
  fontSize: 13,
}

export default function Sidebar() {
  const { nodes, selectedNodeId, updateEntityName, addField, removeField, updateField, removeEntity } =
    useCanvasStore()

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null

  if (!selectedNode) {
    return (
      <div
        style={{
          ...sidebarStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#aaa',
        }}
      >
        点击节点以编辑
      </div>
    )
  }

  const name = selectedNode.data['name'] as string
  const fields = selectedNode.data['fields'] as EntityField[]

  return (
    <div style={{ ...sidebarStyle, padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <label style={{ fontWeight: 'bold' }}>实体名</label>
          <button
            onClick={() => removeEntity(selectedNodeId!)}
            style={{
              padding: '2px 8px',
              background: '#fff',
              border: '1px solid #f44336',
              borderRadius: 3,
              color: '#f44336',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            删除实体
          </button>
        </div>
        <input
          value={name}
          onChange={(e) => updateEntityName(selectedNodeId!, e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: 4,
            fontSize: 13,
          }}
        />
      </div>

      <div style={{ marginBottom: 8, fontWeight: 'bold' }}>字段</div>

      {fields.map((field, index) => (
        <div
          key={index}
          style={{
            marginBottom: 8,
            padding: 8,
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 4,
          }}
        >
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            <input
              value={field.name}
              onChange={(e) =>
                updateField(selectedNodeId!, index, { ...field, name: e.target.value })
              }
              placeholder="字段名"
              style={{
                flex: 1,
                minWidth: 0,
                padding: '3px 6px',
                border: '1px solid #ccc',
                borderRadius: 3,
                fontSize: 12,
              }}
            />
            <select
              value={field.type}
              onChange={(e) =>
                updateField(selectedNodeId!, index, {
                  ...field,
                  type: e.target.value as FieldType,
                })
              }
              style={{
                padding: '3px 4px',
                border: '1px solid #ccc',
                borderRadius: 3,
                fontSize: 12,
              }}
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={field.primary_key}
                onChange={(e) =>
                  updateField(selectedNodeId!, index, {
                    ...field,
                    primary_key: e.target.checked,
                  })
                }
              />
              PK
            </label>
            <button
              onClick={() => removeField(selectedNodeId!, field.name)}
              style={{
                padding: '2px 8px',
                background: '#fff',
                border: '1px solid #f44336',
                borderRadius: 3,
                color: '#f44336',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              删除
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={() =>
          addField(selectedNodeId!, {
            name: `field_${fields.length + 1}`,
            type: 'String',
            primary_key: false,
            nullable: true,
          })
        }
        style={{
          width: '100%',
          padding: '6px',
          background: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: 4,
          color: '#1976d2',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        + 添加字段
      </button>
    </div>
  )
}
