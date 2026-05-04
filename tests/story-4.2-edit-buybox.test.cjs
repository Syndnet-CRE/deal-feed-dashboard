/**
 * STORY-4.2 Static Analysis Tests — Wire Edit button in BuyBoxesView
 * Run: node tests/story-4.2-edit-buybox.test.cjs
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
  console.log('\n=== STORY-4.2: Wire Edit Buy Box Tests ===\n');

  const root = path.join(__dirname, '..', 'src');
  const ctx  = fs.readFileSync(path.join(root, 'contexts/DealsContext.jsx'),           'utf-8');
  const ovl  = fs.readFileSync(path.join(root, 'components/ConfigurationOverlay.jsx'), 'utf-8');
  const app  = fs.readFileSync(path.join(root, 'App.jsx'),                              'utf-8');
  const bbv  = fs.readFileSync(path.join(root, 'views/BuyBoxesView.jsx'),               'utf-8');

  test('4.2-1: patchBuyBox defined in DealsContext', () => {
    assert(ctx.includes('patchBuyBox'), 'patchBuyBox must be defined');
  });

  test('4.2-2: patchBuyBox calls api.patch on buy-boxes endpoint', () => {
    assert(ctx.includes('api.patch') && ctx.includes('buy-boxes'), 'patchBuyBox must use api.patch');
  });

  test('4.2-3: normalizeBuyBox spreads raw fields (...b)', () => {
    assert(ctx.includes('...b'), 'normalizeBuyBox must spread ...b to expose raw fields');
  });

  test('4.2-4: patchBuyBox in context value', () => {
    const after = ctx.slice(ctx.indexOf('DealsCtx.Provider'));
    assert(after.includes('patchBuyBox'), 'patchBuyBox must appear in context value object');
  });

  test('4.2-5: ConfigurationOverlay accepts mode prop', () => {
    const sig = ovl.match(/function ConfigurationOverlay\s*\(\s*\{([^}]+)\}/);
    assert(sig && sig[1].includes('mode'), 'mode prop required');
  });

  test('4.2-6: ConfigurationOverlay accepts initialData prop', () => {
    const sig = ovl.match(/function ConfigurationOverlay\s*\(\s*\{([^}]+)\}/);
    assert(sig && sig[1].includes('initialData'), 'initialData prop required');
  });

  test('4.2-7: edit mode uses api.patch to buy-boxes', () => {
    assert(ovl.includes('api.patch') && ovl.includes('buy-boxes'), 'must PATCH buy-boxes in edit mode');
  });

  test('4.2-8: edit mode shows different submit label', () => {
    assert(ovl.includes('Save') || ovl.includes('Update'), 'submit label must differ in edit mode');
  });

  test('4.2-9: Your Info section conditionally hidden in edit mode', () => {
    const hasGuard = ovl.includes("mode === 'edit'") || ovl.includes("mode !== 'create'") ||
      ovl.includes('isEdit') || ovl.includes('isCreate');
    assert(hasGuard, 'Your Info section must be guarded by a mode check');
  });

  test('4.2-10: form initialised from initialData', () => {
    assert(ovl.includes('initialData'), 'form init must reference initialData');
  });

  test('4.2-11: App.jsx has editingBuyBox state', () => {
    assert(app.includes('editingBuyBox'), 'editingBuyBox state required in App.jsx');
  });

  test('4.2-12: App.jsx passes onEdit to BuyBoxesView', () => {
    assert(app.includes('onEdit'), 'App.jsx must pass onEdit to BuyBoxesView');
  });

  test('4.2-13: App.jsx renders overlay in edit mode with initialData', () => {
    assert(
      (app.includes("mode=\"edit\"") || app.includes("mode='edit'")) && app.includes('initialData'),
      'App.jsx must render ConfigurationOverlay with mode="edit" and initialData'
    );
  });

  test('4.2-14: BuyBoxesView accepts onEdit prop', () => {
    assert(bbv.includes('onEdit'), 'BuyBoxesView must accept onEdit prop');
  });

  test('4.2-15: Edit button calls onEdit with buy box', () => {
    assert(bbv.includes('onEdit(') || bbv.includes('onEdit?.('), 'Edit button onClick must call onEdit(...)');
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => { console.error(err); process.exit(1); });
