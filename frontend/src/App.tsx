import { useState } from 'react'
import Toolbar from './components/Toolbar'
import Canvas from './components/Canvas'
import Sidebar from './components/Sidebar'
import CodePanel from './components/CodePanel'
import ConnectPanel from './components/ConnectPanel'
import { useCanvasStore } from './store/canvas'

export default function App() {
  const generatedCode = useCanvasStore((s) => s.generatedCode)
  const [connectOpen, setConnectOpen] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Toolbar onOpenConnect={() => setConnectOpen(true)} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', position: 'relative' }}>
        <Canvas />
        <Sidebar />
        {generatedCode && <CodePanel />}
      </div>
      {connectOpen && <ConnectPanel onClose={() => setConnectOpen(false)} />}
    </div>
  )
}
