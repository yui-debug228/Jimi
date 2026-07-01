module.exports = {
  apps: [
    {
      name: "mimi-cat-showcase",
      script: "./dist/boot.js",
      cwd: "/var/www/mimi",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      log_file: "/var/log/mimi/combined.log",
      out_file: "/var/log/mimi/out.log",
      error_file: "/var/log/mimi/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      max_memory_restart: "512M",
      restart_delay: 3000,
      min_uptime: "10s",
      max_restarts: 5,
      watch: false,
      autorestart: true,
      kill_timeout: 5000,
    },
  ],
};
