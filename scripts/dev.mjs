import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const processes = [
  { name: 'client', args: ['run', 'dev', '--workspace=client'] },
  { name: 'server', args: ['run', 'dev', '--workspace=server'] },
];

const children = processes.map(({ name, args }) => {
  const child = spawn(npmCommand, args, {
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[${name}] stopped by ${signal}`);
      return;
    }

    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(code);
    }
  });

  return child;
});

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) child.kill();
  }

  process.exitCode = code;
}

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
