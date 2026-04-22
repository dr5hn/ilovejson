const nextConfig = require("eslint-config-next");

module.exports = [
  ...nextConfig,
  {
    ignores: ["dist/**", ".scripts/**", ".vscode/**"],
  },
];
