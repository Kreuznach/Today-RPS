/**
 * scripts/build-ait.cjs
 * ============================================================
 * `npm run build:ait` 실행 시 Vite 빌드 결과물(dist/)을
 * ZIP으로 묶어 today-rps.ait 파일을 생성합니다.
 *
 * .ait 파일 = ZIP 아카이브 (Toss In-App Builder 업로드 형식)
 * ============================================================
 */

const archiver = require('archiver');
const fs       = require('fs');
const path     = require('path');

const DIST_DIR  = path.resolve(__dirname, '../dist');
const OUTPUT    = path.resolve(__dirname, '../today-rps.ait');

if (!fs.existsSync(DIST_DIR)) {
  console.error('❌  dist/ 폴더가 없습니다. 먼저 vite build를 실행하세요.');
  process.exit(1);
}

const output  = fs.createWriteStream(OUTPUT);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  const kb = (archive.pointer() / 1024).toFixed(1);
  console.log(`\n✅  today-rps.ait 생성 완료 (${kb} KB)`);
  console.log(`   → ${OUTPUT}\n`);
  console.log('📦  Toss In-App Builder에 이 파일을 업로드하세요.');
});

archive.on('warning', err => {
  if (err.code !== 'ENOENT') throw err;
  console.warn('⚠️ ', err.message);
});

archive.on('error', err => { throw err; });

archive.pipe(output);
// dist/ 내부 파일들을 ZIP 루트에 배치 (index.html 이 최상위에 위치해야 함)
archive.directory(DIST_DIR, false);
archive.finalize();
