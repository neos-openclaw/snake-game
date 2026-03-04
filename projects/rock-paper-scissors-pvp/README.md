# 剪刀石头布 PVP - 部署环境配置

## 项目概述
- **项目名称**: 剪刀石头布 PVP (Rock Paper Scissors PVP)
- **负责人**: 运维 - 赵磊
- **状态**: 环境准备中
- **更新时间**: 2026-03-04

---

## 1. 开发环境

### 1.1 后端服务
| 配置项 | 选择 | 备注 |
|--------|------|------|
| 运行时 | Node.js 20 / Go 1.21 | 待开发确认 |
| WebSocket | Socket.io / ws / gorilla | 实时对战 |
| 容器镜像 | node:20-alpine / golang:1.21-alpine | 轻量级 |

### 1.2 数据库
| 组件 | 选择 | 用途 |
|------|------|------|
| 主数据库 | PostgreSQL 15 / MongoDB 7 | 用户数据、战绩 |
| 缓存 | Redis 7 | 在线状态、房间匹配 |

### 1.3 域名配置
| 环境 | 域名 | 备注 |
|------|------|------|
| 开发 | rps-dev.example.com | 待申请 |
| 测试 | rps-test.example.com | 待申请 |
| 生产 | rps.example.com | 待申请 |

---

## 2. 部署配置

### 2.1 Dockerfile (Node.js)
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
```

### 2.2 Dockerfile (Go)
```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

FROM alpine:3.19

WORKDIR /app
COPY --from=builder /app/server .

EXPOSE 3000

CMD ["./server"]
```

### 2.3 docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://rps:password@postgres:5432/rps_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=rps
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=rps_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 2.4 Nginx 反向代理（支持 WebSocket）
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    server {
        listen 80;
        server_name rps-dev.example.com;

        # 重定向到 HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name rps-dev.example.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            
            # WebSocket 支持
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket 超时设置
            proxy_read_timeout 3600s;
            proxy_send_timeout 3600s;
        }
    }
}
```

---

## 3. CI/CD 流水线

### 3.1 GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: docker build -t rps-backend:${{ github.sha }} .
      
      - name: Push to Registry
        run: |
          docker tag rps-backend:${{ github.sha }} ${{ secrets.REGISTRY }}/rps-backend:latest
          docker push ${{ secrets.REGISTRY }}/rps-backend:latest
      
      - name: Deploy to K8s
        run: |
          kubectl set image deployment/rps-backend rps-backend=${{ secrets.REGISTRY }}/rps-backend:latest -n rps-pvp-dev
```

### 3.2 GitLab CI
```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  IMAGE_NAME: registry.example.com/rps-backend

test:
  stage: test
  image: node:20-alpine
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $IMAGE_NAME:$CI_COMMIT_SHA .
    - docker push $IMAGE_NAME:$CI_COMMIT_SHA
  only:
    - main

deploy:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/rps-backend rps-backend=$IMAGE_NAME:$CI_COMMIT_SHA -n rps-pvp-dev
  only:
    - main
```

---

## 4. 待确认事项

| 事项 | 负责人 | 状态 |
|------|--------|------|
| 后端技术栈（Node.js/Go）| 开发 | 待确认 |
| 数据库选择（PG/MongoDB）| 开发 | 待确认 |
| 代码仓库地址 | 开发 | 待确认 |
| K8s 集群访问权限 | 运维 | 待配置 |
| 镜像仓库地址 | 运维 | 待确认 |
| 域名申请 | 运维 | 待申请 |
| CI/CD 平台选择 | 运维 | 待确认 |

---

## 5. 文件清单

```
projects/rock-paper-scissors-pvp/
├── README.md              # 本文档
├── docker-compose.yml     # 本地开发环境
├── Dockerfile.node        # Node.js 版本
├── Dockerfile.go          # Go 版本
├── nginx.conf             # Nginx 配置
├── k8s/                   # K8s 资源（待创建）
│   ├── namespace.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── configmap.yaml
└── ci/                    # CI/CD 配置
    ├── github-actions.yml
    └── gitlab-ci.yml
```

---

## 6. 下一步行动

1. [ ] 确认后端技术栈（Node.js / Go）
2. [ ] 确认数据库类型（PostgreSQL / MongoDB）
3. [ ] 获取 K8s 集群 kubeconfig
4. [ ] 创建命名空间和基础资源
5. [ ] 申请测试域名
6. [ ] 配置 CI/CD 流水线

---

*文档创建时间: 2026-03-04*
*最后更新: 2026-03-04 21:52*
