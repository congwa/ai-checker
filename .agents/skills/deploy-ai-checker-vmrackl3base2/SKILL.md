---
name: deploy-ai-checker-vmrackl3base2
description: Deploy and maintain the AI Checker project on vmrackl3base2. Use when deploying /Users/wang/code/xiaoji/ai-checker to admin-check.codexbuy.com or check.codexbuy.com, updating FastAPI/systemd/nginx/Redis 6381 production services, verifying the deployed admin/public dashboards, rolling back an AI Checker release, or updating /Users/wang/code/xiaoji/vps/ops/vmrackl3base2 documentation for this service.
---

# Deploy AI Checker Vmrackl3base2

## Purpose

Deploy the AI Checker project from `/Users/wang/code/xiaoji/ai-checker` to `vmrackl3base2` (`root@50.118.184.167`) using local frontend builds, remote FastAPI systemd services, nginx, and a dedicated Redis instance. Treat the VPS as a runtime host: never run Vite, npm builds, or frontend dependency installs on the server.

## Fixed Context

- Admin URL: `https://admin-check.codexbuy.com`
- Public URL: `https://check.codexbuy.com`
- Remote user/host: `root@50.118.184.167`
- Runtime user: `ai-checker`
- Release root: `/opt/ai-checker/releases/<timestamp>`
- Active symlink: `/opt/ai-checker/current`
- Static roots: `/var/www/ai-checker/admin`, `/var/www/ai-checker/public`
- Env files: `/etc/ai-checker/admin.env`, `/etc/ai-checker/public.env`
- Admin API: `127.0.0.1:19380`, service `ai-checker-admin-api`
- Public API: `127.0.0.1:19381`, service `ai-checker-public-api`
- Scheduler: service `ai-checker-scheduler`
- Dedicated Redis: `127.0.0.1:6381`, service `redis-ai-checker`
- nginx config: `/etc/nginx/conf.d/ai-checker.codexbuy.com.conf`
- Certificate: `/etc/letsencrypt/live/ai-checker.codexbuy.com/fullchain.pem`
- Admin login token: stored outside the repository; pass it as `ADMIN_TOKEN` when running verification commands.

## Safety Rules

- Preserve `/etc/ai-checker/*.env`; do not overwrite `SECRET_KEY` or disclose it in final messages.
- Do not delete production Redis data unless the user explicitly asks to reset AI Checker.
- Keep all runtime ports bound to `127.0.0.1`; public traffic must enter through nginx on `443`.
- Keep Cloudflare source limiting: both AI Checker nginx servers should include `/etc/nginx/cloudflare-allow.conf`.
- Build frontends locally with production API bases, then sync `dist/`.
- Respect dirty worktrees. In `/Users/wang/code/xiaoji/vps`, update only `ops/vmrackl3base2/*` for AI Checker deployment notes and do not touch unrelated `ops/aiyunus/*` changes.
- If remote `/tmp` is full, use `TMPDIR=/var/tmp` and `PIP_CACHE_DIR=/var/tmp/pip-cache-ai-checker`; do not clean `/tmp` without inspecting ownership and risk.
- This AI Checker deployment does not involve VLESS REALITY, Xray, or 3x-ui. REALITY verification is unnecessary unless the task also changes proxy entrypoints or REALITY policy.

## Decision Flow

1. For normal code updates on an already bootstrapped server, run the bundled redeploy script.
2. For first-time bootstrap or broken infrastructure, inspect remote state first, then create or repair Redis, env files, systemd units, certs, and nginx manually.
3. For frontend UI changes, verify visually after deployment with browser or Playwright screenshots in addition to curl checks.
4. For algorithm/backend changes, run the backend tests before deployment and inspect scheduler/admin logs after restart.

## Normal Redeploy

Use the script for repeat deployments where the server already has env files, Redis, nginx, certs, and systemd units:

```bash
/Users/wang/code/xiaoji/ai-checker/.agents/skills/deploy-ai-checker-vmrackl3base2/scripts/deploy-ai-checker-vmrackl3base2.sh
```

Useful overrides:

```bash
LOCAL_REPO=/Users/wang/code/xiaoji/ai-checker \
REMOTE=root@50.118.184.167 \
/Users/wang/code/xiaoji/ai-checker/.agents/skills/deploy-ai-checker-vmrackl3base2/scripts/deploy-ai-checker-vmrackl3base2.sh
```

Dry run:

```bash
/Users/wang/code/xiaoji/ai-checker/.agents/skills/deploy-ai-checker-vmrackl3base2/scripts/deploy-ai-checker-vmrackl3base2.sh --dry-run
```

The script runs local backend lint/tests, frontend tests/builds, syncs a timestamped backend release, syncs static frontend assets, installs Python dependencies into release venvs, switches `/opt/ai-checker/current`, restarts only AI Checker services, reloads nginx after `nginx -t`, and verifies health endpoints.

## Bootstrap Checklist

Use this when the server is missing infrastructure or the deployment needs to be rebuilt from scratch:

1. Confirm DNS points to `50.118.184.167` for `admin-check.codexbuy.com` and `check.codexbuy.com`.
2. Create system user `ai-checker` and directories under `/opt/ai-checker`, `/var/www/ai-checker`, `/etc/ai-checker`, and `/var/lib/ai-checker-redis`.
3. Create `/etc/redis/ai-checker.conf` with `bind 127.0.0.1`, `port 6381`, `protected-mode yes`, `supervised systemd`, and `dir /var/lib/ai-checker-redis`.
4. Create `redis-ai-checker.service` and verify `redis-cli -p 6381 PING`.
5. Create `/etc/ai-checker/admin.env` with `ADMIN_TOKEN=<admin-token>`, a generated strong `SECRET_KEY`, `REDIS_URL=redis://127.0.0.1:6381/0`, and `CORS_ORIGINS=https://admin-check.codexbuy.com`.
6. Create `/etc/ai-checker/public.env` with `REDIS_URL=redis://127.0.0.1:6381/0` and `PUBLIC_CORS_ORIGINS=https://check.codexbuy.com`.
7. Keep env permissions at `0640 root:ai-checker`.
8. Deploy backend/frontend artifacts, create venvs, and install Python dependencies with `TMPDIR=/var/tmp`.
9. Create systemd units for admin API, public API, and scheduler using `/opt/ai-checker/current`.
10. Issue or renew certbot cert `ai-checker.codexbuy.com` for both domains.
11. Create nginx servers for both domains, each with SPA static root and `/api/` proxy to the matching loopback API.

## Verification

Run local-on-server checks:

```bash
ssh root@50.118.184.167 'redis-cli -p 6381 PING'
ssh root@50.118.184.167 'curl -fsS http://127.0.0.1:19380/health && echo'
ssh root@50.118.184.167 'curl -fsS http://127.0.0.1:19381/health && echo'
ssh root@50.118.184.167 'systemctl is-active redis-ai-checker ai-checker-admin-api ai-checker-public-api ai-checker-scheduler'
```

Run public checks:

```bash
curl -fsS https://admin-check.codexbuy.com/ >/dev/null
curl -fsS https://admin-check.codexbuy.com/api/tasks -H "Authorization: Bearer $ADMIN_TOKEN"
curl -fsS https://admin-check.codexbuy.com/api/references -H "Authorization: Bearer $ADMIN_TOKEN"
curl -fsS https://check.codexbuy.com/ >/dev/null
curl -fsS https://check.codexbuy.com/api/overview
```

Confirm boundary:

```bash
ssh root@50.118.184.167 'ss -ltnp | grep -E ":(6381|19380|19381)\\b"'
curl -kI --max-time 8 https://50.118.184.167/ || true
curl --max-time 8 http://50.118.184.167:19380/health || true
curl --max-time 8 http://50.118.184.167:19381/health || true
```

Expected: backend and Redis ports are loopback only; direct IP HTTPS should not serve an AI Checker site; public domains should work through Cloudflare/nginx.

## Logs And Rollback

Useful logs:

```bash
ssh root@50.118.184.167 'journalctl -u ai-checker-admin-api -n 100 --no-pager'
ssh root@50.118.184.167 'journalctl -u ai-checker-public-api -n 100 --no-pager'
ssh root@50.118.184.167 'journalctl -u ai-checker-scheduler -n 100 --no-pager'
ssh root@50.118.184.167 'journalctl -u redis-ai-checker -n 80 --no-pager'
```

Rollback by repointing `/opt/ai-checker/current` to a previous release and restarting:

```bash
ssh root@50.118.184.167 'ls -1dt /opt/ai-checker/releases/* | head'
ssh root@50.118.184.167 'ln -sfn /opt/ai-checker/releases/<previous> /opt/ai-checker/current && systemctl restart ai-checker-admin-api ai-checker-public-api ai-checker-scheduler'
```

Then rerun the verification checks.

## Documentation

When deployment facts change, update:

- `/Users/wang/code/xiaoji/vps/ops/vmrackl3base2/README.md`
- `/Users/wang/code/xiaoji/vps/ops/vmrackl3base2/deployment.md`

Record service names, ports, paths, cert name, Redis instance, validation time, and source-boundary status. Keep secrets out of docs.
