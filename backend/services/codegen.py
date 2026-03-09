"""ORM / SQL code generation logic.

Pure functions — no FastAPI dependency.
"""

from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from models import CanvasData, FieldSchema, RelationSchema

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

SQLALCHEMY_TYPE_MAP = {
    "Integer": "Integer",
    "String": "String",
    "Text": "Text",
    "Boolean": "Boolean",
    "Float": "Float",
    "DateTime": "DateTime",
    "Date": "Date",
}

DJANGO_TYPE_MAP = {
    "Integer": "IntegerField",
    "String": "CharField",
    "Text": "TextField",
    "Boolean": "BooleanField",
    "Float": "FloatField",
    "DateTime": "DateTimeField",
    "Date": "DateField",
}

SQL_TYPE_MAP = {
    "Integer": "INT",
    "String": "VARCHAR",
    "Text": "TEXT",
    "Boolean": "TINYINT(1)",
    "Float": "FLOAT",
    "DateTime": "DATETIME",
    "Date": "DATE",
}


def _make_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        trim_blocks=True,
        lstrip_blocks=True,
        keep_trailing_newline=True,
    )


def _relations_for(data: CanvasData):
    def inner(entity_id: str) -> list[RelationSchema]:
        return [r for r in data.relations if r.source == entity_id or r.target == entity_id]

    return inner


def generate_sqlalchemy(data: CanvasData) -> str:
    """Render SQLAlchemy model code from canvas data."""
    env = _make_env()

    name_map = {e.id: e.name for e in data.entities}

    def sa_col_type(field: FieldSchema) -> str:
        if field.type == "String" and field.length:
            return f"String({field.length})"
        return SQLALCHEMY_TYPE_MAP.get(field.type, "String")

    def rel_label(rel: RelationSchema) -> str:
        src = name_map.get(rel.source, rel.source)
        tgt = name_map.get(rel.target, rel.target)
        return f"{src} -> {tgt}"

    tmpl = env.get_template("sqlalchemy.py.j2")
    return tmpl.render(
        entities=data.entities,
        relations=data.relations,
        sa_col_type=sa_col_type,
        relations_for=_relations_for(data),
        rel_label=rel_label,
    )


def generate_django(data: CanvasData) -> str:
    """Render Django ORM model code from canvas data."""
    env = _make_env()

    def django_type(field: FieldSchema) -> str:
        return DJANGO_TYPE_MAP.get(field.type, "CharField")

    def django_field_args(field: FieldSchema) -> str:
        args: list[str] = []
        if field.primary_key:
            args.append("primary_key=True")
        if field.type == "String":
            args.append(f"max_length={field.length or 255}")
        return ", ".join(args)

    tmpl = env.get_template("django.py.j2")
    return tmpl.render(
        entities=data.entities,
        relations=data.relations,
        django_type=django_type,
        django_field_args=django_field_args,
        relations_for=_relations_for(data),
    )


def generate_sql(data: CanvasData) -> str:
    """Render CREATE TABLE SQL from canvas data."""
    env = _make_env()

    def sql_type(field: FieldSchema) -> str:
        if field.type == "String":
            length = field.length or 255
            return f"VARCHAR({length})"
        return SQL_TYPE_MAP.get(field.type, "VARCHAR(255)")

    def format_fields(entity) -> str:
        lines = []
        for field in entity.fields:
            col = f"  `{field.name}` {sql_type(field)}"
            if field.primary_key:
                col += " PRIMARY KEY"
            if not field.nullable:
                col += " NOT NULL"
            lines.append(col)
        return ",\n".join(lines)

    tmpl = env.get_template("sql.sql.j2")
    return tmpl.render(
        entities=data.entities,
        relations=data.relations,
        format_fields=format_fields,
        relations_for=_relations_for(data),
    )
