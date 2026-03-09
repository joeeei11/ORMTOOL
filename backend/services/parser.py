"""MySQL metadata parsing logic.

Pure functions — no FastAPI dependency.
"""

import uuid
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Inspector

from models import CanvasData, EntitySchema, FieldSchema, RelationSchema


def _map_type(col_type_str: str) -> str:
    """Map SQLAlchemy column type string to frontend FieldType enum value."""
    t = col_type_str.upper()
    # Check TINYINT(1) before general TINYINT / INT
    if 'TINYINT(1)' in t:
        return 'Boolean'
    if t.startswith('BOOL'):
        return 'Boolean'
    if (t.startswith('INT') or t.startswith('INTEGER') or t.startswith('BIGINT')
            or t.startswith('SMALLINT') or t.startswith('MEDIUMINT')
            or t.startswith('TINYINT')):
        return 'Integer'
    if t.startswith('VARCHAR') or t.startswith('CHAR'):
        return 'String'
    if (t.startswith('LONGTEXT') or t.startswith('MEDIUMTEXT')
            or t.startswith('TINYTEXT') or t.startswith('TEXT')):
        return 'Text'
    if (t.startswith('FLOAT') or t.startswith('DOUBLE')
            or t.startswith('DECIMAL') or t.startswith('NUMERIC')):
        return 'Float'
    if t.startswith('DATETIME') or t.startswith('TIMESTAMP'):
        return 'DateTime'
    if t.startswith('DATE'):
        return 'Date'
    return 'String'


def parse_mysql(
    host: str,
    port: int,
    user: str,
    password: str,
    database: str,
) -> CanvasData:
    """Connect to MySQL, inspect tables and foreign keys, return CanvasData.

    The password is never written to any log or persisted to disk.
    """
    url = f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}"
    engine = create_engine(url, connect_args={"connect_timeout": 5})
    try:
        # Verify connection before inspecting
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        inspector: Inspector = inspect(engine)
        table_names = inspector.get_table_names()

        # First pass: identify many-to-many junction tables.
        # A table qualifies if it has exactly 2 columns and both are FK columns.
        junction_tables: set[str] = set()
        for table in table_names:
            cols = inspector.get_columns(table)
            fks = inspector.get_foreign_keys(table)
            fk_col_names: set[str] = {c for fk in fks for c in fk['constrained_columns']}
            if len(cols) == 2 and all(c['name'] in fk_col_names for c in cols):
                junction_tables.add(table)

        # Second pass: build entities for non-junction tables.
        entities: list[EntitySchema] = []
        entity_id_map: dict[str, str] = {}  # table_name -> entity UUID

        for table in table_names:
            if table in junction_tables:
                continue
            entity_id = str(uuid.uuid4())
            entity_id_map[table] = entity_id

            cols = inspector.get_columns(table)
            pk_constraint = inspector.get_pk_constraint(table)
            pk_cols: set[str] = set(pk_constraint.get('constrained_columns', []))

            fields: list[FieldSchema] = []
            for col in cols:
                col_type_str = str(col['type'])
                fields.append(FieldSchema(
                    name=col['name'],
                    type=_map_type(col_type_str),
                    primary_key=col['name'] in pk_cols,
                    nullable=bool(col.get('nullable', True)),
                ))

            entities.append(EntitySchema(id=entity_id, name=table, fields=fields))

        # Third pass: build relations from foreign keys (one_to_many).
        relations: list[RelationSchema] = []

        for table in table_names:
            if table in junction_tables:
                continue
            fks = inspector.get_foreign_keys(table)
            for fk in fks:
                ref_table = fk.get('referred_table', '')
                if ref_table not in entity_id_map or table not in entity_id_map:
                    continue
                source_id = entity_id_map[ref_table]  # parent (one side)
                target_id = entity_id_map[table]       # child (many side)
                source_field = (fk['referred_columns'][0]
                                if fk.get('referred_columns') else 'id')
                target_field = (fk['constrained_columns'][0]
                                if fk.get('constrained_columns') else f"{ref_table}_id")
                relations.append(RelationSchema(
                    id=str(uuid.uuid4()),
                    type='one_to_many',
                    source=source_id,
                    target=target_id,
                    source_field=source_field,
                    target_field=target_field,
                ))

        # Fourth pass: handle junction tables (many_to_many).
        for table in junction_tables:
            fks = inspector.get_foreign_keys(table)
            if len(fks) == 2:
                ref1 = fks[0].get('referred_table', '')
                ref2 = fks[1].get('referred_table', '')
                if ref1 in entity_id_map and ref2 in entity_id_map:
                    src_field = (fks[0]['referred_columns'][0]
                                 if fks[0].get('referred_columns') else 'id')
                    tgt_field = (fks[1]['referred_columns'][0]
                                 if fks[1].get('referred_columns') else 'id')
                    relations.append(RelationSchema(
                        id=str(uuid.uuid4()),
                        type='many_to_many',
                        source=entity_id_map[ref1],
                        target=entity_id_map[ref2],
                        source_field=src_field,
                        target_field=tgt_field,
                    ))

        return CanvasData(entities=entities, relations=relations)
    finally:
        engine.dispose()
