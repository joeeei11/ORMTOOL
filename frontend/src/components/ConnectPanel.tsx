import { useState } from 'react'
import { useCanvasStore } from '../store/canvas'
import { parseDB } from '../services/api'

interface ConnectPanelProps {
  onClose: () => void
}

interface FormState {
  host: string
  port: string
  user: string
  password: string
  database: string
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 14,
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 4,
  color: '#333',
}

export default function ConnectPanel({ onClose }: ConnectPanelProps) {
  const loadFromData = useCanvasStore((s) => s.loadFromData)

  const [form, setForm] = useState<FormState>({
    host: 'localhost',
    port: '3306',
    user: '',
    password: '',
    database: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setError(null)
  }

  const handleParse = async () => {
    if (!form.host || !form.user || !form.database) {
      setError('请填写 Host、User 和 Database')
      return
    }
    const portNum = parseInt(form.port, 10)
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setError('Port 必须为 1–65535 的整数')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await parseDB({
        host: form.host,
        port: portNum,
        user: form.user,
        password: form.password,
        database: form.database,
      })
      loadFromData(data)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败，请检查连接信息')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          width: 380,
          padding: '24px 28px',
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600 }}>连接 MySQL 数据库</h3>

        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Host</label>
            <input style={inputStyle} value={form.host} onChange={handleChange('host')} />
          </div>
          <div style={{ width: 90 }}>
            <label style={labelStyle}>Port</label>
            <input
              style={inputStyle}
              type="number"
              value={form.port}
              onChange={handleChange('port')}
            />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>User</label>
          <input
            style={inputStyle}
            autoComplete="username"
            value={form.user}
            onChange={handleChange('user')}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Password</label>
          <input
            style={inputStyle}
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange('password')}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Database</label>
          <input style={inputStyle} value={form.database} onChange={handleChange('database')} />
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: '8px 12px',
              background: '#fff3f3',
              border: '1px solid #ffcccc',
              borderRadius: 4,
              color: '#cc0000',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '7px 16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: '1px solid #ccc',
              borderRadius: 4,
              background: '#f5f5f5',
              fontSize: 14,
            }}
          >
            取消
          </button>
          <button
            onClick={handleParse}
            disabled={loading}
            style={{
              padding: '7px 16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: '1px solid #4a90e2',
              borderRadius: 4,
              background: loading ? '#a0c4f1' : '#4a90e2',
              color: '#fff',
              fontSize: 14,
            }}
          >
            {loading ? '解析中...' : '解析'}
          </button>
        </div>
      </div>
    </div>
  )
}
