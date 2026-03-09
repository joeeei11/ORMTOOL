import { ReactFlow, MiniMap, Controls, NodeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCanvasStore } from '../store/canvas'
import EntityNode from './EntityNode'

const nodeTypes: NodeTypes = { entityNode: EntityNode }

export default function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, selectNode } = useCanvasStore()

  return (
    <div style={{ flex: 1, height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={() => selectNode(null)}
        nodeTypes={nodeTypes}
        fitView
      >
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  )
}
