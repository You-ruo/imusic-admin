# ============================================
# imusic-admin — Vue 3 管理后台 SPA
# ============================================

# Stage 1: Node 构建
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Nginx 托管 + API 反向代理
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx 配置模板（API_TARGET 通过 envsubst 注入）
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# 默认 API 目标（容器间通信用服务名，独立部署用 IP）
ENV API_TARGET=http://backend:8080

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
