#!/usr/bin/env node
/**
 * Generate combined JSON files from the Portkey-AI/models repo.
 *
 * Reads general/ and pricing/ directories and produces combined/ files
 * in the format expected by the model-library website (lib/models.ts).
 *
 * Usage:
 *   node scripts/generate-combined.js [models-repo-path]
 *
 * If no path is provided, defaults to ./models (relative to project root).
 *
 * Pricing conversion:
 *   Source (models repo):  cents per token
 *   Output (combined/):   USD per million tokens
 *   Formula: source_value * 10000 = USD per million tokens
 *
 *   Additional units:     source_value * 100
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// -------------------------------------------------------------------
// Configuration
// -------------------------------------------------------------------

const PROJECT_ROOT = path.join(__dirname, '..');
const MODELS_REPO_PATH = process.argv[2] || path.join(PROJECT_ROOT, 'models');
const GENERAL_DIR = path.join(MODELS_REPO_PATH, 'general');
const PRICING_DIR = path.join(MODELS_REPO_PATH, 'pricing');
const COMBINED_DIR = path.join(PROJECT_ROOT, 'combined');

// Pricing conversion factors
// cents/token -> USD/million tokens: value * (1/100) * 1,000,000 = value * 10,000
const TOKEN_PRICE_FACTOR = 10000;
// Additional units and image pricing: cents -> display cents * 100
const ADDITIONAL_UNIT_FACTOR = 100;

// -------------------------------------------------------------------
// Provider-specific model resolvers
// Maps a general model name to its pricing lookup key
// -------------------------------------------------------------------

const modelResolvers = {
  openai: (model) => {
    if (model.startsWith('ft:')) {
      return `ft:${model.split(':')[1]}`;
    }
    return model;
  },

  'azure-openai': (model) => {
    if (model.includes('.ft')) {
      return `${model.split('.ft')[0]}.ft`;
    }
    return model;
  },

  'azure-ai': (model) => {
    if (model.includes('.ft')) {
      return `${model.split('.ft')[0]}.ft`;
    }
    return model;
  },

  'fireworks-ai': (model) => {
    model = model.replace('accounts/fireworks/models/', '');
    if (model.includes('mixtral-8x7b')) return 'mixtral-8x7b';
    if (model.includes('dbrx-instruct')) return 'dbrx-instruct';
    return model;
  },

  bedrock: (model) => {
    return model.replace(/^(us\.|eu\.|global\.|us-gov\.)/, '');
  },

  google: (model) => model,

  'stability-ai': (model) => model,

  predibase: (model) => {
    if (model.includes('mixtral-8x7b')) {
      return 'mixtral-8x7b-v0-1';
    }
    return model;
  },
};

// -------------------------------------------------------------------
// Git helpers – derive per-model "last updated" via git blame
// -------------------------------------------------------------------

/**
 * Run `git blame --line-porcelain` on a JSON file and return a map of
 * { modelName: isoDateString } by finding the most recent author-time
 * across all lines belonging to each top-level JSON key.
 *
 * Top-level keys are identified by 2-space-indented `"key":` lines
 * (standard pretty-printed JSON). Keys named "default", "name", and
 * "description" are skipped as they are metadata, not models.
 */
function getPerModelDatesFromBlame(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const dir = path.dirname(filePath);
  const file = path.basename(filePath);

  let blameOutput;
  try {
    blameOutput = execSync(`git blame --line-porcelain -- "${file}"`, {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 100 * 1024 * 1024, // 100 MB – some files are large
    });
  } catch {
    return {};
  }

  // ---- Parse blame → { lineNumber: unixTimestamp } ----
  const lineTimestamps = {};
  let currentLine = null;
  let currentTimestamp = null;

  for (const line of blameOutput.split('\n')) {
    // Block header: <40-char-hash> <orig-line> <final-line> [<count>]
    const headerMatch = line.match(/^[0-9a-f]{40}\s+\d+\s+(\d+)/);
    if (headerMatch) {
      currentLine = parseInt(headerMatch[1], 10);
    }
    if (line.startsWith('author-time ')) {
      currentTimestamp = parseInt(line.slice('author-time '.length), 10);
    }
    // Content line (prefixed with a tab) closes the current block
    if (line.startsWith('\t') && currentLine !== null && currentTimestamp !== null) {
      lineTimestamps[currentLine] = currentTimestamp;
      currentLine = null;
      currentTimestamp = null;
    }
  }

  // ---- Map top-level JSON keys to line ranges ----
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const META_KEYS = new Set(['default', 'name', 'description']);

  // Collect all top-level keys with their start lines
  const keys = []; // [{ name, startLine }]
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^  "([^"]+)"\s*:/);
    if (m) keys.push({ name: m[1], startLine: i + 1 }); // 1-indexed
  }

  // ---- For each model key, find max timestamp in its line range ----
  const modelDates = {};

  for (let k = 0; k < keys.length; k++) {
    const { name, startLine } = keys[k];
    if (META_KEYS.has(name)) continue;

    const endLine = k + 1 < keys.length ? keys[k + 1].startLine - 1 : lines.length;
    let maxTs = 0;
    for (let ln = startLine; ln <= endLine; ln++) {
      if (lineTimestamps[ln] && lineTimestamps[ln] > maxTs) {
        maxTs = lineTimestamps[ln];
      }
    }
    if (maxTs > 0) {
      modelDates[name] = new Date(maxTs * 1000).toISOString();
    }
  }

  return modelDates;
}

/**
 * Return per-model last-updated dates for a provider by running
 * git blame on both general/ and pricing/ files and merging results
 * (taking the most recent date per model across both files).
 */
function getProviderModelDates(providerName) {
  const generalPath = path.join(GENERAL_DIR, `${providerName}.json`);
  const pricingPath = path.join(PRICING_DIR, `${providerName}.json`);

  const generalDates = getPerModelDatesFromBlame(generalPath);
  const pricingDates = getPerModelDatesFromBlame(pricingPath);

  // Merge: take the most recent date per model
  const merged = { ...generalDates };
  for (const [model, date] of Object.entries(pricingDates)) {
    if (!merged[model] || new Date(date) > new Date(merged[model])) {
      merged[model] = date;
    }
  }
  return merged;
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`  Error reading ${filePath}: ${e.message}`);
    return null;
  }
}

function getJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));
}

function sortObjectKeys(obj) {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = sortObjectKeys(obj[key]);
    });
  return sorted;
}

function writeJson(filePath, data) {
  const sorted = sortObjectKeys(data);
  fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n');
}

function roundPrice(value) {
  if (typeof value !== 'number' || isNaN(value)) return value;
  return Math.round(value * 1e10) / 1e10;
}

// -------------------------------------------------------------------
// Param helpers
// -------------------------------------------------------------------

/**
 * Merge model-specific params with defaults.
 * Model param values override default values for the same key.
 */
function mergeParams(modelParams, defaultParams) {
  if (!defaultParams || defaultParams.length === 0) return modelParams || [];
  if (!modelParams || modelParams.length === 0) return defaultParams;

  const merged = defaultParams.map((dp) => ({ ...dp }));
  const processedKeys = new Set(merged.map((p) => p.key).filter(Boolean));

  for (const mp of modelParams) {
    if (!mp.key) {
      merged.push(mp);
      continue;
    }
    const idx = merged.findIndex((p) => p.key === mp.key);
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], ...mp };
    } else {
      merged.push(mp);
      processedKeys.add(mp.key);
    }
  }

  return merged;
}

/**
 * Extract max_output_tokens from params (merged or default).
 */
function extractMaxOutputTokens(modelParams, defaultParams) {
  // First check model-specific params for an override
  if (modelParams && Array.isArray(modelParams)) {
    const mp = modelParams.find(
      (p) => p.key === 'max_tokens' || p.key === 'max_completion_tokens'
    );
    if (mp?.maxValue) return mp.maxValue;
  }

  // Fall back to defaults
  if (defaultParams && Array.isArray(defaultParams)) {
    const dp = defaultParams.find(
      (p) => p.key === 'max_tokens' || p.key === 'max_completion_tokens'
    );
    if (dp?.maxValue) return dp.maxValue;
  }

  return null;
}

// -------------------------------------------------------------------
// Pricing conversion
// -------------------------------------------------------------------

/**
 * Convert a pricing_config from the models repo to the website format.
 *
 * Source format (cents per token):
 *   { pay_as_you_go: { request_token: { price: 0.00025 }, ... } }
 *
 * Target format (USD per million tokens):
 *   { tokens: { input: 2.5, ... }, currency: "USD", type: "pay_as_you_go" }
 *
 * Also handles:
 * - Image-only pricing (dall-e) → pricing.images.prices
 * - Additional-units-only pricing (sora) → pricing.additional without tokens
 * - Variant token types (gpt-image-1) → request_text_token maps to input, etc.
 */
function convertPricing(pricingConfig, defaultPricingConfig) {
  const payg = pricingConfig?.pay_as_you_go;
  if (!payg) return null;

  const pricing = {
    currency:
      pricingConfig.currency || defaultPricingConfig?.currency || 'USD',
    type: 'pay_as_you_go',
  };

  const tokens = {};

  // Standard token pricing
  if (payg.request_token?.price) {
    tokens.input = roundPrice(payg.request_token.price * TOKEN_PRICE_FACTOR);
  }
  if (payg.response_token?.price) {
    tokens.output = roundPrice(payg.response_token.price * TOKEN_PRICE_FACTOR);
  }
  if (payg.cache_read_input_token?.price) {
    tokens.cached_input = roundPrice(
      payg.cache_read_input_token.price * TOKEN_PRICE_FACTOR
    );
  }
  if (payg.cache_write_input_token?.price) {
    tokens.cache_write = roundPrice(
      payg.cache_write_input_token.price * TOKEN_PRICE_FACTOR
    );
  }

  // Audio token pricing
  if (payg.request_audio_token?.price) {
    tokens.audio_input = roundPrice(
      payg.request_audio_token.price * TOKEN_PRICE_FACTOR
    );
  }
  if (payg.response_audio_token?.price) {
    tokens.audio_output = roundPrice(
      payg.response_audio_token.price * TOKEN_PRICE_FACTOR
    );
  }
  if (payg.cache_read_audio_input_token?.price) {
    tokens.audio_cached_input = roundPrice(
      payg.cache_read_audio_input_token.price * TOKEN_PRICE_FACTOR
    );
  }

  // Variant token types (gpt-image-1 uses request_text_token, response_image_token, etc.)
  if (payg.request_text_token?.price && !tokens.input) {
    tokens.input = roundPrice(
      payg.request_text_token.price * TOKEN_PRICE_FACTOR
    );
  }
  if (payg.response_image_token?.price && !tokens.output) {
    tokens.output = roundPrice(
      payg.response_image_token.price * TOKEN_PRICE_FACTOR
    );
  }
  if (payg.request_image_token?.price) {
    tokens.image_input = roundPrice(
      payg.request_image_token.price * TOKEN_PRICE_FACTOR
    );
  }
  if (payg.cached_text_input_token?.price && !tokens.cached_input) {
    tokens.cached_input = roundPrice(
      payg.cached_text_input_token.price * TOKEN_PRICE_FACTOR
    );
  }
  if (payg.cached_image_input_token?.price) {
    tokens.cached_image_input = roundPrice(
      payg.cached_image_input_token.price * TOKEN_PRICE_FACTOR
    );
  }

  // Add tokens if we have any non-zero values
  if (Object.keys(tokens).length > 0) {
    tokens.unit = 'USD_per_million_tokens';
    pricing.tokens = tokens;
  }

  // Additional units (web_search, file_search, thinking_token, video_duration, etc.)
  if (payg.additional_units && Object.keys(payg.additional_units).length > 0) {
    const prices = convertNestedPricing(
      payg.additional_units,
      ADDITIONAL_UNIT_FACTOR
    );
    if (prices && Object.keys(prices).length > 0) {
      pricing.additional = {
        prices,
        unit: 'USD_per_unit',
      };
    }
  }

  // Image pricing (dall-e, gpt-image, etc.)
  if (payg.image) {
    const imagePricing = convertNestedPricing(
      payg.image,
      ADDITIONAL_UNIT_FACTOR
    );
    if (imagePricing) {
      pricing.images = {
        prices: imagePricing,
      };
    }
  }

  // Must have at least some pricing data (tokens, images, or additional units)
  if (!pricing.tokens && !pricing.images && !pricing.additional) {
    return null;
  }

  return pricing;
}

/**
 * Recursively convert nested pricing structures.
 * Handles objects like { "web_search": { "price": 1 } } or deeper nesting.
 */
function convertNestedPricing(obj, factor) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'number') return roundPrice(obj * factor);
  if (typeof obj !== 'object') return obj;

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = convertNestedPricing(value, factor);
  }
  return Object.keys(result).length > 0 ? result : null;
}

// -------------------------------------------------------------------
// Feature / modality derivation
// -------------------------------------------------------------------

/**
 * Derive features from the general config for a model.
 * Checks both type.supported and explicit features field.
 */
function deriveFeatures(generalConfig) {
  const features = {};

  // From type.supported array
  if (generalConfig?.type?.supported && Array.isArray(generalConfig.type.supported)) {
    for (const cap of generalConfig.type.supported) {
      if (cap === 'tools') features.function_calling = true;
      if (cap === 'vision') features.vision = true;
      if (cap === 'reasoning') features.reasoning = true;
    }
  }

  // From explicit features object (some providers like azure-openai have this)
  if (generalConfig?.features && typeof generalConfig.features === 'object') {
    if (generalConfig.features.tools) features.function_calling = true;
    if (generalConfig.features.vision) features.vision = true;
    if (generalConfig.features.reasoning) features.reasoning = true;
  }

  return Object.keys(features).length > 0 ? features : undefined;
}

/**
 * Derive modality. Default is text/text.
 * Some models can be inferred from type or features.
 */
function deriveModality(generalConfig, modelType) {
  const input = ['text'];
  const output = ['text'];

  // Image generation models
  if (modelType === 'image' || modelType === 'image-generation') {
    return { input: ['text'], output: ['image'] };
  }

  // Embedding models
  if (modelType === 'embedding' || modelType === 'embeddings') {
    return { input: ['text'], output: ['embedding'] };
  }

  // Audio models
  if (modelType === 'audio' || modelType === 'speech' || modelType === 'tts') {
    return { input: ['text'], output: ['audio'] };
  }

  // Transcription models
  if (modelType === 'transcription' || modelType === 'stt') {
    return { input: ['audio'], output: ['text'] };
  }

  return { input, output };
}

// -------------------------------------------------------------------
// Provider-specific pricing matchers
// -------------------------------------------------------------------

/**
 * Google uses tiered pricing: -lte-128k and -gt-128k suffixes.
 * Returns { pricing, pricing_tiers } for the base model.
 */
function matchGooglePricing(modelName, pricingData, defaultPricingConfig) {
  if (!pricingData) return { pricing: null, pricing_tiers: null };

  const lteKey = `${modelName}-lte-128k`;
  const gtKey = `${modelName}-gt-128k`;

  const ltePricing = pricingData[lteKey];
  const gtPricing = pricingData[gtKey];
  const directPricing = pricingData[modelName];

  const result = { pricing: null, pricing_tiers: null };

  // Direct match takes priority
  if (directPricing?.pricing_config) {
    result.pricing = convertPricing(directPricing.pricing_config, defaultPricingConfig);
  } else if (ltePricing?.pricing_config) {
    result.pricing = convertPricing(ltePricing.pricing_config, defaultPricingConfig);
  }

  // Add tiered pricing if both tiers exist
  if (gtPricing?.pricing_config && ltePricing?.pricing_config) {
    result.pricing_tiers = {
      gt_128k: convertPricing(gtPricing.pricing_config, defaultPricingConfig),
    };
  }

  return result;
}

/**
 * Bedrock uses regional prefixes: us., eu., global., us-gov.
 * Strip the prefix and look up the base model.
 */
function matchBedrockPricing(modelName, pricingData, defaultPricingConfig) {
  if (!pricingData) return null;

  // Direct match
  if (pricingData[modelName]?.pricing_config) {
    return convertPricing(pricingData[modelName].pricing_config, defaultPricingConfig);
  }

  // Strip regional prefix
  const baseModel = modelName.replace(/^(us\.|eu\.|global\.|us-gov\.)/, '');
  if (pricingData[baseModel]?.pricing_config) {
    return convertPricing(pricingData[baseModel].pricing_config, defaultPricingConfig);
  }

  return null;
}

// -------------------------------------------------------------------
// Main merge logic
// -------------------------------------------------------------------

function mergeProvider(providerName) {
  const generalPath = path.join(GENERAL_DIR, `${providerName}.json`);
  const pricingPath = path.join(PRICING_DIR, `${providerName}.json`);

  const generalData = fs.existsSync(generalPath) ? readJson(generalPath) : null;
  const pricingData = fs.existsSync(pricingPath) ? readJson(pricingPath) : null;

  if (!generalData && !pricingData) {
    console.log(`  Skipping ${providerName}: no data found`);
    return null;
  }

  // Defaults from general
  const defaultParams = generalData?.default?.params || [];
  const defaultMessages = generalData?.default?.messages || null;
  const defaultType = generalData?.default?.type || null;

  // Default pricing config (for currency, calculate, etc.)
  const defaultPricingConfig = pricingData?.default?.pricing_config || null;

  // Per-model last-updated dates (from git blame)
  const modelDates = getProviderModelDates(providerName);

  // Build combined structure
  const combined = {
    _defaults: null,
    id: providerName,
    models: {},
    name: providerName,
    schema_version: '2.0',
  };

  // Set _defaults from general
  if (defaultParams.length > 0 || defaultMessages) {
    combined._defaults = {};
    if (defaultMessages?.options) {
      combined._defaults.message_roles = defaultMessages.options;
    }
    if (defaultParams.length > 0) {
      combined._defaults.parameters = defaultParams;
    }
  }

  // Collect model names from both sources
  const generalModels = generalData
    ? Object.keys(generalData).filter(
        (k) => k !== 'name' && k !== 'description' && k !== 'default'
      )
    : [];

  const pricingModelsSet = new Set(
    pricingData
      ? Object.keys(pricingData).filter((k) => k !== 'default')
      : []
  );

  // For Google: remove tiered pricing suffixes from the set
  // (they'll be merged into the base model)
  if (providerName === 'google') {
    for (const model of [...pricingModelsSet]) {
      if (model.endsWith('-lte-128k') || model.endsWith('-gt-128k')) {
        pricingModelsSet.delete(model);
      }
    }
  }

  // Track which pricing models have been matched
  const matchedPricingModels = new Set();

  // ---------------------------------------------------------------
  // Process models from general/
  // ---------------------------------------------------------------
  for (const modelName of generalModels) {
    const gc = generalData[modelName];
    const entry = {};

    // Merged parameters
    const mergedParams = mergeParams(gc.params, defaultParams);
    entry._parameters = mergedParams && mergedParams.length > 0 ? mergedParams : [];

    // Remove parameters
    if (gc.removeParams && gc.removeParams.length > 0) {
      entry._remove_parameters = gc.removeParams;
    }

    // Playground disabled
    if (gc.disablePlayground) {
      entry._playground_disabled = true;
    }

    // Model ID
    entry.id = modelName;

    // Max output tokens
    const maxOutput = extractMaxOutputTokens(gc.params, defaultParams);
    if (maxOutput) {
      entry.max_output_tokens = maxOutput;
    }

    // Type
    const modelType = gc.type?.primary || defaultType?.primary || 'chat';

    // Modality
    entry.modality = deriveModality(gc, modelType);

    // Features
    const features = deriveFeatures(gc);
    if (features) {
      entry.features = features;
    }

    // Pricing lookup
    let pricing = null;
    let pricingTiers = null;

    if (providerName === 'google') {
      const gp = matchGooglePricing(modelName, pricingData, defaultPricingConfig);
      pricing = gp.pricing;
      pricingTiers = gp.pricing_tiers;
      // Mark tiered keys as matched
      matchedPricingModels.add(modelName);
      matchedPricingModels.add(`${modelName}-lte-128k`);
      matchedPricingModels.add(`${modelName}-gt-128k`);
    } else if (providerName === 'bedrock') {
      pricing = matchBedrockPricing(modelName, pricingData, defaultPricingConfig);
      const baseModel = modelName.replace(/^(us\.|eu\.|global\.|us-gov\.)/, '');
      matchedPricingModels.add(modelName);
      matchedPricingModels.add(baseModel);
    } else {
      const resolver = modelResolvers[providerName];
      const lookupName = resolver ? resolver(modelName) : modelName;

      if (pricingData?.[lookupName]?.pricing_config) {
        pricing = convertPricing(pricingData[lookupName].pricing_config, defaultPricingConfig);
        matchedPricingModels.add(lookupName);
      } else if (lookupName !== modelName && pricingData?.[modelName]?.pricing_config) {
        pricing = convertPricing(pricingData[modelName].pricing_config, defaultPricingConfig);
        matchedPricingModels.add(modelName);
      }
    }

    if (pricing) {
      entry.pricing = pricing;
    }
    if (pricingTiers) {
      entry.pricing_tiers = pricingTiers;
    }

    entry.type = modelType;

    // Per-model last updated date from git blame
    if (modelDates[modelName]) {
      entry._lastUpdated = modelDates[modelName];
    }

    combined.models[modelName] = entry;
  }

  // ---------------------------------------------------------------
  // Process pricing-only models (not in general/)
  // ---------------------------------------------------------------
  for (const modelName of pricingModelsSet) {
    if (matchedPricingModels.has(modelName)) continue;
    if (combined.models[modelName]) continue;

    // Check if any general model resolves to this pricing key
    let resolvedByGeneral = false;
    const resolver = modelResolvers[providerName];
    for (const gm of generalModels) {
      const lookupName = resolver ? resolver(gm) : gm;
      if (lookupName === modelName) {
        resolvedByGeneral = true;
        break;
      }
    }
    if (resolvedByGeneral) continue;

    // Add as pricing-only model
    if (pricingData[modelName]?.pricing_config) {
      const pricing = convertPricing(
        pricingData[modelName].pricing_config,
        defaultPricingConfig
      );
      if (pricing) {
        const pricingOnlyEntry = {
          _config_source: 'pricing_only',
          id: modelName,
          pricing,
          type: 'chat',
        };
        if (modelDates[modelName]) {
          pricingOnlyEntry._lastUpdated = modelDates[modelName];
        }
        combined.models[modelName] = pricingOnlyEntry;
      }
    }
  }

  return combined;
}

// -------------------------------------------------------------------
// Main
// -------------------------------------------------------------------

function main() {
  console.log('Generating combined model files...\n');
  console.log(`Models repo: ${MODELS_REPO_PATH}`);
  console.log(`General dir: ${GENERAL_DIR}`);
  console.log(`Pricing dir: ${PRICING_DIR}`);
  console.log(`Output dir:  ${COMBINED_DIR}\n`);

  // Verify source directories exist
  if (!fs.existsSync(GENERAL_DIR) && !fs.existsSync(PRICING_DIR)) {
    console.error(
      'Error: Neither general/ nor pricing/ directories found in the models repo.'
    );
    console.error(`Looked in: ${MODELS_REPO_PATH}`);
    console.error(
      '\nMake sure you have cloned the Portkey-AI/models repo, or pass the path as an argument:'
    );
    console.error('  node scripts/generate-combined.js /path/to/models');
    process.exit(1);
  }

  // Clean and recreate output directory so stale provider files are removed
  if (fs.existsSync(COMBINED_DIR)) {
    const staleFiles = fs.readdirSync(COMBINED_DIR).filter((f) => f.endsWith('.json'));
    for (const f of staleFiles) {
      fs.unlinkSync(path.join(COMBINED_DIR, f));
    }
    console.log(`Cleaned ${staleFiles.length} old files from combined/\n`);
  } else {
    fs.mkdirSync(COMBINED_DIR, { recursive: true });
  }

  // Get all providers from both directories
  const generalProviders = getJsonFiles(GENERAL_DIR);
  const pricingProviders = getJsonFiles(PRICING_DIR);
  const allProviders = [...new Set([...generalProviders, ...pricingProviders])].sort();

  console.log(`Found ${allProviders.length} providers to process`);
  console.log(`  General: ${generalProviders.length}, Pricing: ${pricingProviders.length}\n`);

  let totalModels = 0;
  let totalWithPricing = 0;
  let totalPricingOnly = 0;
  let errors = 0;

  for (const provider of allProviders) {
    const combined = mergeProvider(provider);

    if (!combined) {
      errors++;
      continue;
    }

    const modelCount = Object.keys(combined.models).length;
    const withPricing = Object.values(combined.models).filter(
      (m) => m.pricing
    ).length;
    const pricingOnly = Object.values(combined.models).filter(
      (m) => m._config_source === 'pricing_only'
    ).length;

    totalModels += modelCount;
    totalWithPricing += withPricing;
    totalPricingOnly += pricingOnly;

    const outputPath = path.join(COMBINED_DIR, `${provider}.json`);
    writeJson(outputPath, combined);

    let status = `  ${provider}: ${modelCount} models`;
    if (withPricing < modelCount) {
      status += ` (${modelCount - withPricing} without pricing)`;
    }
    if (pricingOnly > 0) {
      status += ` (${pricingOnly} pricing-only)`;
    }
    console.log(status);
  }

  console.log('\n---');
  console.log(`Done! ${allProviders.length} providers, ${totalModels} models total`);
  console.log(`  With pricing: ${totalWithPricing}`);
  console.log(`  Without pricing: ${totalModels - totalWithPricing}`);
  console.log(`  Pricing-only: ${totalPricingOnly}`);
  if (errors > 0) {
    console.log(`  Errors: ${errors}`);
    process.exit(1);
  }
}

main();
