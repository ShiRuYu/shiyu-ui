# 全局 Loading

> 官方文档：https://doc.vben.pro/guide/in-depth/loading.html

全局 Loading 指的是**页面初次加载/刷新**时出现的加载动画，通常显示为旋转图标或进度条。

## 实现原理

由 `vite-plugin-inject-app-loading` 插件实现，插件会在每个应用的 `index.html` 中自动注入一个 loading HTML 片段，应用初始化完成后自动隐藏。

## 开启/关闭

在 `.env` 或 `.env.development` 中配置：

```bash
# 开启全局 loading（默认）
VITE_INJECT_APP_LOADING=true

# 关闭全局 loading
VITE_INJECT_APP_LOADING=false
```

## 自定义 Loading 样式

在应用目录下，与 `index.html` 同级，创建 `loading.html` 文件，插件会自动读取并注入。

### 必要约束

- 必须有一个 `id="__app-loading__"` 的元素
- 该元素必须有一个 `hidden` class（隐藏时使用）
- 必须有一个 `<style data-app-loading="inject-css">` 元素

### 自定义示例

```html
<style data-app-loading="inject-css">
  #__app-loading__ {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    flex-direction: column;
    gap: 16px;
    transition: all 0.3s ease-out;
  }

  #__app-loading__.hidden {
    pointer-events: none;
    visibility: hidden;
    opacity: 0;
    transition: all 1s ease-out;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #1890ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>

<div id="__app-loading__">
  <div class="loading-spinner"></div>
  <!-- 可以使用环境变量获取应用标题 -->
  <div class="title">%VITE_APP_TITLE%</div>
</div>
```

> 提示：可以在 loading.html 中使用与 `index.html` 相同的变量语法（如 `%VITE_APP_TITLE%`）来获取应用标题。
