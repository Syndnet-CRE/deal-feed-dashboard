/**
 * STORY-4.3 Static Analysis Tests — Pause/Resume and match preview
 * Run: node tests/story-4.3-pause-resume-preview.test.cjs
 *
 * Verifies:
 *  - ConfirmModal has pause-box config and onConfirm prop
 *  - App.jsx tracks pausingBuyBox and wires onPause/onConfirm
 *  - BuyBoxesView Pause button calls onPause; Resume button calls patchBuyBox
 *  - BuyBoxWizard preview: debounce ref, coverage state, api call
 */
const fs   = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  [PASS] ${name}`); passed++; }
  catch (err) { console.log(`  [FAIL] ${name}: ${err.message}`); failed++; }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

async function runTests() {
  console.log('\n=== STORY-4.3: Pause/Resume/Preview Tests ===\n');

  const root = path.join(__dirname, '..', 'src');
  const cm   = fs.readFileSync(path.join(root, 'components/ConfirmModal.jsx'),  'utf-8');
  const app  = fs.readFileSync(path.join(root, 'App.jsx'),                       'utf-8');
  const bbv  = fs.readFileSync(path.join(root, 'views/BuyBoxesView.jsx'),        'utf-8');
  const wiz  = fs.readFileSync(path.join(root, 'components/BuyBoxWizard.jsx'),   'utf-8');

  // --- ConfirmModal ---
  test('4.3-1: ConfirmModal has pause-box config', () => {
    assert(cm.includes('pause-box') || cm.includes('pauseBox'), 'ConfirmModal must have pause-box config entry');
  });

  test('4.3-2: ConfirmModal accepts onConfirm prop', () => {
    assert(cm.includes('onConfirm'), 'ConfirmModal must accept and use onConfirm prop');
  });

  test('4.3-3: ConfirmModal confirm button calls onConfirm', () => {
    assert(cm.includes('onConfirm?.()') || cm.includes('onConfirm()'), 'Confirm button must call onConfirm');
  });

  // --- App.jsx ---
  test('4.3-4: App.jsx tracks pausingBuyBox state', () => {
    assert(app.includes('pausingBuyBox'), 'pausingBuyBox state must exist in App.jsx');
  });

  test('4.3-5: App.jsx passes onPause to BuyBoxesView', () => {
    assert(app.includes('onPause'), 'App.jsx must pass onPause to BuyBoxesView');
  });

  test('4.3-6: App.jsx renders pause-box confirm flow', () => {
    assert(
      app.includes('"pause-box"') || app.includes("'pause-box'") || app.includes('PauseBoxConfirm'),
      'App.jsx must render pause-box confirm (ConfirmModal with kind="pause-box" or PauseBoxConfirm component)'
    );
  });

  test('4.3-7: App.jsx pause confirm calls patchBuyBox with paused status', () => {
    assert(
      app.includes("'paused'") || app.includes('"paused"'),
      'Pause confirm must call patchBuyBox with status paused'
    );
  });

  // --- BuyBoxesView ---
  test('4.3-8: BuyBoxesView accepts onPause prop', () => {
    assert(bbv.includes('onPause'), 'BuyBoxesView must accept onPause prop');
  });

  test('4.3-9: Pause button calls onPause', () => {
    assert(bbv.includes('onPause?.(') || bbv.includes('onPause('), 'Pause button must call onPause');
  });

  test('4.3-10: Resume button calls patchBuyBox directly', () => {
    assert(bbv.includes('patchBuyBox'), 'Resume button must call patchBuyBox from context');
  });

  // --- BuyBoxWizard preview ---
  test('4.3-11: BuyBoxWizard has preview debounce timer ref', () => {
    assert(
      wiz.includes('coverageTimer') || wiz.includes('previewTimer') ||
      wiz.includes('debounce') || wiz.includes('clearTimeout'),
      'Preview must use a debounce timer (useRef + clearTimeout)'
    );
  });

  test('4.3-12: BuyBoxWizard has coverage/preview state', () => {
    assert(
      wiz.includes('coverage') || wiz.includes('previewCount'),
      'Must track coverage or previewCount state'
    );
  });

  test('4.3-13: BuyBoxWizard calls preview API endpoint', () => {
    assert(
      wiz.includes('/preview') || wiz.includes('buy-boxes/preview'),
      'Must call the /preview endpoint'
    );
  });

  test('4.3-14: BuyBoxWizard renders coverage/preview in UI', () => {
    assert(
      wiz.includes('coverage') && wiz.includes('bbwiz-coverage'),
      'coverage state must be rendered in wizard UI'
    );
  });

  test('4.3-15: BuyBoxWizard has loading state for preview spinner', () => {
    assert(
      wiz.includes("'loading'") || wiz.includes('"loading"') || wiz.includes('previewLoading'),
      'Must have a loading indicator for the preview fetch'
    );
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => { console.error(err); process.exit(1); });
