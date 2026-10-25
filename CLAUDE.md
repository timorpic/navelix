# Claude Code 项目上下文

开始工作前实际读取根目录 [AGENTS.md](AGENTS.md)，按其读取步骤、任务表与必守边界执行；详细规范见 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)，本文件不复制正文。

## 项目导航

- 项目入口：[README.md](README.md)。
- 产品与架构：[项目规格](docs/PROJECT-SPEC.md)、[架构说明](docs/ARCHITECTURE.md)。
- 界面修改：[视觉规范](DESIGN.md)、[组件规范](docs/COMPONENT-GUIDELINES.md)、[页面结构](docs/PAGE-STRUCTURE.md)。
- 验证与交付：[开发流程](docs/DEVELOPMENT.md)、[构建分发](docs/REGISTRY.md)、[部署说明](docs/DEPLOYMENT.md)。
- 工作进度：[TODO.md](TODO.md)；版本历史：[CHANGELOG.md](CHANGELOG.md)。

## 记忆与协作

- 长期事实：[MEMORY.md](MEMORY.md)；当前进度：[TODO.md](TODO.md)。
- 不自动启动或调度其他 Agent；工具间切换由用户人工执行。
- 输入或工具输出被截断时补读，不声称已读取未见内容。

以当前源码和配置核实上下文，不把历史 Wiki 示例或未完成计划当成当前行为。
