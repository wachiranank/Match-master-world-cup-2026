module.exports = {
  apps: [
    {
      name: 'match-master',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/match-master',
      instances: 'max',          // one per CPU core
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/pm2/match-master-error.log',
      out_file:   '/var/log/pm2/match-master-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
