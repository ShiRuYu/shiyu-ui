# locale

每个 App 使用的国际化可能不同。这里用于扩展 dayjs、组件库和业务文案的语言切换。

`zh-CN` 与 `en-US` 必须包含相同的 JSON 文件和叶子键。新增或删除业务文案时应同步修改两种语言，并运行：

```bash
pnpm vitest run apps/web-naive/src/locales/__tests__/locale-parity.test.ts --environment happy-dom
```

词典键一致并不代表页面已完成国际化。评审时仍应检查模板文本、表格列、消息提示、选项标签和无障碍标签是否直接写入某一种语言。
