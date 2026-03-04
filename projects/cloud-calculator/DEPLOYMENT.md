# 云记计算器 - 部署环境配置文档

> 创建时间: 2026-03-04
> 状态: 待配置
> 负责人: 赵磊 (运维)

---

## 1. 项目概述

云记计算器是一个在线计算服务，需要部署到阿里云 Kubernetes 集群。

---

## 2. 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    阿里云 K8s 集群                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────┐    ┌─────────────┐    ┌───────────┐  │
│   │   Ingress   │───▶│  Backend    │───▶│  Database │  │
│   │  (SLB/域名)  │    │ (Node.js)   │    │ (MySQL)   │  │
│   └─────────────┘    └─────────────┘    └───────────┘  │
│          │                  │                  │       │
│          ▼                  ▼                  ▼       │
│   ┌─────────────┐    ┌─────────────┐    ┌───────────┐  │
│   │   Secret    │    │  ConfigMap  │    │    PVC    │  │
│   │  (TLS/凭证)  │    │  (环境配置)  │    │  (存储卷)  │  │
│   └─────────────┘    └─────────────┘    └───────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 技术选型

| 组件     | 选择        | 说明                     |
|----------|-------------|--------------------------|
| 后端服务 | Node.js     | 轻量、开发效率高         |
| 数据库   | MySQL 8.0   | 阿里云 RDS 或自建        |
| 容器镜像 | Docker      | 标准化部署               |
| CI/CD    | GitLab CI   | 或 Jenkins，待确认       |
| 域名     | 阿里云 DNS  | 测试域名: calc.test.xxx  |

---

## 4. K8s 资源清单

### 4.1 命名空间

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: cloud-calculator
  labels:
    app: cloud-calculator
    env: dev
```

### 4.2 配置项 (ConfigMap)

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: calculator-config
  namespace: cloud-calculator
data:
  NODE_ENV: "development"
  DB_HOST: "mysql-service"
  DB_PORT: "3306"
  DB_NAME: "calculator"
  LOG_LEVEL: "debug"
```

### 4.3 密钥 (Secret)

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: calculator-secret
  namespace: cloud-calculator
type: Opaque
stringData:
  DB_USER: "calculator_user"
  DB_PASSWORD: "<待设置>"
  JWT_SECRET: "<待生成>"
```

### 4.4 后端部署 (Deployment)

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: calculator-backend
  namespace: cloud-calculator
spec:
  replicas: 2
  selector:
    matchLabels:
      app: calculator-backend
  template:
    metadata:
      labels:
        app: calculator-backend
    spec:
      containers:
      - name: backend
        image: registry.cn-hangzhou.aliyuncs.com/xxx/calculator:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: calculator-config
        - secretRef:
            name: calculator-secret
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 4.5 服务 (Service)

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: calculator-service
  namespace: cloud-calculator
spec:
  selector:
    app: calculator-backend
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

### 4.6 Ingress (域名配置)

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: calculator-ingress
  namespace: cloud-calculator
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - calc.test.xxx.com
    secretName: calculator-tls
  rules:
  - host: calc.test.xxx.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: calculator-service
            port:
              number: 80
```

### 4.7 MySQL (开发环境可用 StatefulSet 或 RDS)

```yaml
# mysql-statefulset.yaml (可选，开发环境自建)
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
  namespace: cloud-calculator
spec:
  serviceName: mysql-service
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        ports:
        - containerPort: 3306
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: calculator-secret
              key: DB_PASSWORD
        - name: MYSQL_DATABASE
          value: calculator
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:
  - metadata:
      name: mysql-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

---

## 5. CI/CD 流水线

### 5.1 GitLab CI 配置

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy

variables:
  IMAGE_NAME: registry.cn-hangzhou.aliyuncs.com/xxx/calculator
  KUBE_NAMESPACE: cloud-calculator

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $IMAGE_NAME:$CI_COMMIT_SHA .
    - docker push $IMAGE_NAME:$CI_COMMIT_SHA
  only:
    - dev

test:
  stage: test
  image: node:18
  script:
    - npm install
    - npm test
  only:
    - dev

deploy-dev:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/calculator-backend backend=$IMAGE_NAME:$CI_COMMIT_SHA -n $KUBE_NAMESPACE
    - kubectl rollout status deployment/calculator-backend -n $KUBE_NAMESPACE
  only:
    - dev
  when: manual
```

---

## 6. 资源需求清单

| 资源类型     | 配置                    | 数量 | 说明           |
|--------------|-------------------------|------|----------------|
| K8s 节点     | 2vCPU / 4GB 内存        | 2+   | Worker 节点    |
| MySQL 存储   | 10GB SSD                | 1    | 持久化存储     |
| 镜像仓库     | 阿里云容器镜像服务      | 1    | ACR            |
| SLB          | 按量付费                | 1    | Ingress 入口   |
| 域名         | 测试域名                | 1    | 待确认         |

---

## 7. 待办事项

- [ ] 获取 K8s 集群 kubeconfig
- [ ] 确认容器镜像仓库地址
- [ ] 确认测试域名
- [ ] 确认 CI/CD 平台 (GitLab CI / Jenkins)
- [ ] 创建命名空间和基础资源
- [ ] 配置 Ingress 和域名解析
- [ ] 配置 CI/CD 流水线

---

## 8. 联系方式

- 运维: 赵磊
- 产品: Neo-PM
- 开发: 待分配

---

*文档版本: v1.0 | 最后更新: 2026-03-04*
