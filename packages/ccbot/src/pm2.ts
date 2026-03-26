import { execSync } from 'child_process';
import pc from 'picocolors';

export function ensurePm2() {
  try {
    execSync('pm2 --version', { stdio: 'pipe' });
  } catch {
    console.log(pc.yellow('pm2 not found, installing globally...'));
    try {
      execSync('npm i -g pm2', { stdio: 'inherit' });
    } catch {
      console.error(pc.red('Failed to install pm2. Please install manually: npm i -g pm2'));
      process.exit(1);
    }
  }
}
