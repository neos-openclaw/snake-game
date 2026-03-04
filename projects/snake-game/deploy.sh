#!/bin/bash

# 贪吃蛇游戏 - 一键部署脚本
# 使用: ./deploy.sh [命令]
# 命令: start | stop | restart | logs | status | build | clean

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 和 Docker Compose
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    log_info "Docker 环境检查通过"
}

# 检查 .env 文件
check_env() {
    if [ ! -f .env ]; then
        log_warn ".env 文件不存在，从 .env.example 创建..."
        cp .env.example .env
        log_warn "请编辑 .env 文件修改敏感配置（JWT_SECRET 等）"
    fi
}

# 启动服务
start() {
    log_info "启动贪吃蛇游戏服务..."
    check_docker
    check_env
    
    if docker compose version &> /dev/null; then
        docker compose up -d --build
    else
        docker-compose up -d --build
    fi
    
    log_info "服务启动完成！"
    log_info "前端: http://localhost:3000"
    log_info "后端: http://localhost:3001"
    log_info "API: http://localhost:80/api/"
    status
}

# 停止服务
stop() {
    log_info "停止贪吃蛇游戏服务..."
    if docker compose version &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi
    log_info "服务已停止"
}

# 重启服务
restart() {
    stop
    start
}

# 查看日志
logs() {
    if docker compose version &> /dev/null; then
        docker compose logs -f "$@"
    else
        docker-compose logs -f "$@"
    fi
}

# 查看状态
status() {
    log_info "服务状态:"
    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi
}

# 重新构建
build() {
    log_info "重新构建服务..."
    if docker compose version &> /dev/null; then
        docker compose build --no-cache
    else
        docker-compose build --no-cache
    fi
    log_info "构建完成"
}

# 清理
clean() {
    log_warn "清理所有容器、网络和数据卷..."
    read -p "确认清理？这将删除数据库数据！ (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        if docker compose version &> /dev/null; then
            docker compose down -v --rmi local
        else
            docker-compose down -v --rmi local
        fi
        log_info "清理完成"
    else
        log_info "取消清理"
    fi
}

# 备份数据库
backup() {
    log_info "备份数据库..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="backup_${TIMESTAMP}.sql"
    
    if docker compose version &> /dev/null; then
        docker compose exec -T db pg_dump -U snake snake_db > "$BACKUP_FILE"
    else
        docker-compose exec -T db pg_dump -U snake snake_db > "$BACKUP_FILE"
    fi
    
    log_info "备份完成: $BACKUP_FILE"
}

# 主命令
case "${1:-start}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "${@:2}"
        ;;
    status)
        status
        ;;
    build)
        build
        ;;
    clean)
        clean
        ;;
    backup)
        backup
        ;;
    *)
        echo "使用: $0 {start|stop|restart|logs|status|build|clean|backup}"
        echo ""
        echo "命令说明:"
        echo "  start   - 启动服务（首次运行会构建镜像）"
        echo "  stop    - 停止服务"
        echo "  restart - 重启服务"
        echo "  logs    - 查看日志（可选指定服务名）"
        echo "  status  - 查看服务状态"
        echo "  build   - 重新构建镜像"
        echo "  clean   - 清理所有容器、网络和数据卷"
        echo "  backup  - 备份数据库"
        exit 1
        ;;
esac
