# ORM Visualizer

面向开发者的 ORM 关系可视化工具。在图形画布上设计数据库实体和关系，一键生成 SQLAlchemy / Django ORM / SQL 代码；也可连接 MySQL 数据库反向解析现有表结构。

## 功能

- **图形化编辑**：在画布上添加实体、编辑字段（名称/类型/主键）、连线建立关系
- **正向代码生成**：设计图 → SQLAlchemy 模型 / Django ORM 模型 / CREATE TABLE SQL
- **反向解析**：连接 MySQL → 自动识别表结构和外键关系 → 渲染关系图
- **导出**：JSON（画布数据）、PNG / SVG（关系图截图）
- **项目保存/加载**：画布状态持久化到服务端 JSON 文件

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite |
| 图形引擎 | @xyflow/react + @dagrejs/dagre |
| 全局状态 | Zustand |
| 后端 | Python 3.11 + FastAPI + Uvicorn |
| ORM 解析 | SQLAlchemy Core（inspect）|
| 代码生成 | Jinja2 模板 |
| 数据库连接 | PyMySQL + SQLAlchemy Engine |

## 启动方式

### 后端

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev   # 默认端口 3000
```

### 验证联通

```bash
curl http://localhost:8000/api/health
# 期望返回：{"status": "ok"}
```

浏览器访问 `http://localhost:3000`。

## 使用流程

### 正向流程（设计 → 代码）

1. 点击顶栏 **添加实体**，输入实体名
2. 点击实体节点，在右侧面板编辑字段（名称、类型、是否 PK）
3. 拖动节点底部连接点到另一节点顶部建立关系（默认 1:N）
4. 右上角选择目标（SQLAlchemy / Django ORM / SQL），点击 **生成代码**
5. 底部弹出代码面板，可复制使用

### 反向流程（MySQL → 关系图）

1. 点击 **连接数据库**，填写 Host / Port / User / Password / Database
2. 点击 **解析**，画布自动显示所有表结构和外键关系（dagre 自动布局）
3. 可在此基础上继续编辑或生成代码

### 导出与保存

- **导出 ▾** 菜单：导出 JSON / PNG / SVG / 保存项目 / 加载项目
- 保存项目：将画布数据写入服务端 `backend/projects/latest.json`
- 加载项目：从服务端读取并恢复画布

## API 简介

所有接口前缀 `/api`，请求/响应均为 JSON。

| Method | 路径 | 说明 |
|--------|------|------|
| GET | /api/health | 健康检查 |
| POST | /api/parse | MySQL 反向解析 |
| POST | /api/generate/sqlalchemy | 生成 SQLAlchemy 代码 |
| POST | /api/generate/django | 生成 Django ORM 代码 |
| POST | /api/generate/sql | 生成 CREATE TABLE SQL |
| POST | /api/project/save | 保存画布状态 |
| GET | /api/project/load | 加载画布状态 |

## 目录结构

```
orm-visualizer/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── models.py            # Pydantic 数据模型
│   ├── routers/             # API 路由（parse / generate / project）
│   ├── services/
│   │   ├── parser.py        # MySQL 反向解析
│   │   └── codegen.py       # 代码生成逻辑
│   ├── templates/           # Jinja2 模板（sqlalchemy/django/sql）
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/      # Canvas / Toolbar / Sidebar / CodePanel / ConnectPanel
        ├── store/canvas.ts  # Zustand 全局状态
        ├── services/api.ts  # 后端 API 封装
        ├── utils/export.ts  # 导出工具
        └── types/index.ts   # TypeScript 类型定义
```

## 注意事项

- MySQL 连接密码仅在请求生命周期内使用，不写入日志，不持久化到磁盘
- 多对多关系通过识别"仅含 2 个外键列的中间表"自动处理
- 前端不依赖任何 UI 组件库，样式全部为 inline style
