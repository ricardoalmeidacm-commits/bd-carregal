# Deploy — Node.js (Hetzner + PM2 + Nginx)

Build target: Nitro preset `node-server` (see `vite.config.ts`).

1. Server: Ubuntu, Node.js 20+, `npm i -g pm2`, Nginx, Certbot.
2. Copy the project, then create `.env` from `deploy/.env.example` (the `VITE_*` values are needed at build time).
3. Build:
   ```bash
   npm ci
   npm run build        # outputs .output/
   ```
4. Run with PM2:
   ```bash
   set -a; . ./.env; set +a
   pm2 start ecosystem.config.cjs --env production
   pm2 save && pm2 startup
   ```
5. Nginx: copy `deploy/nginx.conf` to `/etc/nginx/sites-available/`, set the domain, enable it, then
   `sudo certbot --nginx -d exemplo.pt` and `sudo nginx -t && sudo systemctl reload nginx`.
6. Update: `git pull && npm ci && npm run build && pm2 reload biblioteca-museu`.

Note: `SUPABASE_SERVICE_ROLE_KEY` and `LOVABLE_API_KEY` are only available in Lovable Cloud;
self-hosting requires your own backend credentials and an AI key for the audioguide.
