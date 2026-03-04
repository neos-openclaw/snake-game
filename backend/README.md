# 贪吃蛇游戏后端 API

基于 NestJS 的贪吃蛇游戏后端服务。

## 技术栈

- **框架:** NestJS 10
- **数据库:** SQLite + TypeORM
- **认证:** JWT + Passport
- **验证:** class-validator

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

### 3. 访问

服务运行在: http://localhost:3000

## API 接口

### 认证相关

#### 注册
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "player1",
  "email": "player1@example.com",
  "password": "123456"
}
```

**Response (201):**
```json
{
  "message": "注册成功"
}
```

---

#### 登录
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "player1",
  "password": "123456"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "player1",
    "email": "player1@example.com",
    "createdAt": "2026-03-04T14:00:00.000Z"
  }
}
```

---

#### 获取用户信息
```
GET /api/auth/profile
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": 1,
  "username": "player1",
  "email": "player1@example.com",
  "createdAt": "2026-03-04T14:00:00.000Z"
}
```

---

### 分数相关

#### 提交分数
```
POST /api/scores
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "score": 1500
}
```

**Response (201):**
```json
{
  "message": "分数提交成功"
}
```

---

#### 排行榜 Top 10
```
GET /api/scores/leaderboard
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "rank": 1,
    "username": "player1",
    "score": 2000,
    "createdAt": "2026-03-04T14:30:00.000Z"
  },
  {
    "rank": 2,
    "username": "player2",
    "score": 1800,
    "createdAt": "2026-03-04T14:25:00.000Z"
  }
]
```

---

#### 个人历史记录
```
GET /api/scores/history
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "userId": 1,
    "score": 1500,
    "createdAt": "2026-03-04T14:30:00.000Z"
  }
]
```

---

## 数据表

### users
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| username | VARCHAR | 用户名（唯一） |
| email | VARCHAR | 邮箱（唯一） |
| password | VARCHAR | 密码哈希 |
| createdAt | DATETIME | 创建时间 |

### scores
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| userId | INTEGER | 用户 ID（外键） |
| score | INTEGER | 分数 |
| createdAt | DATETIME | 创建时间 |

---

## Docker 部署

### 构建镜像
```bash
docker build -t snake-game-backend .
```

### 运行容器
```bash
docker run -p 3000:3000 snake-game-backend
```

---

## 环境变量

```bash
JWT_SECRET=your-secret-key
PORT=3000
```

---

## 项目结构

```
backend/
├── src/
│   ├── auth/           # 认证模块
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.dto.ts
│   │   └── jwt.strategy.ts
│   ├── scores/         # 分数模块
│   │   ├── scores.module.ts
│   │   ├── scores.controller.ts
│   │   ├── scores.service.ts
│   │   ├── score.entity.ts
│   │   └── score.dto.ts
│   ├── users/          # 用户实体
│   │   └── user.entity.ts
│   ├── app.module.ts
│   └── main.ts
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

---

**版本:** 1.0.0  
**作者:** 孟轩  
**日期:** 2026-03-04
