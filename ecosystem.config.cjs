// PM2 process file — `pm2 start ecosystem.config.cjs --env production`
module.exports = {
  apps: [
    {
      name: "biblioteca-museu",
      script: ".output/server/index.mjs",
      exec_mode: "cluster",
      instances: "max",
      max_memory_restart: "512M",
      env_production: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: 3000,
        // Required at runtime (set in the server environment or here):
        // SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY
      },
    },
  ],
};
