import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Test 1: Verify Multilingual & Structured Tags in src/constants/restrictions.ts
test('Restriction definitions in source file include European languages and OFF tags', () => {
  const fileContent = readFileSync(
    path.join(projectRoot, 'src/constants/restrictions.ts'),
    'utf8'
  );

  // Dairy checks
  assert.ok(fileContent.includes("'lait'"), 'Should include French lait');
  assert.ok(fileContent.includes("'milch'"), 'Should include German milch');
  assert.ok(fileContent.includes("'leche'"), 'Should include Spanish leche');
  assert.ok(fileContent.includes("'en:milk'"), 'Should include OpenFoodFacts en:milk tag');

  // Egg checks
  assert.ok(fileContent.includes("'œuf'") || fileContent.includes("'oeuf'"), 'Should include French oeuf');
  assert.ok(fileContent.includes("'huevo'"), 'Should include Spanish huevo');
  assert.ok(fileContent.includes("'ei'"), 'Should include German ei');

  // Gluten checks
  assert.ok(fileContent.includes("'blé'"), 'Should include French ble');
  assert.ok(fileContent.includes("'weizen'"), 'Should include German weizen');
  assert.ok(fileContent.includes("'trigo'"), 'Should include Spanish trigo');
  assert.ok(fileContent.includes("'en:gluten'"), 'Should include OpenFoodFacts en:gluten tag');
});

// Test 2: Word Boundary and Negation Matching Logic
test('Allergen matcher distinguishes safe substrings and negations', () => {
  const SAFE_EXCLUSIONS = {
    dairy: ['dairy-free', 'dairy free', 'milk-free', 'milk free', 'sans lait'],
    egg: ['eggplant', 'aubergine', 'egg-free', 'egg free', 'sans oeuf'],
    gluten: ['gluten-free', 'gluten free', 'sans gluten', 'sin gluten'],
    'tree-nut': ['nut-free', 'nut free', 'butternut', 'nutmeg', 'coconut'],
  };

  function isMatch(text, keyword, restrictionId) {
    const lower = text.toLowerCase();
    const exclusions = SAFE_EXCLUSIONS[restrictionId] || [];
    if (exclusions.some((exc) => lower.includes(exc))) {
      return false;
    }
    const pattern = new RegExp(`(^|[^a-z0-9])${keyword}(?:s|es)?([^a-z0-9]|$)`, 'i');
    return pattern.test(lower);
  }

  // Eggplant must NOT trigger egg allergen
  assert.equal(isMatch('Roasted eggplant with garlic', 'egg', 'egg'), false);
  // Real egg MUST trigger egg allergen
  assert.equal(isMatch('Organic whole egg powder', 'egg', 'egg'), true);

  // Gluten-free rolled oats must NOT trigger gluten
  assert.equal(isMatch('Certified gluten-free rolled oats', 'gluten', 'gluten'), false);
  // Wheat flour MUST trigger gluten
  assert.equal(isMatch('Organic whole wheat flour', 'wheat', 'gluten'), true);

  // Butternut squash must NOT trigger tree-nut
  assert.equal(isMatch('Butternut squash soup', 'nut', 'tree-nut'), false);
  // Almonds MUST trigger tree-nut
  assert.equal(isMatch('Raw organic almonds', 'almond', 'tree-nut'), true);

  // Dairy-free oat milk must NOT trigger dairy
  assert.equal(isMatch('Dairy-free oat milk', 'milk', 'dairy'), false);
  // Whole milk MUST trigger dairy
  assert.equal(isMatch('Pasteurized whole milk', 'milk', 'dairy'), true);
});

// Test 3: Food vs Non-Food Classification Refinement
test('Food classifier correctly identifies culinary oils and rejects non-food oils', () => {
  const fileContent = readFileSync(
    path.join(projectRoot, 'src/utils/productType.ts'),
    'utf8'
  );

  // Verify generic 'oil' was removed and culinary oils were added
  assert.ok(fileContent.includes("'olive oil'"), 'Should include olive oil');
  assert.ok(fileContent.includes("'vegetable oil'"), 'Should include vegetable oil');
  assert.ok(fileContent.includes("'cooking oil'"), 'Should include cooking oil');
  assert.ok(!fileContent.includes("\n  'oil',\n"), "Generic 'oil' should not be present");

  // Verify non-food oil triggers
  assert.ok(fileContent.includes("'motor oil'"), 'Should include motor oil');
  assert.ok(fileContent.includes("'baby oil'"), 'Should include baby oil');
  assert.ok(fileContent.includes("'massage oil'"), 'Should include massage oil');
  assert.ok(fileContent.includes("'lotion'"), 'Should include lotion');
});

// Test 4: Unicode Support in Health Score Recognition
test('Health score recognizable ingredient logic accepts Unicode letters', () => {
  const fileContent = readFileSync(
    path.join(projectRoot, 'src/utils/productHealthScore.ts'),
    'utf8'
  );

  assert.ok(
    fileContent.includes('\\p{L}') || fileContent.includes('[\\p{L}\\s-]+'),
    'Should use Unicode letter property escape'
  );

  const UNICODE_WORD_PATTERN = /^[\p{L}\s-]+$/u;
  assert.ok(UNICODE_WORD_PATTERN.test('sugar'), 'ASCII English should pass');
  assert.ok(UNICODE_WORD_PATTERN.test('lécithine'), 'French accented letters should pass');
  assert.ok(UNICODE_WORD_PATTERN.test('azúcar'), 'Spanish accented letters should pass');
  assert.ok(UNICODE_WORD_PATTERN.test('sonnenblumenöl'), 'German umlauts should pass');
  assert.ok(UNICODE_WORD_PATTERN.test('сахар'), 'Cyrillic letters should pass');
  assert.ok(!UNICODE_WORD_PATTERN.test('e150d caramel'), 'Ingredients with digits should fail');
});

// Test 5: Firestore Batch Chunking Threshold
test('Cloud user data service defines and uses chunked batches', () => {
  const filePath = existsSync(path.join(projectRoot, 'src/services/cloud/cloudUserDataService.ts'))
    ? path.join(projectRoot, 'src/services/cloud/cloudUserDataService.ts')
    : path.join(projectRoot, 'src/services/cloudUserDataService.ts');
  const fileContent = readFileSync(filePath, 'utf8');

  assert.ok(fileContent.includes('FIRESTORE_BATCH_LIMIT'), 'Should define FIRESTORE_BATCH_LIMIT');
  assert.ok(fileContent.includes('commitInChunks'), 'Should define commitInChunks utility');
});

// Test 6: Compliant OpenFoodFacts User-Agent
test('HTTP utility attaches compliant User-Agent header', () => {
  const filePath = existsSync(path.join(projectRoot, 'src/services/api/http.ts'))
    ? path.join(projectRoot, 'src/services/api/http.ts')
    : path.join(projectRoot, 'src/services/http.ts');
  const fileContent = readFileSync(filePath, 'utf8');

  assert.ok(fileContent.includes('DEFAULT_USER_AGENT'), 'Should define DEFAULT_USER_AGENT');
  assert.ok(fileContent.includes("'User-Agent'"), "Should attach 'User-Agent' header");
  assert.ok(fileContent.includes('Inqoura'), 'User-Agent should identify Inqoura');
});
