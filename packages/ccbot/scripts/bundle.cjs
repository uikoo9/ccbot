const { execSync } = require('child_process');
const { version } = require('../package.json');

const args = [
  'npx esbuild bin/ccbot.js',
  '--bundle',
  '--platform=node',
  '--target=node18',
  '--format=cjs',
  '--outfile=bundle/ccbot.cjs',
  '--external:pm2',
  '--external:inquirer',
  `--banner:js="var CCBOT_VERSION='${version}';"`,
].join(' ');

execSync(args, { stdio: 'inherit' });
