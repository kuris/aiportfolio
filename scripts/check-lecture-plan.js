/**
 * 강의계획서 페이지 검증 스크립트
 *
 *   node scripts/check-lecture-plan.js
 *
 * 확인 항목
 *  1) 페이지가 오류 없이 로드되는지 (콘솔 오류 / 리소스 로딩 실패)
 *  2) 인쇄 결과가 A4 "1장"에 들어가는지
 *  3) 모든 내용이 12mm 여백 안에 들어가는지 (잘림 없음)
 *  4) 화면(데스크톱/모바일)에서 가로 스크롤이 생기지 않는지
 *  5) 외부 링크에 target="_blank" rel="noopener noreferrer" 가 설정됐는지
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PAGE_URL = 'file://' + path.join(ROOT, 'lecture-plan', 'index.html');

const A4 = { widthPt: 595.28, heightPt: 841.89 };
const MARGIN_MM = 12;
const MARGIN_PT = (MARGIN_MM / 25.4) * 72;

function countPdfPages(buf) {
  const m = /\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/.exec(buf.toString('latin1'));
  return m ? Number(m[1]) : null;
}

async function main() {
  const failures = [];
  const browser = await chromium.launch();

  // --- 화면 검증 (데스크톱 / 모바일) ---
  for (const vp of [{ name: '데스크톱', width: 1280, height: 1000 }, { name: '모바일', width: 390, height: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('requestfailed', (r) => {
      // 웹폰트는 오프라인 환경에서 실패할 수 있으므로 치명적으로 보지 않습니다.
      if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) errors.push('리소스 실패: ' + r.url());
    });

    await page.goto(PAGE_URL, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);

    const r = await page.evaluate(() => ({
      title: document.title,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      badImages: [...document.images].filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute('src')),
      links: [...document.querySelectorAll('a[href^="http"]')].map((a) => ({
        href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'),
      })),
    }));

    console.log(`\n[화면 · ${vp.name} ${vp.width}px]`);
    console.log(`  문서 제목      : ${r.title}`);
    console.log(`  가로 스크롤    : ${r.overflow ? '⚠ 발생' : '없음'}`);
    console.log(`  이미지 로딩    : ${r.badImages.length === 0 ? '정상' : '⚠ 실패 ' + r.badImages.join(', ')}`);
    console.log(`  스크립트 오류  : ${errors.length === 0 ? '없음' : '⚠ ' + errors.length + '건'}`);

    const badLinks = r.links.filter((l) => l.target !== '_blank' || !/noopener/.test(l.rel || '') || !/noreferrer/.test(l.rel || ''));
    console.log(`  외부 링크 속성 : ${badLinks.length === 0 ? `정상 (${r.links.length}개)` : '⚠ 누락 ' + JSON.stringify(badLinks)}`);

    if (r.overflow) failures.push(`${vp.name}: 가로 스크롤 발생`);
    if (r.badImages.length) failures.push(`${vp.name}: 이미지 로딩 실패`);
    if (errors.length) failures.push(`${vp.name}: 오류 ${errors.length}건`);
    if (badLinks.length) failures.push(`${vp.name}: 외부 링크 속성 누락`);

    await ctx.close();
  }

  // --- 인쇄(PDF) 검증 ---
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(PAGE_URL, { waitUntil: 'load', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);

  const pdfPath = path.join(os.tmpdir(), 'lecture-plan-check.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: `${MARGIN_MM}mm`, right: `${MARGIN_MM}mm`, bottom: `${MARGIN_MM}mm`, left: `${MARGIN_MM}mm` },
  });

  const pdf = fs.readFileSync(pdfPath);
  const pages = countPdfPages(pdf);

  // 인쇄 레이아웃 높이 (A4 본문 폭 기준)
  const contentWidthPx = Math.round(((210 - MARGIN_MM * 2) / 25.4) * 96);
  const ctx2 = await browser.newContext({ viewport: { width: contentWidthPx, height: 1033 } });
  const p2 = await ctx2.newPage();
  await p2.goto(PAGE_URL, { waitUntil: 'load' });
  await p2.evaluate(() => document.fonts.ready);
  await p2.emulateMedia({ media: 'print' });
  await p2.waitForTimeout(500);
  const sheet = await p2.evaluate(() => {
    const el = document.querySelector('.sheet').getBoundingClientRect();
    return { heightMM: +(el.height * 25.4 / 96).toFixed(1) };
  });
  const availableMM = 297 - MARGIN_MM * 2;
  await ctx2.close();

  console.log(`\n[인쇄 · A4 ${MARGIN_MM}mm 여백]`);
  console.log(`  PDF 페이지 수  : ${pages === 1 ? '1장' : '⚠ ' + pages + '장'}`);
  console.log(`  내용 높이      : ${sheet.heightMM}mm / 가용 ${availableMM}mm (여유 ${(availableMM - sheet.heightMM).toFixed(1)}mm)`);
  console.log(`  PDF 파일       : ${pdfPath} (${Math.round(pdf.length / 1024)}KB)`);

  if (pages !== 1) failures.push(`인쇄: A4 ${pages}장 (1장이어야 함)`);
  if (sheet.heightMM > availableMM) failures.push(`인쇄: 내용이 ${(sheet.heightMM - availableMM).toFixed(1)}mm 초과`);

  await ctx.close();
  await browser.close();

  console.log('');
  if (failures.length) {
    console.error('✗ 검증 실패:\n  - ' + failures.join('\n  - '));
    process.exit(1);
  }
  console.log('✓ 강의계획서 검증 통과 — 화면 정상, 인쇄 A4 1장');
}

main().catch((err) => { console.error('검증 스크립트 오류:', err); process.exit(1); });
