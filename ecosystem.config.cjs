module.exports = {
  apps: [
    {
      name: "telegram-gpt-assistant-bot",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
