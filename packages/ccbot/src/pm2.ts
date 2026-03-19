import { execSync } from 'child_process';
import pm2Lib from 'pm2';
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

export function connectPm2(): Promise<void> {
  return new Promise((resolve, reject) => {
    pm2Lib.connect((err) => {
      if (err) {
        console.error(pc.red('Failed to connect to pm2 daemon.'));
        reject(err);
        process.exit(2);
      }
      resolve();
    });
  });
}

export function disconnectPm2() {
  pm2Lib.disconnect();
}

export function startOrReload(name: string, script: string, configPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    pm2Lib.list((err, list) => {
      if (err) return reject(err);

      const exists = list.some((p) => p.name === name);

      if (exists) {
        pm2Lib.reload(name, (err) => {
          if (err) return reject(err);
          resolve();
        });
      } else {
        pm2Lib.start(
          {
            name,
            script,
            args: configPath,
            interpreter: 'node',
            interpreter_args: '--experimental-specifier-resolution=node',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
          },
          (err) => {
            if (err) return reject(err);
            resolve();
          },
        );
      }
    });
  });
}

export function savePm2() {
  try {
    execSync('pm2 save', { stdio: 'pipe' });
  } catch {
    // non-critical
  }
}
