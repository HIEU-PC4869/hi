import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';

const PYTHON_PORT = Number(process.env.PYTHON_API_PORT || '8001');
const HEALTH_URL = `http://127.0.0.1:${PYTHON_PORT}/api/health`;

function checkPythonHealthy(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function resolvePythonExecutable(): string {
  for (const candidate of ['python3', 'python']) {
    const res = spawnSync(candidate, ['--version'], { stdio: 'ignore' });
    if (!res.error && res.status === 0) {
      return candidate;
    }
  }
  return 'python3';
}

async function waitForPythonReady(timeoutMs = 5000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await checkPythonHealthy()) {
      return;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
}

async function start(): Promise<void> {
  let pyProc: ChildProcess | null = null;
  let viteProc: ChildProcess | null = null;
  let shuttingDown = false;

  const cleanup = (exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (viteProc && !viteProc.killed) {
      viteProc.kill('SIGTERM');
    }
    if (pyProc && !pyProc.killed) {
      pyProc.kill('SIGTERM');
    }
    process.exit(exitCode);
  };

  process.on('SIGINT', () => cleanup(0));
  process.on('SIGTERM', () => cleanup(0));

  const alreadyRunning = await checkPythonHealthy();
  if (!alreadyRunning) {
    const pyBin = resolvePythonExecutable();
    pyProc = spawn(pyBin, ['main.py', '--no-browser'], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHON_API_PORT: String(PYTHON_PORT) },
      stdio: 'inherit',
    });

    pyProc.on('error', (err) => {
      console.error(`[dev.ts] Failed to start Python OOP backend (${pyBin}):`, err.message);
    });

    pyProc.on('exit', (code) => {
      if (!shuttingDown && code !== 0) {
        console.error(`[dev.ts] Python OOP backend exited unexpectedly with code ${code}`);
      }
    });

    await waitForPythonReady(5000);
  } else {
    console.log(`[dev.ts] Python OOP backend already listening on port ${PYTHON_PORT}.`);
  }

  const viteBin = path.resolve(process.cwd(), 'node_modules/vite/bin/vite.js');
  viteProc = spawn(process.execPath, [viteBin, '--port=3000', '--host=0.0.0.0'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  viteProc.on('exit', (code) => {
    cleanup(code ?? 0);
  });
}

start().catch((err) => {
  console.error('[dev.ts] Fatal launcher error:', err);
  process.exit(1);
});
