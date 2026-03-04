# 贪吃蛇游戏

经典贪吃蛇游戏的 React + TypeScript 实现。

## 技术栈

- React 18
- TypeScript
- Vite
- CSS3

## 功能

- ✅ 20x20 格子游戏区域
- ✅ 键盘方向键控制
- ✅ 触屏滑动支持
- ✅ 实时计分
- ✅ 开始/暂停/重新开始
- ✅ 排行榜
- ✅ 用户登录/注册

## 本地开发

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000

## Docker 构建

```bash
cd frontend
docker build -t snake-game-frontend .
docker run -p 80:80 snake-game-frontend
```

## 项目结构

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Game.tsx
│   │   └── Leaderboard.tsx
│   ├── hooks/
│   │   └── useSnakeGame.ts
│   ├── services/
│   │   └── api.ts
│   ├── App.tsx
│   └── App.css
├── Dockerfile
├── nginx.conf
└── vite.config.ts
```
