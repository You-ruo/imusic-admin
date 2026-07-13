# CONTEXT — imusic-admin

音乐流媒体平台管理后台，基于 Vue 3 + Element Plus，供运营/管理员使用。

## Glossary

### 技术栈

- **Vue 3**：Composition API + `<script setup>`。
- **Element Plus**：UI 组件库，配合 `@element-plus/icons-vue` 图标。
- **Vite 5**：构建工具，`unplugin-auto-import` + `unplugin-vue-components` 自动导入 Element Plus。
- **Vue Router 4**：hash 模式路由 (`createWebHashHistory`)。
- **Pinia**：状态管理。

### 后端交互

- **管理 API (`/adminapi`)**：ThinkPHP 多应用的 `adminapi` app。所有管理端 API 通过此前缀访问。
- **Vite dev proxy**：开发时将 `/adminapi` 代理到后端（同源策略）。生产环境由 Gateway Nginx 统一路由。

### 部署

- **路径**：独立部署在根路径 `/`，Vite `base` 设为 `'/'`。也可通过 Gateway Nginx 以 `/admin/` 前缀访问。
- **Docker**：Multi-stage build — `node:20-alpine` 构建 → `nginx:alpine` 托管静态文件。
- **CD**：GitHub Actions 自动构建 Docker 镜像 → 推送 Docker Hub → SSH 部署到服务器。
- **API 代理**：生产环境通过 `API_TARGET` 环境变量注入 nginx 配置，默认代理到后端服务。

## Architecture

- **目录结构**：`src/router/` (路由)、`src/views/` (页面)、`src/api/` (后端调用)、`src/stores/` (Pinia stores)。
- **静态资源**：`public/` 目录存放 favicon 等不需编译的资源。
- **构建产物**：`dist/` 目录，由 `nginx:alpine` 直接托管。
