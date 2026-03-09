import { useCanvasStore } from '../store/canvas'

export default function CodePanel() {
  const code = useCanvasStore((s) => s.generatedCode)
  const setGeneratedCode = useCanvasStore((s) => s.setGeneratedCode)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {
      // fallback: do nothing if clipboard access is denied
    })
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '42%',
        background: '#1e1e1e',
        color: '#d4d4d4',
        display: 'flex',
        flexDirection: 'column',
        borderTop: '2px solid #444',
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 16px',
          borderBottom: '1px solid #444',
          background: '#252526',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: 13 }}>Generated Code</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleCopy}
            style={{
              padding: '4px 10px',
              cursor: 'pointer',
              border: '1px solid #555',
              borderRadius: 3,
              background: '#3a3a3a',
              color: '#d4d4d4',
              fontSize: 12,
            }}
          >
            复制
          </button>
          <button
            onClick={() => setGeneratedCode('')}
            style={{
              padding: '4px 10px',
              cursor: 'pointer',
              border: '1px solid #555',
              borderRadius: 3,
              background: '#3a3a3a',
              color: '#d4d4d4',
              fontSize: 12,
            }}
          >
            关闭
          </button>
        </div>
      </div>
      <pre
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '12px 16px',
          margin: 0,
          fontSize: 13,
          fontFamily: 'Consolas, "Courier New", monospace',
          lineHeight: 1.5,
          whiteSpace: 'pre',
        }}
      >
        {code}
      </pre>
    </div>
  )
}
