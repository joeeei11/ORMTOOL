export type FieldType = 'Integer' | 'String' | 'Text' | 'Boolean' | 'Float' | 'DateTime' | 'Date'
export type RelationType = 'one_to_one' | 'one_to_many' | 'many_to_many'

export interface EntityField {
  name: string
  type: FieldType
  primary_key: boolean
  nullable: boolean
  length?: number
}

export interface Entity {
  id: string
  name: string
  fields: EntityField[]
}

export interface Relation {
  id: string
  type: RelationType
  source: string
  target: string
  source_field: string
  target_field: string
}

export interface CanvasData {
  entities: Entity[]
  relations: Relation[]
}
