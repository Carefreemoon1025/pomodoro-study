# 番茄专注

一个优先本地存储的 Windows 番茄钟学习软件。每个专注阶段绑定一项学习任务，
支持暂停、提前结束、长休息、今日统计、最近 7 天趋势、系统托盘和深浅主题。

## 开发

```powershell
npm install
npm run dev
```

## 验证

```powershell
npm test -- --run
npm run typecheck
npm run build
npm run test:e2e
```

## 打包

```powershell
npm run dist:win
```

Windows 便携版和安装包输出到 `release/`。

## 数据

应用不需要账号，任务和专注记录保存在 Electron 用户数据目录中的
`data.json`。写入前会生成备份，数据损坏时自动尝试恢复。

删除任务采用软删除：任务从活动列表移除，但历史专注记录和统计仍然保留。
