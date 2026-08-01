module.exports = {
  apps: [
    {
      name: 'space-defender-1984',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/app',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};