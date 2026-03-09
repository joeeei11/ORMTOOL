import { create } from 'zustand'
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react'
import Dagre from '@dagrejs/dagre'
import type { CanvasData, Entity, EntityField, Relation, RelationType } from '../types'

interface CanvasStore {
  nodes: Node[]
  edges: Edge[]
  entityCount: number
  selectedNodeId: string | null
  generatedCode: string
  addEntity: (name?: string) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  selectNode: (id: string | null) => void
  updateEntityName: (id: string, name: string) => void
  addField: (entityId: string, field: EntityField) => void
  removeField: (entityId: string, fieldName: string) => void
  updateField: (entityId: string, fieldIndex: number, field: EntityField) => void
  setGeneratedCode: (code: string) => void
  loadFromData: (data: CanvasData) => void
  getCanvasData: () => CanvasData
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: [],
  edges: [],
  entityCount: 0,
  selectedNodeId: null,
  generatedCode: '',

  addEntity: (name) =>
    set((state) => {
      const count = state.entityCount + 1
      const entityName = name ?? `Entity_${count}`
      const defaultFields: EntityField[] = [
        { name: 'id', type: 'Integer', primary_key: true, nullable: false },
      ]
      const newNode: Node = {
        id: crypto.randomUUID(),
        type: 'entityNode',
        position: {
          x: 100 + Math.random() * 400,
          y: 100 + Math.random() * 300,
        },
        data: { name: entityName, fields: defaultFields },
      }
      return { nodes: [...state.nodes, newNode], entityCount: count }
    }),

  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),

  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        { ...connection, label: '1:N', data: { type: 'one_to_many' } },
        state.edges
      ),
    })),

  selectNode: (id) => set({ selectedNodeId: id }),

  setGeneratedCode: (code) => set({ generatedCode: code }),

  updateEntityName: (id, name) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, name } } : node
      ),
    })),

  addField: (entityId, field) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === entityId
          ? {
              ...node,
              data: {
                ...node.data,
                fields: [...(node.data['fields'] as EntityField[]), field],
              },
            }
          : node
      ),
    })),

  removeField: (entityId, fieldName) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== entityId) return node
        const fields = node.data['fields'] as EntityField[]
        const idx = fields.findIndex((f) => f.name === fieldName)
        if (idx === -1) return node
        const newFields = [...fields.slice(0, idx), ...fields.slice(idx + 1)]
        return { ...node, data: { ...node.data, fields: newFields } }
      }),
    })),

  updateField: (entityId, fieldIndex, field) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === entityId
          ? {
              ...node,
              data: {
                ...node.data,
                fields: (node.data['fields'] as EntityField[]).map((f, i) =>
                  i === fieldIndex ? field : f
                ),
              },
            }
          : node
      ),
    })),

  getCanvasData: () => {
    const { nodes, edges } = get()
    const entities: Entity[] = nodes.map((node) => ({
      id: node.id,
      name: node.data['name'] as string,
      fields: node.data['fields'] as EntityField[],
    }))
    const relations: Relation[] = edges.map((edge) => {
      const targetNode = nodes.find((n) => n.id === edge.target)
      const targetName = ((targetNode?.data['name'] as string) ?? 'entity').toLowerCase()
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
  },

  loadFromData: (data) =>
    set(() => {
      const g = new Dagre.graphlib.Graph()
      g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 80 })
      g.setDefaultEdgeLabel(() => ({}))

      const nodes: Node[] = data.entities.map((entity) => {
        const height = 80 + entity.fields.length * 24
        g.setNode(entity.id, { width: 200, height })
        return {
          id: entity.id,
          type: 'entityNode',
          position: { x: 0, y: 0 },
          data: { name: entity.name, fields: entity.fields },
        }
      })

      const labelMap: Record<string, string> = {
        one_to_one: '1:1',
        one_to_many: '1:N',
        many_to_many: 'N:M',
      }

      const edges: Edge[] = data.relations.map((rel) => {
        g.setEdge(rel.source, rel.target)
        return {
          id: rel.id,
          source: rel.source,
          target: rel.target,
          label: labelMap[rel.type] ?? '1:N',
          data: { type: rel.type },
        }
      })

      Dagre.layout(g)

      const positionedNodes = nodes.map((node) => {
        const pos = g.node(node.id)
        return { ...node, position: { x: pos.x - 100, y: pos.y - pos.height / 2 } }
      })

      return {
        nodes: positionedNodes,
        edges,
        selectedNodeId: null,
        generatedCode: '',
        entityCount: data.entities.length,
      }
    }),
}))
