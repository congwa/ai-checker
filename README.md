# AI Checker

> 业务说明：本仓库用于建设一个 AI 模型行为相似度监控系统，包含后台管理和前台公开展示两条独立应用链路。

AI Checker 将单文件原型中的“随机数分布识别”产品化为定时采样服务：后台配置模型 API、采样频率、基准和评分平滑度，前台展示脱敏后的评分曲线和分布对比。第一版使用 Redis 作为唯一数据库，并预留后续接入 ZeroPrint 风格探针和嵌入指纹算法的位置。

## 目录

- `admin/backend`：后台管理 FastAPI 服务和定时任务 Runner。
- `admin/frontend`：后台管理 Vite React 工作台。
- `public/backend`：前台只读 FastAPI 服务。
- `public/frontend`：前台公开 Vite React 看板。

## 快速启动

```bash
# 1. 启动 Redis
docker compose up -d redis

# 2. 后台后端
cd admin/backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8010

# 3. 后台调度器
ADMIN_TOKEN=zhangzongkang SECRET_KEY=local-secret REDIS_URL=redis://localhost:6379/0 python -m app.scheduler

# 4. 前台后端
cd ../../public/backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8020

# 5. 两套前端
cd ../../admin/frontend && npm install && npm run dev -- --host 127.0.0.1 --port 5173
cd ../../public/frontend && npm install && npm run dev -- --host 127.0.0.1 --port 5174
```

默认管理端 Token 是 `zhangzongkang`。生产环境必须设置更强的 `ADMIN_TOKEN` 和 `SECRET_KEY`。
