const { watch } = require("fs");
const { cwd } = require("process");

module.exports = {
  apps: [
    {
      name: "app",
      script: "pnpm",
      args: "run dev",
      cwd: "./app",
      watch: true,
      watch_delay: 10000,
      ignore_watch: ["node_modules"],
      env_production: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      },
    },
    {
      name: "server",
      script: "pnpm",
      args: "start",
      cwd: "./server",
      watch: true,
      watch_delay: 10000,
      ignore_watch: ["node_modules"],
      env_production: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      },
    },
  ],
};
