# webcc.dev 参考笔记

## 核心架构
- monorepo: cli, cli-server, cli-web, ui-terminal, index(Next.js站点)

## Claude Code 通信方式
- 通过 `expect` 脚本创建PTY，spawn Claude Code为子进程
- stdio: ['pipe', 'pipe', 'pipe']
- 注入环境变量: ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_MODEL 等
- stdout过滤掉expect自身日志

## WebSocket协议 (Socket.IO)
- `cli-input` - 终端按键输入
- `cli-output` - { type: stdout|stderr|exit|error, data, time }
- `cli-restart` - 重启Claude进程

## 两种模式
### Local模式
- Express + Socket.IO 监听 port 4000
- 浏览器直连本地server
- 无认证

### Online模式
- 本地CLI连接到 wss://ws.webcc.dev
- 通过token配对browser和cli
- 输出缓冲(1000 chunks / 5MB)

## 关键文件
- cli-server/src/cli.js - Claude进程管理
- cli-server/src/socket.js - Socket.IO事件路由
- cli-server/src/expect-template.js - PTY创建
