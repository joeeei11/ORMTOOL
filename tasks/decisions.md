# 技术决策记录

## 2026-03-10

### greenlet 版本固定为 3.1.1
- **背景**：SQLAlchemy 依赖 greenlet，greenlet 3.2.5 在 Python 3.9 + Windows 上没有预编译 wheel，需要 MSVC 编译
- **决策**：在 requirements.txt 中固定 `greenlet==3.1.1`（该版本有 cp39 win_amd64 预编译 wheel）
- **影响**：无功能影响，greenlet 仅用于 SQLAlchemy 的异步支持

### React Flow 使用 @xyflow/react v12
- **背景**：reactflow 包已更名为 @xyflow/react
- **决策**：使用 `@xyflow/react ^12.0.0`（新包名）
- **影响**：导入路径为 `@xyflow/react` 而非旧版 `reactflow`

### EntityNode 使用无泛型 NodeProps + as 断言
- **背景**：`NodeProps<EntityNodeType>` 与 `NodeTypes` 注册类型（`Record<string, ComponentType<NodeProps>>`）存在逆变兼容性问题，强行标注泛型会导致 TypeScript 错误
- **决策**：`EntityNode` 接收 `NodeProps`（不带泛型），在组件内用 `data['name'] as string` / `data['fields'] as EntityField[]` 做 as 断言；store 的 nodes 类型为基础 `Node[]`
- **影响**：节点 data 的类型安全边界在组件内部，store 层不做细粒度泛型约束；符合规范"禁止 any，允许 as 断言"

### 节点 ID 使用 crypto.randomUUID()
- **背景**：项目未引入 uuid 第三方库
- **决策**：用浏览器内置 `crypto.randomUUID()` 生成节点 ID（现代浏览器和 Node 15+ 均支持）
- **影响**：无需额外依赖

### removeField 使用 findIndex 精确删除
- **背景**：按字段名删除时，`filter` 会把所有同名字段一并删除，存在误删风险
- **决策**：用 `findIndex` 找到第一个匹配项，再用 `slice` 拼接，只删除一条
- **影响**：同名字段只删第一个，行为与直觉一致；Store 接口签名仍保持 `removeField(entityId, fieldName)` 不变

### models.py 使用 Optional[int] 替代 int | None
- **背景**：`int | None` 是 Python 3.10+ 的 union 语法，Python 3.9 在类体中解析时会报 TypeError；Pydantic v2 在 Python 3.9 也无法通过 eval_type_backport 处理它
- **决策**：在 models.py 中用 `from typing import Optional` + `Optional[int]` 替代 `int | None`
- **影响**：对其他文件无影响；main.py 等其他后端文件不需要修改

### SQL 模板使用 format_fields 辅助函数
- **背景**：Jinja2 `trim_blocks=True` 会吃掉所有块标签 `{% %}` 后的第一个换行符，导致 `{% endif %}` 后的字段行没有换行，输出成一行
- **决策**：在 codegen.py 的 `generate_sql` 中增加 `format_fields(entity)` 函数，将字段列表预处理为以 `,\n` 连接的字符串，模板只做 `{{ format_fields(entity) }}` 一次调用
- **影响**：SQL 模板保持简洁，字段格式化逻辑在 Python 层；SQLAlchemy 和 Django 模板仍然保留字段的 `{% for %}` 循环（因为这两种格式的每行末尾不以块标签结束，无此问题）

### SQLAlchemy inspect 从顶层包导入
- **背景**：`inspect` 函数在 SQLAlchemy 1.4+ 已移至顶层包，无法从 `sqlalchemy.engine` 导入
- **决策**：使用 `from sqlalchemy import create_engine, inspect, text`，`Inspector` 类型注解仍从 `sqlalchemy.engine` 导入
- **影响**：无功能影响，仅修正导入路径

### dagre 节点位置以节点中心为基准
- **背景**：dagre 返回的 `(x, y)` 是节点中心坐标，而 React Flow 的 position 是左上角坐标
- **决策**：转换公式 `position = { x: pos.x - 100, y: pos.y - height/2 }`（宽度固定 200，高度动态）
- **影响**：节点在画布上不偏移、不重叠

### Zustand create 使用 (set, get) 实现非响应式读取 action
- **背景**：`getCanvasData()` 需要在事件回调中读取当前 store 状态（非 React 渲染路径），不能用 `useCanvasStore` hook
- **决策**：将 `create<CanvasStore>((set) => ...)` 改为 `(set, get) => ...`，在 `getCanvasData` 内调用 `get()` 获取当前 nodes/edges
- **影响**：`getCanvasData` 可被 Toolbar 事件处理器调用，无需在组件内维护额外 state；store 签名对外透明

### 下拉菜单关闭使用透明遮罩层
- **背景**：点击下拉菜单外部关闭需要检测"外部点击"，常见方案是 `useRef + addEventListener`，但需管理副作用生命周期
- **决策**：在下拉打开时渲染一个 `position: fixed; inset: 0; z-index: 99` 的透明 `<div>`，`onClick` 关闭下拉；菜单项 `z-index: 100` 覆盖其上
- **影响**：不需要 `useRef` 或 `useEffect`，代码更简洁；与 ConnectPanel 的遮罩模式一致

### html-to-image 通过 `.react-flow` CSS 类定位画布元素
- **背景**：`@xyflow/react` 会自动给根容器添加 `react-flow` CSS 类名，无需手动维护 ref
- **决策**：`exportPNG`/`exportSVG` 使用 `document.querySelector('.react-flow')` 获取目标元素，强转为 `HTMLElement`
- **影响**：export.ts 与 Canvas 组件解耦，无需传递 ref；若 @xyflow/react 未来改变类名则需同步更新

### 实体名输入框使用 onChange 实时更新
- **背景**：current.md 描述为"失焦后保存"，但完成标准要求"修改实体名，节点标题实时更新"，两者矛盾
- **决策**：以完成标准为准，使用 `onChange` 每次击键即调用 `updateEntityName` 写入 store，无需维护本地 state
- **影响**：节点标题与输入框内容始终同步；取消了 `onBlur` 保存逻辑
