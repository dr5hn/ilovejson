module.exports = {
  apps: [{
    name: "ilovejson",
    script: "npm",
    args: "start",
    watch: false,
    interpreter: '/usr/bin/bash',
    env: {
      "NODE_ENV": "production",
    },
  }]
}
