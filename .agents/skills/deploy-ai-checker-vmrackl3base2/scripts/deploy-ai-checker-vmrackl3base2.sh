#!/usr/bin/env bash
# 业务说明：这个脚本负责 AI Checker 已完成基础设施初始化后的重复发布，把本地验证、前端生产构建、后端 release 同步、服务重启和线上验证串成稳定流程。
# 使用场景：当 /Users/wang/code/xiaoji/ai-checker 已经通过开发验证，需要更新 vmrackl3base2 上的 admin-check.codexbuy.com 与 check.codexbuy.com 生产环境时运行。
# 业务约束：脚本不会创建或覆盖生产密钥、证书和 Redis 数据；首次部署或基础设施缺失时应回到 SKILL.md 的 bootstrap 流程人工确认。

set -euo pipefail

LOCAL_REPO="${LOCAL_REPO:-/Users/wang/code/xiaoji/ai-checker}"
REMOTE="${REMOTE:-root@50.118.184.167}"
ADMIN_API_BASE="${ADMIN_API_BASE:-https://admin-check.codexbuy.com}"
PUBLIC_API_BASE="${PUBLIC_API_BASE:-https://check.codexbuy.com}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
RELEASE_ID="${RELEASE_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
DRY_RUN=0
SKIP_TESTS=0
SKIP_BUILD=0

# 业务说明：向部署执行者展示脚本的业务入口和可调参数，避免临时改脚本造成生产发布不可复现。
usage() {
  cat <<'EOF'
Deploy AI Checker to vmrackl3base2 after the server has already been bootstrapped.

Usage:
  deploy-ai-checker-vmrackl3base2.sh [options]

Options:
  --dry-run       Print commands without changing local or remote state.
  --skip-tests    Skip local lint/test commands; keep builds and production verification.
  --skip-build    Skip frontend production builds; requires existing dist/ directories.
  --release-id X  Use a specific release id instead of UTC timestamp.
  --local-repo X  Override local AI Checker repo path.
  --remote X      Override SSH target.
  -h, --help      Show this help.

Environment overrides:
  LOCAL_REPO, REMOTE, ADMIN_API_BASE, PUBLIC_API_BASE, ADMIN_TOKEN, RELEASE_ID

ADMIN_TOKEN is required for production admin API verification and must be supplied
from a local shell environment or secret manager. Do not commit real token values.
EOF
}

# 业务说明：统一输出当前发布阶段，方便在部署日志里定位失败发生在验证、同步、安装还是验收。
log() {
  printf '\n==> %s\n' "$*"
}

# 业务说明：执行单条命令并支持 dry-run，确保生产发布动作可以先被完整预览。
run() {
  log "$1"
  shift
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '+'
    printf ' %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

# 业务说明：在指定项目子目录执行命令，保证后台、前台、公开端的验证命令不会串目录。
run_in_dir() {
  local dir="$1"
  shift
  log "$dir: $*"
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '+ cd %q &&' "$dir"
    printf ' %q' "$@"
    printf '\n'
  else
    (cd "$dir" && "$@")
  fi
}

# 业务说明：解析执行者传入的发布选项，让同一个脚本覆盖正常发布、跳过测试的紧急发布和 dry-run 预览。
parse_args() {
  while [[ "$#" -gt 0 ]]; do
    case "$1" in
      --dry-run)
        DRY_RUN=1
        shift
        ;;
      --skip-tests)
        SKIP_TESTS=1
        shift
        ;;
      --skip-build)
        SKIP_BUILD=1
        shift
        ;;
      --release-id)
        RELEASE_ID="${2:?--release-id requires a value}"
        shift 2
        ;;
      --local-repo)
        LOCAL_REPO="${2:?--local-repo requires a value}"
        shift 2
        ;;
      --remote)
        REMOTE="${2:?--remote requires a value}"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        printf 'Unknown option: %s\n\n' "$1" >&2
        usage >&2
        exit 2
        ;;
    esac
  done
}

# 业务说明：检查本地和远端发布前提，避免在缺少 SSH、rsync、npm、uv 或生产基础设施时进入半完成状态。
preflight() {
  run "Check local repository exists" test -d "$LOCAL_REPO"
  run "Check admin backend exists" test -d "$LOCAL_REPO/admin/backend"
  run "Check public backend exists" test -d "$LOCAL_REPO/public/backend"
  run "Check admin frontend exists" test -d "$LOCAL_REPO/admin/frontend"
  run "Check public frontend exists" test -d "$LOCAL_REPO/public/frontend"

  command -v ssh >/dev/null || { echo "ssh is required" >&2; exit 1; }
  command -v rsync >/dev/null || { echo "rsync is required" >&2; exit 1; }
  command -v curl >/dev/null || { echo "curl is required" >&2; exit 1; }
  if [[ "$SKIP_TESTS" == "0" ]]; then
    command -v uv >/dev/null || { echo "uv is required for backend validation" >&2; exit 1; }
    command -v npm >/dev/null || { echo "npm is required for frontend validation" >&2; exit 1; }
  fi
  if [[ "$SKIP_BUILD" == "0" ]]; then
    command -v npm >/dev/null || { echo "npm is required for frontend builds" >&2; exit 1; }
  fi

  run "Check remote AI Checker infrastructure" ssh "$REMOTE" \
    "test -f /etc/ai-checker/admin.env && test -f /etc/ai-checker/public.env && test -d /opt/ai-checker/releases && test -d /var/www/ai-checker/admin && test -d /var/www/ai-checker/public && systemctl cat ai-checker-admin-api >/dev/null && systemctl cat ai-checker-public-api >/dev/null && systemctl cat ai-checker-scheduler >/dev/null && systemctl cat redis-ai-checker >/dev/null"
}

# 业务说明：执行本地质量门禁，保证上线前后台算法、API 权限、公开读模型和前端数据转换仍符合产品预期。
local_checks() {
  if [[ "$SKIP_TESTS" == "1" ]]; then
    log "Skip local lint/tests by request"
    return
  fi

  run_in_dir "$LOCAL_REPO/admin/backend" uv run --extra dev ruff check .
  run_in_dir "$LOCAL_REPO/admin/backend" uv run --extra dev pytest tests/ -v
  run_in_dir "$LOCAL_REPO/public/backend" uv run --extra dev ruff check .
  run_in_dir "$LOCAL_REPO/public/backend" uv run --extra dev pytest tests/ -v
  run_in_dir "$LOCAL_REPO/admin/frontend" npm test -- --run
  run_in_dir "$LOCAL_REPO/public/frontend" npm test -- --run
}

# 业务说明：生成面向生产域名的两套前端静态产物，确保浏览器请求通过公网域名而不是本地开发端口。
build_frontends() {
  if [[ "$SKIP_BUILD" == "1" ]]; then
    log "Skip frontend production builds by request"
  else
    run_in_dir "$LOCAL_REPO/admin/frontend" env VITE_ADMIN_API_BASE="$ADMIN_API_BASE" npm run build
    run_in_dir "$LOCAL_REPO/public/frontend" env VITE_PUBLIC_API_BASE="$PUBLIC_API_BASE" npm run build
  fi

  run "Check admin dist exists" test -d "$LOCAL_REPO/admin/frontend/dist"
  run "Check public dist exists" test -d "$LOCAL_REPO/public/frontend/dist"
}

# 业务说明：把本次发布同步为新的后端 release 和静态前端目录，避免覆盖旧 release，便于线上快速回滚。
sync_artifacts() {
  local remote_release="/opt/ai-checker/releases/${RELEASE_ID}"

  run "Create remote release directories" ssh "$REMOTE" \
    "mkdir -p '$remote_release/admin-backend' '$remote_release/public-backend' /var/www/ai-checker/admin /var/www/ai-checker/public"

  run "Sync admin backend release" rsync -az --delete \
    --exclude '.venv' --exclude '__pycache__' --exclude '*.pyc' --exclude '.pytest_cache' --exclude '.ruff_cache' \
    "$LOCAL_REPO/admin/backend/" "$REMOTE:$remote_release/admin-backend/"

  run "Sync public backend release" rsync -az --delete \
    --exclude '.venv' --exclude '__pycache__' --exclude '*.pyc' --exclude '.pytest_cache' --exclude '.ruff_cache' \
    "$LOCAL_REPO/public/backend/" "$REMOTE:$remote_release/public-backend/"

  run "Sync admin frontend dist" rsync -az --delete \
    "$LOCAL_REPO/admin/frontend/dist/" "$REMOTE:/var/www/ai-checker/admin/"

  run "Sync public frontend dist" rsync -az --delete \
    "$LOCAL_REPO/public/frontend/dist/" "$REMOTE:/var/www/ai-checker/public/"
}

# 业务说明：在远端 release 内安装 Python 运行依赖并切换 current，保证 systemd 重启后加载同一个原子发布版本。
install_and_restart_remote() {
  if [[ "$DRY_RUN" == "1" ]]; then
    log "Install release and restart services on remote"
    cat <<EOF
+ ssh $REMOTE bash -s -- $RELEASE_ID
  - create admin/public .venv under /opt/ai-checker/releases/$RELEASE_ID
  - pip install admin-backend and public-backend with TMPDIR=/var/tmp
  - chown release and static roots
  - ln -sfn release to /opt/ai-checker/current
  - restart ai-checker-admin-api ai-checker-public-api ai-checker-scheduler
  - nginx -t && systemctl reload nginx
EOF
    return
  fi

  ssh "$REMOTE" "bash -s -- '$RELEASE_ID'" <<'REMOTE_SCRIPT'
set -euo pipefail

release_id="$1"
release="/opt/ai-checker/releases/${release_id}"
admin_backend="${release}/admin-backend"
public_backend="${release}/public-backend"

test -d "$admin_backend"
test -d "$public_backend"
test -f /etc/ai-checker/admin.env
test -f /etc/ai-checker/public.env

python3 -m venv "$admin_backend/.venv"
TMPDIR=/var/tmp PIP_CACHE_DIR=/var/tmp/pip-cache-ai-checker "$admin_backend/.venv/bin/python" -m pip install --upgrade pip
TMPDIR=/var/tmp PIP_CACHE_DIR=/var/tmp/pip-cache-ai-checker "$admin_backend/.venv/bin/python" -m pip install "$admin_backend"

python3 -m venv "$public_backend/.venv"
TMPDIR=/var/tmp PIP_CACHE_DIR=/var/tmp/pip-cache-ai-checker "$public_backend/.venv/bin/python" -m pip install --upgrade pip
TMPDIR=/var/tmp PIP_CACHE_DIR=/var/tmp/pip-cache-ai-checker "$public_backend/.venv/bin/python" -m pip install "$public_backend"

chown -R ai-checker:ai-checker "$release"
chown -R ai-checker:ai-checker /var/www/ai-checker
ln -sfn "$release" /opt/ai-checker/current
chown -h ai-checker:ai-checker /opt/ai-checker/current

systemctl daemon-reload
systemctl restart ai-checker-admin-api ai-checker-public-api ai-checker-scheduler
nginx -t
systemctl reload nginx
REMOTE_SCRIPT
}

# 业务说明：验收本次发布的核心业务路径，确认管理端鉴权 API、参照配置 API、公开看板 API 和内部健康检查都可用。
verify_production() {
  if [[ -z "$ADMIN_TOKEN" ]]; then
    printf 'ADMIN_TOKEN is required for production admin API verification.\n' >&2
    exit 1
  fi

  run "Verify remote Redis and loopback APIs" ssh "$REMOTE" \
    "redis-cli -p 6381 PING && curl -fsS http://127.0.0.1:19380/health && echo && curl -fsS http://127.0.0.1:19381/health && echo && systemctl is-active redis-ai-checker ai-checker-admin-api ai-checker-public-api ai-checker-scheduler"

  run "Verify admin site" curl -fsS "$ADMIN_API_BASE/" -o /dev/null
  run "Verify admin tasks API" curl -fsS "$ADMIN_API_BASE/api/tasks" -H "Authorization: Bearer $ADMIN_TOKEN"
  run "Verify admin references API" curl -fsS "$ADMIN_API_BASE/api/references" -H "Authorization: Bearer $ADMIN_TOKEN"
  run "Verify public site" curl -fsS "$PUBLIC_API_BASE/" -o /dev/null
  run "Verify public overview API" curl -fsS "$PUBLIC_API_BASE/api/overview"
}

# 业务说明：编排完整发布流程，确保每次上线都有相同的验证、构建、同步、重启和验收顺序。
main() {
  parse_args "$@"
  log "AI Checker deploy release: $RELEASE_ID"
  preflight
  local_checks
  build_frontends
  sync_artifacts
  install_and_restart_remote
  verify_production
  log "AI Checker deployment finished: $RELEASE_ID"
}

main "$@"
