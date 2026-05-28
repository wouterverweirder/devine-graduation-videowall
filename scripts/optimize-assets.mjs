#!/usr/bin/env node
import { readdir, stat, rename, unlink, access } from 'node:fs/promises';
import { join, extname, basename, dirname, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif']);
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.wmv', '.flv']);

const MAX_DIMENSION = 1920;
const VIDEO_CRF = 22;
const VIDEO_FPS = 30;

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => {
    rl.question(question, (answer) => {
      rl.close();
      res(answer);
    });
  });
}

function runCommand(cmd, args) {
  return new Promise((res, rej) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', rej);
    proc.on('close', (code) => {
      if (code === 0) res({ stdout, stderr });
      else rej(new Error(`${cmd} exited with ${code}\n${stderr.trim()}`));
    });
  });
}

async function getDimensions(filePath) {
  const { stdout } = await runCommand('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-of', 'csv=p=0',
    filePath,
  ]);
  const [w, h] = stdout.trim().split(/[,\n]/).map((n) => Number(n));
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    throw new Error(`could not read dimensions from ${filePath}`);
  }
  return { width: w, height: h };
}

function sanitizeBase(name) {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}

async function pathExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function resolveTargetPath(sourcePath, targetDir, targetBase, targetExt) {
  let candidate = join(targetDir, `${targetBase}${targetExt}`);
  if (resolve(candidate) === resolve(sourcePath)) return candidate;
  let i = 1;
  while (await pathExists(candidate)) {
    candidate = join(targetDir, `${targetBase}-${i}${targetExt}`);
    if (resolve(candidate) === resolve(sourcePath)) return candidate;
    i++;
  }
  return candidate;
}

async function finalizeOutput(sourcePath, tempPath, targetPath) {
  if (resolve(sourcePath) !== resolve(targetPath)) {
    await unlink(sourcePath);
  }
  await rename(tempPath, targetPath);
}

async function processImage(sourcePath) {
  const { width, height } = await getDimensions(sourcePath);
  const dir = dirname(sourcePath);
  const base = sanitizeBase(basename(sourcePath, extname(sourcePath)));
  const ext = extname(sourcePath).toLowerCase();
  const targetPath = await resolveTargetPath(sourcePath, dir, base, ext);
  const tempPath = join(dir, `.${base}.tmp-${process.pid}${ext}`);

  const scaleFilter = width >= height
    ? `scale=${MAX_DIMENSION}:-1`
    : `scale=-1:${MAX_DIMENSION}`;

  const args = ['-y', '-i', sourcePath, '-vf', scaleFilter];
  if (ext === '.jpg' || ext === '.jpeg') {
    args.push('-q:v', '2');
  }
  args.push(tempPath);

  try {
    await runCommand('ffmpeg', args);
    await finalizeOutput(sourcePath, tempPath, targetPath);
  } catch (e) {
    if (await pathExists(tempPath)) await unlink(tempPath).catch(() => {});
    throw e;
  }
  return targetPath;
}

async function processVideo(sourcePath) {
  const { width, height } = await getDimensions(sourcePath);
  const dir = dirname(sourcePath);
  const base = sanitizeBase(basename(sourcePath, extname(sourcePath)));
  const ext = '.mp4';
  const targetPath = await resolveTargetPath(sourcePath, dir, base, ext);
  const tempPath = join(dir, `.${base}.tmp-${process.pid}${ext}`);

  const scaleFilter = width >= height
    ? `scale=${MAX_DIMENSION}:-2`
    : `scale=-2:${MAX_DIMENSION}`;

  const args = [
    '-y',
    '-i', sourcePath,
    '-vf', scaleFilter,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', String(VIDEO_CRF),
    '-r', String(VIDEO_FPS),
    '-fps_mode', 'cfr',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    tempPath,
  ];

  try {
    await runCommand('ffmpeg', args);
    await finalizeOutput(sourcePath, tempPath, targetPath);
  } catch (e) {
    if (await pathExists(tempPath)) await unlink(tempPath).catch(() => {});
    throw e;
  }
  return targetPath;
}

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

async function main() {
  const input = (await prompt('Enter folder path: ')).trim();
  if (!input) {
    console.error('No folder path provided.');
    process.exit(1);
  }

  const rootDir = resolve(input.replace(/^['"]|['"]$/g, ''));
  const rootStat = await stat(rootDir).catch(() => null);
  if (!rootStat || !rootStat.isDirectory()) {
    console.error(`Not a valid directory: ${rootDir}`);
    process.exit(1);
  }

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for await (const file of walk(rootDir)) {
    const ext = extname(file).toLowerCase();
    const rel = relative(rootDir, file);

    try {
      if (IMAGE_EXTS.has(ext)) {
        const out = await processImage(file);
        console.log(`[image] ${rel} -> ${relative(rootDir, out)}`);
        processed++;
      } else if (VIDEO_EXTS.has(ext)) {
        const out = await processVideo(file);
        console.log(`[video] ${rel} -> ${relative(rootDir, out)}`);
        processed++;
      } else {
        console.log(`[skip]  ${rel}`);
        skipped++;
      }
    } catch (e) {
      console.error(`[fail]  ${rel}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone. processed=${processed} skipped=${skipped} failed=${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
