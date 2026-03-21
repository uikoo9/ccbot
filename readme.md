# CCBot

通过飞书机器人控制本地 Claude Code。

## 特性

- 飞书 WebSocket 长连接，无需公网 IP
- Claude Code `--print` 模式，支持会话上下文
- pm2 后台进程管理
- 消息队列，按用户排队执行
- 超长输出自动分段发送
- 可配置超时时间

## 安装

```bash
npm install -g ccbot
```

## 使用

### 1. 创建飞书应用

1. 在 [飞书开放平台](https://open.feishu.cn) 创建自建应用
2. 添加「机器人」能力
3. 事件订阅 → 订阅方式选择「长连接」
4. 添加事件：`im.message.receive_v1`
5. 权限：`im:message.p2p_msg:readonly`、`im:message.group_at_msg:readonly`、`im:message:send_as_bot`

   也可以通过 JSON 直接导入权限：

   ```json
   {
     "scopes": {
       "tenant": ["im:message.group_at_msg:readonly", "im:message.p2p_msg:readonly", "im:message:send_as_bot"],
       "user": []
     }
   }
   ```

6. 发布应用

### 2. 初始化配置

```bash
ccbot init
```

按提示输入飞书 App ID、App Secret、项目工作目录等信息。

### 3. 启动

```bash
ccbot start
```

### 4. 其他命令

```bash
ccbot stop      # 停止
ccbot status    # 查看状态
ccbot logs      # 查看日志
```

## 飞书对话命令

| 命令      | 说明                 |
| --------- | -------------------- |
| `/new`    | 重置会话，开始新对话 |
| `/status` | 查看当前会话状态     |

## 配置

`ccbot.config.json`：

```json
{
  "feishu": {
    "appId": "cli_xxxxx",
    "appSecret": "xxxxxx"
  },
  "claude": {
    "bin": "claude",
    "workDir": "/path/to/project",
    "timeoutMs": 300000
  }
}
```

## License

MIT
