# 云记计算器 - 部署环境配置

## 项目概述
- **项目名称**: 云记计算器 (Cloud Note Calculator)
- **负责人**: 运维 - 赵磊
- **状态**: 环境准备中

---

## 1. 开发环境

### 1.1 后端服务
| 配置项 | 选择 | 备注 |
|--------|------|------|
| 运行时 | Node.js 20 | 待确认 |
| 框架 | Express/Fastify | 待开发确定 |
| 容器镜像 | node:20-alpine | 轻量级 |

### 1.2 数据库
| 配置项 | 选择 | 备注 |
|--------|------|------|
| 类型 | PostgreSQL 15 | 待确认 |
| 存储 | 阿里云 NAS/云盘 | 持久化 |
| 备份 | 每日自动备份 | 阿里云 RDS 可选 |

### 1.3 域名配置
| 环境 | 域名 | 备注 |
|------|------|------|
| 开发 | calc-dev.example.com | 待申请 |
| 测试 | calc-test.example.com | 待申请 |
| 生产 | calc.example.com | 待申请 |

---

## 2. CI/CD 流水线

### 2.1 流水线架构
```
代码提交 → 单元测试 → 构建镜像 → 推送镜像 → 部署到 K8s
```

### 2.2 工具选择
- **代码仓库**: Git (待确认地址)
- **CI/CD**: 阿里云云效 / Jenkins / GitLab CI
- **镜像仓库**: 阿里云容器镜像服务 (ACR)
- **部署目标**: KubeSphere / K8s

### 2.3 流水线阶段
1. **Lint & Test** - 代码检查和单元测试
2. **Build** - 构建 Docker 镜像
3. **Push** - 推送到 ACR
4. **Deploy Dev** - 自动部署到开发环境
5. **Deploy Test** - 手动触发部署到测试环境
6. **Deploy Prod** - 手动触发部署到生产环境

---

## 3. K8s 资源清单 (待创建)

### 3.1 Namespace
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: cloud-note-calc-dev
```

### 3.2 Deployment (模板)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: calc-backend
  namespace: cloud-note-calc-dev
spec:
  replicas: 2
  selector:
    matchLabels:
      app: calc-backend
  template:
    metadata:
      labels:
        app: calc-backend
    spec:
      containers:
      - name: calc-backend
        image: registry.cn-hangzhou.aliyuncs.com/xxx/calc-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "development"
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
```

### 3.3 Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: calc-backend-svc
  namespace: cloud-note-calc-dev
spec:
  selector:
    app: calc-backend
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

### 3.4 Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: calc-ingress
  namespace: cloud-note-calc-dev
spec:
  rules:
  - host: calc-dev.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: calc-backend-svc
            port:
              number: 80
```

---

## 4. 待确认事项

| 事项 | 负责人 | 状态 |
|------|--------|------|
| 后端技术栈确认 | 开发 | 待确认 |
| 数据库类型确认 | 开发/运维 | 待确认 |
| K8s 集群访问权限 | 运维 | 待配置 |
| 镜像仓库地址 | 运维 | 待确认 |
| 域名申请 | 运维 | 待申请 |
| CI/CD 工具选择 | 运维 | 待确认 |

---

## 5. 下一步行动

1. [ ] 获取 K8s 集群 kubeconfig
2. [ ] 确认后端技术栈
3. [ ] 创建命名空间和基础资源
4. [ ] 配置 CI/CD 流水线
5. [ ] 申请测试域名

---

*文档创建时间: 2026-03-04*
*最后更新: 2026-03-04*
