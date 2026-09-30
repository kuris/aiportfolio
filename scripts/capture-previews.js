/**
 * 포트폴리오 미리보기 캡처 스크립트
 *
 *   node scripts/capture-previews.js            # 데스크톱(1440px) 캡처 → images/*.webp
 *   node scripts/capture-previews.js --mobile   # 모바일 반응형 확인용 캡처 → scripts/.tmp/
 *
 * - 브라우저 크롬(주소창·탭·북마크바)은 포함되지 않습니다. Playwright 는 페이지 본문만 렌더합니다.
 * - 로그인하지 않은 익명 세션으로 접속하므로 계정명 등 개인정보는 나타나지 않습니다.
 * - HIDE_SELECTORS 에 해당하는 오버레이(쿠키 배너, 떠 있는 위젯 등)는 캡처 전에 숨깁니다.
 */

const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'images');
const TMP_DIR = path.join(__dirname, '.tmp');

const MOBILE = process.argv.includes('--mobile');

/** 데스크톱 캡처 규격: 1440px 폭, 16:9 비율 */
const DESKTOP = { width: 1440, height: 810 };
/** 모바일 반응형 확인 규격 */
const MOBILE_VP = { width: 390, height: 844 };

/** 출력 이미지 스펙 */
const OUTPUT_WIDTH = 1440;      // 2x 캡처를 1440px 로 다운샘플 → 선명하게
const MAX_BYTES = 300 * 1024;   // 각 300KB 이하
const QUALITY_STEPS = [80, 72, 65, 58, 50];

/** 모든 사이트에 공통 적용되는 숨김 대상(오버레이류). 로그인 버튼은 서비스 기능이므로 유지합니다. */
const HIDE_SELECTORS = [
  '[class*="cookie"]', '[id*="cookie"]',
  '[class*="consent"]', '[id*="consent"]',
  '[class*="toast"]', '[class*="snackbar"]',
  '[class*="floating"]', '[class*="fab"]',
  '[class*="modal"][class*="open"]', '.backdrop', '.overlay',
];

const TARGETS = [
  {
    name: '역사 학습',
    url: 'https://history.chatgpts.kr/voyage.html',
    file: 'history-preview.webp',
    // 대항해 탐험 콘텐츠 화면
  },
  {
    name: '영어 문법',
    url: 'https://gram.chatgpts.kr/concepts.html',
    file: 'gram-preview.webp',
    // 영어 문법 개념 학습 화면
  },
  {
    name: '한자 학습',
    // 메인 화면의 한자 모핑 애니메이션은 계속 반복되어 캡처 시점마다 흐릿하게 잡히므로,
    // 정지 상태로도 선명한 '한자 배우기 & 따라쓰기' 학습 화면을 대표 화면으로 사용합니다.
    url: 'https://hanja.chatgpts.kr/learn.html',
    file: 'hanja-preview.webp',
  },
];

/** 캡처 안정화: 애니메이션·전환 정지, 스크롤바 숨김 */
const STABILIZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  html { scrollbar-width: none !important; }
  ::-webkit-scrollbar { display: none !important; }
`;

async function preparePage(page, target) {
  await page.addStyleTag({ content: STABILIZE_CSS });

  // 오버레이성 요소 숨기기 (개별 사이트 지정분 포함)
  const selectors = HIDE_SELECTORS.concat(target.hide || []);
  await page.evaluate((sels) => {
    for (const sel of sels) {
      let nodes = [];
      try { nodes = document.querySelectorAll(sel); } catch { continue; }
      nodes.forEach((el) => {
        const pos = getComputedStyle(el).position;
        // 화면에 떠 있는 요소만 숨김 — 본문 콘텐츠는 건드리지 않습니다.
        if (pos === 'fixed' || pos === 'sticky') el.style.setProperty('display', 'none', 'important');
      });
    }
  }, selectors);

  // 지연 로딩 이미지 트리거 후 최상단 복귀
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < Math.min(document.body.scrollHeight, step * 4); y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 160));
    }
    window.scrollTo(0, 0);
  });

  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(1200);
}

async function toWebp(pngBuffer, outPath) {
  let chosen = null;
  for (const quality of QUALITY_STEPS) {
    const buf = await sharp(pngBuffer)
      .resize({ width: OUTPUT_WIDTH, withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toBuffer();
    chosen = { buf, quality };
    if (buf.length <= MAX_BYTES) break;
  }
  fs.writeFileSync(outPath, chosen.buf);
  return { bytes: chosen.buf.length, quality: chosen.quality };
}

async function main() {
  const viewport = MOBILE ? MOBILE_VP : DESKTOP;
  const outDir = MOBILE ? TMP_DIR : OUT_DIR;
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,          // 2x 캡처 후 다운샘플 → 선명한 결과
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    reducedMotion: 'reduce',
    isMobile: MOBILE,
    hasTouch: MOBILE,
  });

  const results = [];
  let failed = 0;

  for (const target of TARGETS) {
    const label = `${target.name} (${target.url})`;
    const page = await context.newPage();
    try {
      // networkidle 은 일부 사이트에서 타임아웃하므로 domcontentloaded 후 정착을 기다립니다.
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await preparePage(page, target);

      const png = await page.screenshot({ type: 'png' }); // 뷰포트 영역만 = 사이트 본문
      const outName = MOBILE ? target.file.replace('.webp', '-mobile.webp') : target.file;
      const outPath = path.join(outDir, outName);
      const { bytes, quality } = await toWebp(png, outPath);

      const kb = (bytes / 1024).toFixed(1);
      const ok = bytes <= MAX_BYTES ? '✓' : '⚠ 300KB 초과';
      console.log(`${ok} ${outName.padEnd(28)} ${String(kb).padStart(7)} KB  (q${quality})  ← ${label}`);
      results.push({ name: target.name, file: outName, bytes });
    } catch (err) {
      failed += 1;
      console.error(`✗ 실패: ${label}\n    ${err.message.split('\n')[0]}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log(`\n${MOBILE ? '모바일 확인용' : '데스크톱'} 캡처 완료: 성공 ${results.length} / 실패 ${failed}`);
  console.log(`저장 위치: ${path.relative(ROOT, outDir) || '.'}`);
  if (failed > 0) {
    console.log('\n캡처에 실패한 이미지는 페이지에서 fallback(플레이스홀더)으로 표시되며 레이아웃은 깨지지 않습니다.');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('캡처 스크립트 오류:', err);
  process.exit(1);
});
