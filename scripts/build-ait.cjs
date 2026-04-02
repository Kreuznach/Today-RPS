/**
 * scripts/build-ait.cjs
 * ============================================================
 * `npm run build:ait` 실행 시 Vite 빌드 결과물(dist/)을
 * AITBUNDL 바이너리 포맷으로 패키징하여 today-rps.ait 파일을 생성합니다.
 *
 * .ait 파일 = AITBUNDL 바이너리 (protobuf 헤더 + ZIP 블롭)
 * deploymentId, appName 은 바이너리 헤더에 포함됩니다.
 * ============================================================
 */

const { AppsInTossBundle } = require('@apps-in-toss/ait-format');
const fs   = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '../dist');
const OUTPUT   = path.resolve(__dirname, '../today-rps.ait');

if (!fs.existsSync(DIST_DIR)) {
  console.error('❌  dist/ 폴더가 없습니다. 먼저 vite build를 실행하세요.');
  process.exit(1);
}

// app.json 에서 deploymentId / appName 읽기
const appJsonPath  = path.join(DIST_DIR, 'app.json');
const appJson      = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
const deploymentId = appJson.deploymentId;
const appName      = appJson.id ?? appJson.name ?? 'today-rps';

if (!deploymentId) {
  console.error('❌  app.json 에 deploymentId 가 없습니다.');
  process.exit(1);
}

// dist/ 파일 목록 재귀 수집
function collectFiles(dir, base) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result  = [];
  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectFiles(absPath, relPath));
    } else {
      result.push({ relPath, absPath });
    }
  }
  return result;
}

(async () => {
  const writer = AppsInTossBundle.writer({ deploymentId, appName });

  for (const { relPath, absPath } of collectFiles(DIST_DIR)) {
    writer.addFile(relPath, fs.readFileSync(absPath));
  }

  const buffer = await writer.toBuffer();
  fs.writeFileSync(OUTPUT, buffer);

  const kb = (buffer.length / 1024).toFixed(1);
  console.log(`\n✅  today-rps.ait 생성 완료 (${kb} KB)`);
  console.log(`   → ${OUTPUT}\n`);
  console.log('📦  Toss In-App Builder에 이 파일을 업로드하세요.');
})();
