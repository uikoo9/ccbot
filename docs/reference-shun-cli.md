# shun-cli 参考笔记

## 项目结构
- 极简CLI，5个源文件在 `bin/` 下
- 依赖：commander, picocolors, pm2

## shunjs start 流程
1. `ensurePm2()` - 检查pm2是否全局安装，没有则自动 `npm i -g pm2`
2. `pm2.connect()` - 连接pm2 daemon
3. 对每个server参数：
   - 解析包名和版本
   - `npm i -g` 全局安装
   - 定位 `app.js` 和本地配置 `<name>.json`
   - `pm2.startOrReload()` - 已存在则reload，否则start
4. `pm2 save` 持久化进程列表
5. `pm2.disconnect()`

## pm2 使用方式
- Node API: connect/start/reload/list/disconnect
- CLI: `pm2 save`, `pm2 --version`
- 配置JSON路径作为args传给app.js

## 关键点
- 无交互式输入，全靠命令行参数
- server���约定有 `app.js` 入口
- 用户目录下需要 `<name>.json` 配置文件
