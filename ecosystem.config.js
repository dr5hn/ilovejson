module.exports = {
  apps: [{
    name: "ilovejson",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 3001",
    cwd: "/var/www/ilovejson.com",
    instances: "max",
    exec_mode: "cluster",
    watch: false,
    max_memory_restart: "500M",
    interpreter: "/root/.local/share/fnm/aliases/default/bin/node",
    env: {
      NODE_ENV: "production",
      PORT: 3001
    },

    // Restart behavior
    autorestart: true,
    max_restarts: 10,
    min_uptime: "10s",
    restart_delay: 4000,

    // Logs
    error_file: "/var/log/pm2/ilovejson-error.log",
    out_file: "/var/log/pm2/ilovejson-out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true,

    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    wait_ready: true
  }]
}
