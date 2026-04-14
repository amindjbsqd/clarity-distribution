module.exports = {
  apps: [
    {
      name: 'clarity-distribution',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/clarity-distribution',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
