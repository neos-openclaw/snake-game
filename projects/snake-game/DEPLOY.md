# 贪吃蛇游戏 - 部署指南

## 快速开始

```bash
# 一键启动
./deploy.sh start

# 查看状态
./deploy.sh status

# 查看日志
./deploy.sh logs

# 停止服务
./deploy.sh stop
```

## 服务地址

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:3001
- **统一入口**: http://localhost:80 (通过 Nginx)

## 环境配置

首次运行会自动从 `.env.example` 创建 `.env` 文件，请修改敏感配置：

```bash
# 编辑环境变量
vim .env
```

**重要配置项：**
- `JWT_SECRET`: JWT 密钥（生产环境必须修改）
- `POSTGRES_PASSWORD`: 数据库密码

## 目录结构

```
snake-game/
├── docker-compose.yml      # Docker 编排文件
├── deploy.sh               # 一键部署脚本
├── .env.example            # 环境变量模板
├── .env                    # 环境变量（不提交）
├── backend/                # 后端服务
│   └── Dockerfile
├── frontend/               # 前端服务
│   ├── Dockerfile
│   └── nginx.conf
├── nginx/                  # Nginx 反向代理
│   └── nginx.conf
└── ssl/                    # SSL 证书目录
```

## 开发指南

### 前端开发

```bash
cd frontend
npm install
npm start
```

### 后端开发

```bash
cd backend
npm install
npm run start:dev
```

## 生产部署

1. 修改 `.env` 中的敏感配置
2. 配置 SSL 证书（放置到 `ssl/` 目录）
3. 启用 `nginx/nginx.conf` 中的 HTTPS 配置
4. 运行 `./deploy.sh start`

## 数据备份

```bash
# 备份数据库
./deploy.sh backup

# 恢复数据库
cat backup.sql | docker-compose exec -T db psql -U snake snake_db
```

## 常见问题

**Q: 端口被占用怎么办？**
A: 修改 `docker-compose.yml` 中的端口映射

**Q: 数据库连接失败？**
A: 等待数据库启动（约 10 秒），或检查健康检查日志

**Q: 前端无法访问后端 API？**
A: 检查 CORS_ORIGIN 配置是否正确

---

*运维负责人: 赵磊*
*更新时间: 2026-03-04*
