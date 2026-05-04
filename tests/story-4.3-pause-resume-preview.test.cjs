/**
 * STORY-4.3 Static Analysis Tests — Pause/Resume and match preview
 * Run: node tests/story-4.3-pause-resume-preview.test.cjs
 *
 * Verifies:
 *  - ConfirmModal has pause-box config and onConfirm prop
 *  - App.jsx tracks pausingBuyBox and wires onPause/onConfirm
 *  - BuyBoxesView Pause button calls onPause; Resume button calls patchBuyBox
 *  - ConfigurationOverlay preview: debounce ref, previewCount state, api call
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
  const cm   = fs.readFileSync(path.join(root, 'components/ConfirmModal.jsx'),          'utf-8');
  const app  = fs.readFileSync(path.join(root, 'App.jsx'),                               'utf-8');
  const bbv  = fs.readFileSync(path.join(root, 'views/BuyBoxesView.jsx'),                'utf-8');
  const ovl  = fs.readFileSync(path.join(root, 'components/ConfigurationOverlay.jsx'),   'utf-8');

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

  test('4.3-6: App.jsx renders ConfirmModal with pause-box kind', () => {
    assert(
      app.includes('"pause-box"') || app.includes("'pause-box'"),
      'App.jsx must render ConfirmModal with kind="pause-box"'
    );
  });

  test('4.3-7: App.jsx onConfirm for pause calls patchBuyBox with paused status', () => {
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

  // --- ConfigurationOverlay preview ---
  test('4.3-11: ConfigurationOverlay has preview debounce timer ref', () => {
    assert(
      ovl.includes('previewTimer') || ovl.includes('debounce') || ovl.includes('clearTimeout'),
      'Preview must use a debounce timer (useRef + clearTimeout)'
    );
  });

  test('4.3-12: ConfigurationOverlay has previewCount state', () => {
    assert(ovl.includes('previewCount'), 'Must track previewCount state');
  });

  test('4.3-13: ConfigurationOverlay calls preview API endpoint', () => {
    assert(
      ovl.includes('/preview') || ovl.includes('buy-boxes/preview'),
      'Must call the /preview endpoint'
    );
  });

  test('4.3-14: ConfigurationOverlay renders previewCount in review bar', () => {
    const reviewSection = ovl.slice(ovl.indexOf('co-review'));
    assert(reviewSection.includes('previewCount'), 'previewCount must be rendered in review bar');
  });

  test('4.3-15: ConfigurationOverlay has previewLoading state for spinner', () => {
    assert(ovl.includes('previewLoading'), 'Must have previewLoading state for spinner');
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => { console.error(err); process.exit(1); });
