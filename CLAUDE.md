# ORM Visualizer

## 项目概述

面向开发者的 ORM 关系可视化工具。

**核心能力：**
- 图形化编辑实体和关系（一对一、一对多、多对多）
- 正向生成：设计图 → SQLAlchemy / Django ORM 代码 + 建表 SQL
- 反向解析：连接 MySQL → 自动解析表结构和外键 → 生成关系图
- 导出：关系图（JSON/PNG/SVG）、SQL 脚本、ORM 代码文件

**开发分阶段推进，每个 Phase 完成后等待确认再继续：**
- Phase 1：基础画布 + 手动添加实体/关系 + 前后端联通
- Phase 2：字段编辑 + 代码生成（SQLAlchemy/Django/SQL）
- Phase 3：MySQL 反向解析 + 自动布局
- Phase 4：导出功能 + 项目文件保存/加载 + UI 优化

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端 | React + TypeScript + Vite |
| 图形引擎 | React Flow + dagre（自动布局） |
| 全局状态 | Zustand |
| 后端 | Python 3.11+ + FastAPI + Uvicorn |
| ORM 解析 | SQLAlchemy Core（inspect）|
| 代码生成 | Jinja2 模板 |
| 数据库连接 | PyMySQL + SQLAlchemy Engine |
| 前后端通信 | REST + JSON |

---

## 目录结构

```
orm-visualizer/
├── CLAUDE.md
├── tasks/
│   ├── current.md
│   ├── progress.md
│   └── decisions.md
├── backend/
│   ├── main.py                  # FastAPI 入口，注册路由，配置 CORS
│   ├── models.py                # Pydantic 请求/响应模型
│   ├── routers/
│   │   ├── schema.py            # POST /api/parse（反向解析）
│   │   ├── generate.py          # POST /api/generate/{target}
│   │   └── project.py           # POST /api/project/save, GET /api/project/load
│   ├── services/
│   │   ├── parser.py            # MySQL 元数据解析逻辑
│   │   └── codegen.py           # ORM/SQL 代码生成逻辑
│   ├── templates/
│   │   ├── sqlalchemy.py.j2
│   │   ├── django.py.j2
│   │   └── sql.sql.j2
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── components/
    │   │   ├── Canvas.tsx        # React Flow 主画布
    │   │   ├── EntityNode.tsx    # 自定义实体节点
    │   │   ├── Toolbar.tsx       # 顶部工具栏
    │   │   └── Sidebar.tsx       # 右侧属性编辑面板
    │   ├── services/
    │   │   └── api.ts            # 所有后端 API 调用封装
    │   └── store/
    │       └── canvas.ts         # Zustand 全局状态
    ├── package.json
    └── vite.config.ts
```

---

## 环境变量

**后端（backend/.env）：**
```
# 无需持久化数据库连接信息，MySQL 连接仅在请求生命周期内使用
CORS_ORIGINS=http://localhost:3000
```

**前端（frontend/.env）：**
```
VITE_API_BASE_URL=http://localhost:8000
```

---

## 启动方式

**后端：**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**前端：**
```bash
cd frontend
npm install
npm run dev   # 默认端口 3000
```

**验证联通：**
```bash
curl http://localhost:8000/api/health
# 期望返回：{"status": "ok"}
```

---

## API 规范

所有接口前缀 `/api`，请求/响应均为 JSON。

| Method | 路径 | 功能 |
|--------|------|------|
| GET | /api/health | 健康检查 |
| POST | /api/parse | MySQL 反向解析，返回 entities + relations |
| POST | /api/generate/sqlalchemy | 生成 SQLAlchemy 模型代码 |
| POST | /api/generate/django | 生成 Django ORM 模型代码 |
| POST | /api/generate/sql | 生成建表 SQL 脚本 |
| POST | /api/project/save | 保存画布状态为 JSON |
| GET | /api/project/load | 加载 JSON 项目文件 |

**标准画布数据结构（所有接口共用）：**
```json
{
  "entities": [
    {
      "id": "uuid",
      "name": "User",
      "fields": [
        { "name": "id", "type": "Integer", "primary_key": true, "nullable": false },
        { "name": "username", "type": "String", "length": 128, "nullable": false }
      ]
    }
  ],
  "relations": [
    {
      "id": "uuid",
      "type": "one_to_many",
      "source": "entity_id_1",
      "target": "entity_id_2",
      "source_field": "id",
      "target_field": "user_id"
    }
  ]
}
```

**relation.type 枚举：** `one_to_one` | `one_to_many` | `many_to_many`

**field.type 枚举：** `Integer` | `String` | `Text` | `Boolean` | `Float` | `DateTime` | `Date`

---

## 开发规范

**通用：**
- 每个 Phase 完成后停下来，输出验证步骤，等待确认再推进下一 Phase
- 不要一次性实现所有功能，严格按 Phase 顺序

**后端：**
- 所有路由函数加类型注解，用 Pydantic 模型做请求/响应校验
- MySQL 连接信息不写入任何日志，不持久化到磁盘
- 异常统一返回 `{"error": "描述"}` + 对应 HTTP 状态码
- parser.py 和 codegen.py 纯函数逻辑，不依赖 FastAPI，便于单独测试

**前端：**
- 所有后端调用封装在 `services/api.ts`，组件内不直接 fetch
- Canvas 状态只通过 Zustand store 修改，不在组件内用 useState 管理图形数据
- EntityNode 为受控组件，数据来自 store
- 不使用任何 UI 组件库，样式用 CSS Modules 或 inline style

**代码生成模板（Jinja2）：**
- 每种目标（sqlalchemy/django/sql）对应独立 .j2 文件
- 模板只做渲染，字段类型映射逻辑在 codegen.py 中处理

---

## 任务管理

```
tasks/current.md    # 当前任务（由项目负责人维护，你只读）
tasks/progress.md   # 进度快照（你在每次 session 结束前更新）
tasks/decisions.md  # 技术决策记录（遇到分支决策时更新）
```

**每次新 session 开头，必须按顺序执行：**
1. 读 `CLAUDE.md`（本文件）
2. 读 `tasks/progress.md`（了解当前进度）
3. 读 `tasks/decisions.md`（了解已有技术决策，不重复讨论）
4. 读 `tasks/current.md`（明确本次要做什么）
5. 执行任务

**每次 session 结束前，必须：**
1. 更新 `tasks/progress.md`：记录本次完成内容、当前状态、下一步
2. 如有新技术决策（选了某个方案、放弃某个方案），追加到 `tasks/decisions.md`
3. 不修改 `tasks/current.md`

---

## 禁止事项

- 禁止跨 Phase 实现功能（Phase 1 不写代码生成逻辑）
- 禁止在后端持久化或打印 MySQL 密码等连接凭据
- 禁止在组件内直接调用 fetch，必须通过 `services/api.ts`
- 禁止在 Canvas 组件内用 useState 管理节点/边数据，统一走 Zustand
- 禁止使用 any 类型（TypeScript），所有数据结构必须有明确类型定义
- 禁止修改 `tasks/current.md`
- 禁止在未完成当前 Phase 的情况下开始下一 Phase