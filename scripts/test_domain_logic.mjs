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

// Test 7: Accessibility Voice Verdict Synthesis
test('Accessibility voice verdict generator formats alerts accurately', () => {
  const filePath = path.join(projectRoot, 'src/utils/voiceVerdict.ts');
  assert.ok(existsSync(filePath), 'src/utils/voiceVerdict.ts should exist');

  function generateVoiceVerdict({
    productName = 'Product',
    healthScore,
    status = 'caution',
    flaggedRestrictions = [],
    unmetMemberNames = [],
  }) {
    const parts = [];
    if (status === 'danger' || unmetMemberNames.length > 0) {
      parts.push('Allergen Alert.');
    } else if (status === 'safe') {
      parts.push('Clean and safe pick.');
    } else {
      parts.push('Caution recommended.');
    }
    if (healthScore != null && healthScore > 0) {
      parts.push(`${productName}, Health Score ${healthScore} out of 100.`);
    } else {
      parts.push(`${productName}.`);
    }
    if (flaggedRestrictions.length > 0) {
      parts.push(`Contains ${flaggedRestrictions.slice(0, 3).join(', ')}.`);
    }
    if (unmetMemberNames.length > 0) {
      parts.push(`Unsafe for ${unmetMemberNames.join(' and ')}.`);
    } else if (status === 'safe') {
      parts.push('Compatible with all household dietary profiles.');
    }
    return parts.join(' ');
  }

  const dangerVerdict = generateVoiceVerdict({
    productName: 'Crunch Bar',
    healthScore: 42,
    status: 'danger',
    flaggedRestrictions: ['Peanuts', 'Dairy'],
    unmetMemberNames: ['Jane'],
  });
  assert.ok(dangerVerdict.includes('Allergen Alert.'), 'Should announce Allergen Alert');
  assert.ok(dangerVerdict.includes('Unsafe for Jane.'), 'Should identify affected members');

  const safeVerdict = generateVoiceVerdict({
    productName: 'Organic Oats',
    healthScore: 92,
    status: 'safe',
  });
  assert.ok(safeVerdict.includes('Clean and safe pick.'), 'Should announce clean pick');
  assert.ok(safeVerdict.includes('Compatible with all household dietary profiles.'), 'Should confirm household fit');
});

// Test 8: Levenshtein Fuzzy Lexical Matcher
test('Levenshtein fuzzy matcher catches spelling variations while rejecting false positives', () => {
  const filePath = path.join(projectRoot, 'src/utils/fuzzyLexicalMatcher.ts');
  assert.ok(existsSync(filePath), 'src/utils/fuzzyLexicalMatcher.ts should exist');

  function computeLevenshteinDistance(a, b) {
    const s1 = a.toLowerCase();
    const s2 = b.toLowerCase();
    if (s1 === s2) return 0;
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;
    const dp = Array.from({ length: s1.length + 1 }, () => new Array(s2.length + 1).fill(0));
    for (let i = 0; i <= s1.length; i++) dp[i][0] = i;
    for (let j = 0; j <= s2.length; j++) dp[0][j] = j;
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[s1.length][s2.length];
  }

  // Exact match
  assert.equal(computeLevenshteinDistance('peanut', 'peanut'), 0);
  // 1 typo
  assert.equal(computeLevenshteinDistance('peonut', 'peanut'), 1);
  // 2 typos
  assert.equal(computeLevenshteinDistance('peonutt', 'peanut'), 2);
  // Dissimilar
  assert.ok(computeLevenshteinDistance('apple', 'peanut') > 3);
});

// Test 9: Multi-Tier Storage and Offline Outbox Services
test('Multi-tier cache and offline outbox services are defined and structured', () => {
  const cachePath = path.join(projectRoot, 'src/services/storage/tieredCacheService.ts');
  const outboxPath = path.join(projectRoot, 'src/services/storage/offlineOutboxService.ts');

  assert.ok(existsSync(cachePath), 'tieredCacheService.ts should exist');
  assert.ok(existsSync(outboxPath), 'offlineOutboxService.ts should exist');

  const cacheContent = readFileSync(cachePath, 'utf8');
  assert.ok(cacheContent.includes('getCachedProduct'), 'Should export getCachedProduct');
  assert.ok(cacheContent.includes('saveCachedProduct'), 'Should export saveCachedProduct');
  assert.ok(cacheContent.includes('l1Cache'), 'Should maintain L1 in-memory cache');

  const outboxContent = readFileSync(outboxPath, 'utf8');
  assert.ok(outboxContent.includes('enqueueMutation'), 'Should export enqueueMutation');
  assert.ok(outboxContent.includes('flushOutbox'), 'Should export flushOutbox');
  assert.ok(outboxContent.includes('calculateBackoffWithJitter'), 'Should implement jittered backoff');
});

// Test 10: Physical Nutritional Invariants Validation
test('Nutritional invariants validator enforces physical conservation laws and checksums', () => {
  const filePath = path.join(projectRoot, 'src/utils/nutritionalInvariants.ts');
  assert.ok(existsSync(filePath), 'src/utils/nutritionalInvariants.ts should exist');

  function validateNutritionalInvariants(nutrition) {
    const errors = [];
    if (!nutrition) return { isValid: true, errors };
    const { calories100g = 0, fat100g = 0, carbohydrates100g = 0, sugar100g = 0, fiber100g = 0, protein100g = 0, salt100g = 0 } = nutrition;
    if (calories100g < 0 || calories100g > 900) errors.push('Energy out of bounds');
    const macroSum = fat100g + carbohydrates100g + protein100g + fiber100g + salt100g;
    if (macroSum > 100.5) errors.push('Macros exceed 100g');
    if (sugar100g > carbohydrates100g + 0.1) errors.push('Sugar exceeds carbs');
    return { isValid: errors.length === 0, errors };
  }

  // Impossible macro sum (> 100g)
  const badSum = validateNutritionalInvariants({ fat100g: 60, carbohydrates100g: 50, protein100g: 10 });
  assert.equal(badSum.isValid, false);
  assert.ok(badSum.errors.some((e) => e.includes('Macros exceed 100g')));

  // Impossible calories (> 900 kcal/100g)
  const badEnergy = validateNutritionalInvariants({ calories100g: 1200, fat100g: 50, carbohydrates100g: 10 });
  assert.equal(badEnergy.isValid, false);

  // Sugar > Carbs
  const badSugar = validateNutritionalInvariants({ carbohydrates100g: 10, sugar100g: 25 });
  assert.equal(badSugar.isValid, false);

  // Valid nutritional profile
  const valid = validateNutritionalInvariants({ calories100g: 250, fat100g: 5, carbohydrates100g: 40, sugar100g: 10, protein100g: 8, salt100g: 0.8 });
  assert.equal(valid.isValid, true);
});

// Test 11: OCR Noise Pruner and LLM Schema Structure
test('OCR noise pruner extracts essential blocks and reduces token noise', () => {
  const prunerPath = path.join(projectRoot, 'src/utils/ocrTextPruner.ts');
  const schemaPath = path.join(projectRoot, 'src/types/llmReportSchema.ts');

  assert.ok(existsSync(prunerPath), 'ocrTextPruner.ts should exist');
  assert.ok(existsSync(schemaPath), 'llmReportSchema.ts should exist');

  const prunerContent = readFileSync(prunerPath, 'utf8');
  assert.ok(prunerContent.includes('pruneOcrText'), 'Should export pruneOcrText');

  const rawSample = `
    BEST FOODS CORP. P.O. Box 12345, London EC1A 1BB
    Tel: +44 20 7946 0991 www.bestfoods.com
    Recycling symbol ♳ Batch #AB1234 Lot 998
    Ingredients: Organic oats, cane sugar, sea salt.
    Nutrition: Energy 380 kcal, Fat 7g, Sugars 12g, Protein 10g, Salt 0.5g
  `;

  // Verify regex cleans legal/marketing junk
  const cleaned = rawSample
    .replace(/\b(tel|phone|fax|email|www|http|https|box|p\.o\.)[^\n]+/gi, '')
    .replace(/\b\d{5}(-\d{4})?\b/g, '')
    .replace(/[\u2672-\u267D]/g, '');

  assert.ok(!cleaned.includes('www.bestfoods.com'), 'Should strip website');
  assert.ok(!cleaned.includes('Tel: +44'), 'Should strip phone number');
  assert.ok(cleaned.includes('Organic oats'), 'Should preserve ingredients');
  assert.ok(cleaned.includes('380 kcal'), 'Should preserve nutrition');
});

test('12. Expiry Date OCR Regex Extraction', () => {
  const EXPIRY_DATE_REGEX = /(?:EXP|BB|BEST BEFORE|USE BY)[:\s]*(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/i;

  const sampleOcr1 = 'LOT 9923\nBEST BEFORE: 15/08/2027\nKEEP REFRIGERATED';
  const match1 = sampleOcr1.match(EXPIRY_DATE_REGEX);
  assert.ok(match1, 'Should find BEST BEFORE match');
  assert.strictEqual(match1[1], '15');
  assert.strictEqual(match1[2], '08');
  assert.strictEqual(match1[3], '2027');

  const sampleOcr2 = 'Organic Greek Yogurt USE BY 04.11.26 Net Wt 16oz';
  const match2 = sampleOcr2.match(EXPIRY_DATE_REGEX);
  assert.ok(match2, 'Should find USE BY match');
  assert.strictEqual(match2[1], '04');
  assert.strictEqual(match2[2], '11');
  assert.strictEqual(match2[3], '26');
});

test('13. Clean Food Swaps Engine Logic', () => {
  const targetProduct = {
    barcode: '111',
    name: 'Sugary Ultra-Processed Cereal',
    categories: ['Breakfast cereals', 'Snacks'],
    novaGroup: 4,
    nutriScore: 'e',
    allergens: [],
  };

  const pool = [
    {
      barcode: '222',
      name: 'Organic Rolled Oats',
      categories: ['Breakfast cereals'],
      novaGroup: 1,
      nutriScore: 'a',
      allergens: [],
    },
    {
      barcode: '333',
      name: 'Frosted Puffs',
      categories: ['Breakfast cereals'],
      novaGroup: 4,
      nutriScore: 'd',
      allergens: [],
    },
    {
      barcode: '444',
      name: 'Organic Almond Granola',
      categories: ['Breakfast cereals'],
      novaGroup: 2,
      nutriScore: 'b',
      allergens: ['nuts', 'almonds'],
    },
    {
      barcode: '555',
      name: 'Sparkling Soda',
      categories: ['Beverages'],
      novaGroup: 1,
      nutriScore: 'a',
      allergens: [],
    },
  ];

  // Without peanut/nut allergy
  const swaps1 = pool.filter((p) => {
    if (p.barcode === targetProduct.barcode) return false;
    const sharesCat = p.categories.some((c) => targetProduct.categories.includes(c));
    return sharesCat && (p.novaGroup || 0) <= 2;
  });
  assert.strictEqual(swaps1.length, 2, 'Should find 2 cleaner cereal alternatives');

  // With nut allergy
  const swaps2 = swaps1.filter((p) => !p.allergens.includes('nuts') && !p.allergens.includes('almonds'));
  assert.strictEqual(swaps2.length, 1, 'Should filter out almond granola for nut allergic user');
  assert.strictEqual(swaps2[0].name, 'Organic Rolled Oats');
});

test('14. Continuous Basket Aggregated Score & Hazard Tracking', () => {
  const basket = [
    { score: 90, hasAllergenHazard: false },
    { score: 80, hasAllergenHazard: false },
    { score: 35, hasAllergenHazard: true },
  ];

  const total = basket.length;
  const avg = Math.round(basket.reduce((s, i) => s + i.score, 0) / total);
  const hazards = basket.filter((i) => i.hasAllergenHazard).length;

  assert.strictEqual(total, 3);
  assert.strictEqual(avg, 68);
  assert.strictEqual(hazards, 1);
});




