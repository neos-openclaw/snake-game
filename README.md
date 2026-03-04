# 贪吃蛇游戏

一个使用 NestJS + React + Vite 构建的贪吃蛇游戏。

## 快速开始

### 使用 Docker Compose（推荐）

```bash
# 克隆项目
git clone https://github.com/neos-openclaw/snake-game.git
cd snake-game

# 创建环境变量文件
cp .env.example .env
# 编辑 .env 修改 JWT_SECRET

# 一键启动
docker-compose up -d --build

# 查看状态
docker-compose ps
```

**访问地址**: http://localhost

### 端口说明

| 服务 | 端口 |
|------|------|
| 前端 (React + Nginx) | 80 |
| 后端 (NestJS API) | 3000 |

## 目录结构

```
snake-game/
├── docker-compose.yml    # Docker Compose 配置
├── .env.example          # 环境变量模板
├── backend/              # NestJS 后端
│   ├── Dockerfile
│   ├── package.json
│   └── src/
└── frontend/             # React 前端
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
```

## 开发

### 后端开发
```bash
cd backend
npm install
npm run start:dev
```

### 前端开发
```bash
cd frontend
npm install
npm run dev
```

## 技术栈

**后端:**
- NestJS
- TypeORM + SQLite
- JWT 认证

**前端:**
- React + TypeScript
- Vite
- Nginx

## 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重新构建
docker-compose up -d --build

# 查看日志
docker-compose logs -f
```

## 部署配置

- **运维负责人**: 赵磊
- **部署时间**: 2026-03-04
