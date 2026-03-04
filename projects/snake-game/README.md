# 贪吃蛇游戏 - Docker Compose 部署配置

## 项目概述
- **项目名称**: 贪吃蛇游戏 (Snake Game)
- **负责人**: 运维 - 赵磊
- **状态**: 部署配置准备中
- **更新时间**: 2026-03-04

---

## 1. 服务架构

```
                    ┌─────────────────────────────────────┐
                    │           Nginx (80/443)            │
                    │                                     │
                    │    /api/* → backend:3001            │
                    │    /*     → frontend:3000           │
                    └─────────────────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
    ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
    │   Frontend    │        │   Backend     │        │   PostgreSQL  │
    │   React+Nginx │        │   NestJS      │        │   (可选)      │
    │   Port: 3000  │        │   Port: 3001  │        │   Port: 5432  │
    └───────────────┘        └───────────────┘        └───────────────┘
```

---

## 2. 目录结构

```
snake-game/
├── docker-compose.yml          # 主编排文件
├── .env                        # 环境变量（不提交到 Git）
├── .env.example                # 环境变量模板
├── backend/
│   ├── Dockerfile              # 后端 Dockerfile（开发提供）
│   ├── package.json
│   └── src/
├── frontend/
│   ├── Dockerfile              # 前端 Dockerfile（开发提供）
│   ├── nginx.conf              # Nginx 配置
│   ├── package.json
│   └── src/
└── README.md
```

---

## 3. docker-compose.yml

```yaml
version: '3.8'

services:
  # ============== 后端服务 ==============
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: snake-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://snake:snake123@db:5432/snake_db
      - JWT_SECRET=${JWT_SECRET:-your-jwt-secret-here}
      - CORS_ORIGIN=${CORS_ORIGIN:-http://localhost:3000}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - snake-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ============== 前端服务 ==============
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: snake-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    environment:
      - API_URL=http://backend:3001
    depends_on:
      - backend
    networks:
      - snake-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ============== 数据库（可选） ==============
  db:
    image: postgres:15-alpine
    container_name: snake-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=snake
      - POSTGRES_PASSWORD=snake123
      - POSTGRES_DB=snake_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - snake-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U snake -d snake_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============== Nginx 反向代理（可选） ==============
  nginx:
    image: nginx:alpine
    container_name: snake-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - snake-network

networks:
  snake-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

---

## 4. 环境变量配置

### .env.example
```bash
# 后端配置
NODE_ENV=production
PORT=3001
JWT_SECRET=your-jwt-secret-change-me
CORS_ORIGIN=http://localhost:3000

# 数据库配置
POSTGRES_USER=snake
POSTGRES_PASSWORD=snake123
POSTGRES_DB=snake_db
DATABASE_URL=postgresql://snake:snake123@db:5432/snake_db

# 前端配置
API_URL=http://localhost:3001
```

### .env（实际使用，不提交）
```bash
# 复制 .env.example 为 .env 并修改
cp .env.example .env
```

---

## 5. Dockerfile 模板

### backend/Dockerfile（模板，由开发提供最终版本）
```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

### frontend/Dockerfile（模板，由开发提供最终版本）
```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### frontend/nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;

        root /usr/share/nginx/html;
        index index.html;

        # SPA 路由支持
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API 代理（可选）
        location /api/ {
            proxy_pass http://backend:3001/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

---

## 6. 部署命令

```bash
# 克隆项目
git clone https://github.com/neos-openclaw/snake-game.git
cd snake-game

# 创建环境变量文件
cp .env.example .env
# 编辑 .env 修改敏感配置

# 构建并启动（一键部署）
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps

# 停止服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v

# 重新构建单个服务
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

---

## 7. 数据持久化

| 卷名 | 用途 | 挂载点 |
|------|------|--------|
| postgres_data | PostgreSQL 数据 | /var/lib/postgresql/data |

### 备份数据库
```bash
# 导出数据库
docker-compose exec db pg_dump -U snake snake_db > backup.sql

# 恢复数据库
cat backup.sql | docker-compose exec -T db psql -U snake snake_db
```

---

## 8. 健康检查

| 服务 | 检查方式 | 端点 |
|------|----------|------|
| backend | HTTP | /health |
| frontend | HTTP | / |
| db | pg_isready | - |

### 检查命令
```bash
# 检查所有服务健康状态
docker-compose ps

# 手动检查后端
curl http://localhost:3001/health

# 手动检查前端
curl http://localhost:3000
```

---

## 9. 生产环境建议

1. **安全加固**
   - 修改默认密码
   - 使用强 JWT_SECRET
   - 启用 HTTPS（配置 SSL 证书）
   - 限制端口暴露（仅暴露 80/443）

2. **性能优化**
   - 增加 replicas（水平扩展）
   - 配置资源限制（CPU/内存）
   - 启用 Nginx 缓存

3. **监控告警**
   - 接入日志收集
   - 配置健康检查告警
   - 监控资源使用

---

## 10. 待确认事项

| 事项 | 负责人 | 状态 |
|------|--------|------|
| 后端 Dockerfile | 开发 | 待提供 |
| 前端 Dockerfile | 开发 | 待提供 |
| 是否需要数据库 | 开发 | 待确认 |
| 域名配置 | 运维 | 待申请 |
| SSL 证书 | 运维 | 待配置 |

---

## 11. 下一步行动

1. [ ] 等待开发提供 Dockerfile
2. [ ] 确认是否需要 PostgreSQL（可用 SQLite 替代）
3. [ ] 配置生产环境域名
4. [ ] 申请 SSL 证书
5. [ ] 部署测试

---

*文档创建时间: 2026-03-04*
*最后更新: 2026-03-04 22:08*
