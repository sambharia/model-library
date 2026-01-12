import { Model, Provider, ModelPricing, ModelFeatures, AdditionalUnit, formatUnitDisplayName, getUnitCategory } from './types'

// Static imports for all provider JSON files
// This makes the data available in Cloudflare Workers
import ai21Data from '@/combined/ai21.json'
import anthropicData from '@/combined/anthropic.json'
import anyscaleData from '@/combined/anyscale.json'
import azureAiData from '@/combined/azure-ai.json'
import azureOpenaiData from '@/combined/azure-openai.json'
import bedrockData from '@/combined/bedrock.json'
import cerebrasData from '@/combined/cerebras.json'
import cohereData from '@/combined/cohere.json'
import dashscopeData from '@/combined/dashscope.json'
import deepbricksData from '@/combined/deepbricks.json'
import deepinfraData from '@/combined/deepinfra.json'
import deepseekData from '@/combined/deepseek.json'
import fireworksAiData from '@/combined/fireworks-ai.json'
import fireworksData from '@/combined/fireworks.json'
import githubData from '@/combined/github.json'
import googleData from '@/combined/google.json'
import groqData from '@/combined/groq.json'
import inferenceNetData from '@/combined/inference-net.json'
import jinaData from '@/combined/jina.json'
import lambdaData from '@/combined/lambda.json'
import lemonfoxAiData from '@/combined/lemonfox-ai.json'
import mistralAiData from '@/combined/mistral-ai.json'
import monsterapiData from '@/combined/monsterapi.json'
import nebiusData from '@/combined/nebius.json'
import nomicData from '@/combined/nomic.json'
import novitaAiData from '@/combined/novita-ai.json'
import openaiData from '@/combined/openai.json'
import openrouterData from '@/combined/openrouter.json'
import oracleData from '@/combined/oracle.json'
import palmData from '@/combined/palm.json'
import perplexityAiData from '@/combined/perplexity-ai.json'
import predibaseData from '@/combined/predibase.json'
import rekaAiData from '@/combined/reka-ai.json'
import sagemakerData from '@/combined/sagemaker.json'
import segmindData from '@/combined/segmind.json'
import stabilityAiData from '@/combined/stability-ai.json'
import togetherAiData from '@/combined/together-ai.json'
import vertexAiData from '@/combined/vertex-ai.json'
import workersAiData from '@/combined/workers-ai.json'
import xAiData from '@/combined/x-ai.json'
import zhipuData from '@/combined/zhipu.json'

// Re-export types and utilities
export * from './types'

// Map of provider IDs to their data
const providerDataMap: Record<string, unknown> = {
  'ai21': ai21Data,
  'anthropic': anthropicData,
  'anyscale': anyscaleData,
  'azure-ai': azureAiData,
  'azure-openai': azureOpenaiData,
  'bedrock': bedrockData,
  'cerebras': cerebrasData,
  'cohere': cohereData,
  'dashscope': dashscopeData,
  'deepbricks': deepbricksData,
  'deepinfra': deepinfraData,
  'deepseek': deepseekData,
  'fireworks-ai': fireworksAiData,
  'fireworks': fireworksData,
  'github': githubData,
  'google': googleData,
  'groq': groqData,
  'inference-net': inferenceNetData,
  'jina': jinaData,
  'lambda': lambdaData,
  'lemonfox-ai': lemonfoxAiData,
  'mistral-ai': mistralAiData,
  'monsterapi': monsterapiData,
  'nebius': nebiusData,
  'nomic': nomicData,
  'novita-ai': novitaAiData,
  'openai': openaiData,
  'openrouter': openrouterData,
  'oracle': oracleData,
  'palm': palmData,
  'perplexity-ai': perplexityAiData,
  'predibase': predibaseData,
  'reka-ai': rekaAiData,
  'sagemaker': sagemakerData,
  'segmind': segmindData,
  'stability-ai': stabilityAiData,
  'together-ai': togetherAiData,
  'vertex-ai': vertexAiData,
  'workers-ai': workersAiData,
  'x-ai': xAiData,
  'zhipu': zhipuData,
}

// Cache for models data
let cachedModels: Model[] | null = null
let cachedProviders: Provider[] | null = null

function formatModelName(id: string): string {
  let name = id
  
  // Handle org/model format - keep only the model part
  if (name.includes('/')) {
    const parts = name.split('/')
    name = parts[parts.length - 1]
  }
  
  // Remove @ symbol variants (e.g., claude-3-5-haiku@20241022)
  name = name.replace(/@\d+$/, '')
  
  // Remove date suffixes: -20241022, -2024-10-22, etc. (before hyphen replacement)
  name = name.replace(/-20\d{6}(-v[\d.:]+)?$/g, '')  // -20241022 or -20241022-v1:0
  name = name.replace(/-20\d{2}-\d{2}-\d{2}$/g, '')  // -2024-10-22
  name = name.replace(/-\d{4}$/g, '')                 // -0725, -2507 (month-day patterns)
  name = name.replace(/-latest$/i, '')                // -latest
  
  // Replace hyphens/underscores with spaces
  name = name.replace(/[-_]/g, ' ')
  
  // Clean up multiple spaces
  name = name.replace(/\s+/g, ' ').trim()
  
  // Title case with smart handling
  name = name.split(' ').map(word => {
    const lower = word.toLowerCase()
    
    // Uppercase known abbreviations
    if (['gpt', 'ai', 'xl', 'xxl', 'ocr', 'vl', 'fp8', 'fp16', 'llm', 'bert', 'moe'].includes(lower)) {
      return word.toUpperCase()
    }
    
    // Version patterns (v1, v2, v0.1, etc.)
    if (lower.match(/^v\d/i)) return word.toUpperCase()
    
    // Size patterns - handle B (billion) suffix
    if (word.match(/^\d+b$/i)) return word.slice(0, -1) + 'B'
    
    // Keep numbers as-is
    if (word.match(/^\d+$/)) return word
    
    // Normal title case
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }).join(' ')
  
  return name
}

function formatProviderName(id: string): string {
  const providerNames: Record<string, string> = {
    'anthropic': 'Anthropic',
    'openai': 'OpenAI',
    'google': 'Google',
    'vertex-ai': 'Google Vertex AI',
    'meta': 'Meta',
    'mistral-ai': 'Mistral AI',
    'deepseek': 'DeepSeek',
    'cohere': 'Cohere',
    'x-ai': 'xAI',
    'groq': 'Groq',
    'together-ai': 'Together AI',
    'fireworks-ai': 'Fireworks AI',
    'fireworks': 'Fireworks',
    'perplexity-ai': 'Perplexity',
    'bedrock': 'AWS Bedrock',
    'azure-openai': 'Azure OpenAI',
    'azure-ai': 'Azure AI',
    'cerebras': 'Cerebras',
    'ai21': 'AI21 Labs',
    'reka-ai': 'Reka AI',
    'anyscale': 'Anyscale',
    'deepinfra': 'DeepInfra',
    'lambda': 'Lambda',
    'novita-ai': 'Novita AI',
    'openrouter': 'OpenRouter',
    'palm': 'Google PaLM',
    'sagemaker': 'AWS SageMaker',
    'stability-ai': 'Stability AI',
    'workers-ai': 'Cloudflare Workers AI',
    'zhipu': 'Zhipu AI',
    'dashscope': 'Alibaba DashScope',
    'nebius': 'Nebius',
    'inference-net': 'Inference.net',
    'jina': 'Jina AI',
    'lemonfox-ai': 'LemonFox AI',
    'monsterapi': 'Monster API',
    'nomic': 'Nomic',
    'oracle': 'Oracle',
    'predibase': 'Predibase',
    'segmind': 'Segmind',
    'deepbricks': 'DeepBricks',
    'github': 'GitHub Models',
  }
  return providerNames[id] || id.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

export async function getAllModels(): Promise<Model[]> {
  if (cachedModels) return cachedModels

  const models: Model[] = []

  for (const [providerId, rawData] of Object.entries(providerDataMap)) {
    try {
      const data = rawData as Record<string, unknown>
      const providerName = formatProviderName(data.id as string || providerId)
      
      if (data.models) {
        for (const [modelId, modelData] of Object.entries(data.models as Record<string, unknown>)) {
          const model = modelData as Record<string, unknown>
          
          // Extract pricing
          let pricing: ModelPricing | undefined
          if (model.pricing && typeof model.pricing === 'object') {
            const p = model.pricing as Record<string, unknown>
            const tokens = p.tokens as Record<string, unknown> | undefined
            if (tokens) {
              // Parse additional units
              let additional: AdditionalUnit[] | undefined
              const additionalData = p.additional as { prices?: Record<string, { price: number }> } | undefined
              if (additionalData?.prices) {
                additional = Object.entries(additionalData.prices).map(([name, data]) => ({
                  name,
                  price: data.price,
                  displayName: formatUnitDisplayName(name),
                  category: getUnitCategory(name),
                }))
              }

              pricing = {
                input: typeof tokens.input === 'number' ? tokens.input : 0,
                output: typeof tokens.output === 'number' ? tokens.output : 0,
                cached_input: typeof tokens.cached_input === 'number' ? tokens.cached_input : undefined,
                cache_write: typeof tokens.cache_write === 'number' ? tokens.cache_write : undefined,
                unit: (tokens.unit as string) || 'USD_per_million_tokens',
                currency: (p.currency as string) || 'USD',
                additional,
              }
            }
          }

          // Extract features
          const features: ModelFeatures = {}
          if (model.features && typeof model.features === 'object') {
            const f = model.features as Record<string, unknown>
            features.vision = f.vision === true
            features.function_calling = f.function_calling === true
            features.reasoning = f.reasoning === true
          }

          // Extract modality
          const modality = model.modality as { input?: string[]; output?: string[] } | undefined
          
          // Get max output tokens and estimate context
          const maxOutputTokens = model.max_output_tokens as number | undefined
          
          models.push({
            id: modelId,
            name: formatModelName(modelId),
            provider: providerId,
            providerDisplayName: providerName,
            type: (model.type as 'chat' | 'embedding' | 'image' | 'completion') || 'chat',
            maxOutputTokens,
            modality: {
              input: modality?.input || ['text'],
              output: modality?.output || ['text'],
            },
            features,
            pricing,
          })
        }
      }
    } catch (error) {
      console.error(`Error parsing ${providerId}:`, error)
    }
  }

  // Sort by provider and then by model name
  models.sort((a, b) => {
    if (a.provider !== b.provider) {
      return a.provider.localeCompare(b.provider)
    }
    return a.id.localeCompare(b.id)
  })

  cachedModels = models
  return models
}

// Priority providers to show first (in order)
const PRIORITY_PROVIDERS = ['openai', 'anthropic',  'google', 'bedrock', 'azure-openai', 'x-ai', 'vertex-ai', `azure-ai`, ]

// Priority model patterns - latest/top models to show first (2026)
// These patterns are matched against model IDs (case-insensitive)
const PRIORITY_MODEL_PATTERNS = [
  // OpenAI GPT-5 Series (newest first)
  'gpt-5.2',
  'gpt-5.1', 
  'gpt-5',
  'gpt-5-codex',
  'gpt-5-chat',
  'gpt-5-mini',
  'gpt-5-nano',
  'o3',
  'o1',
  
  // Anthropic Claude Series (newest first)
  'claude-opus-4.5',
  'claude-4.5-opus',
  'claude-4-opus',
  'claude-opus-4',
  'claude-sonnet-4',
  'claude-4-sonnet',
  'claude-haiku-4.5',
  'claude-4.5-haiku',
  'claude-haiku-4',
  'claude-4-haiku',
  'claude-3.5-sonnet',
  'claude-3-5-sonnet',
  
  // Google Gemini 3 Series
  'gemini-3',
  'gemini-3.0',
  'gemini-3-pro',
  'gemini-3-flash',
  'gemini-3-deep',
  'gemini-2.0',
  'gemini-2',
  'gemini-exp',
  
  // xAI Grok Series  
  'grok-5',
  'grok-4',
  'grok-3',
  'grok-2',
  
  // Meta Llama 4 Series
  'llama-4',
  'llama4',
  'Llama-4',
  
  // DeepSeek
  'deepseek-v4',
  'deepseek-v3',
  'deepseek-r1',
  'deepseek-chat',
  'deepseek-coder',
  
  // Mistral top models
  'mistral-large',
  'mistral-medium',
  'pixtral',
  'codestral',
]

// Get priority score for a model (lower = higher priority, -1 = not a priority model)
export function getModelPriority(modelId: string): number {
  const lowerModelId = modelId.toLowerCase()
  for (let i = 0; i < PRIORITY_MODEL_PATTERNS.length; i++) {
    if (lowerModelId.includes(PRIORITY_MODEL_PATTERNS[i].toLowerCase())) {
      return i
    }
  }
  return -1 // Not a priority model
}

export async function getProviders(): Promise<Provider[]> {
  if (cachedProviders) return cachedProviders

  const models = await getAllModels()
  const providerMap = new Map<string, { name: string; count: number }>()

  for (const model of models) {
    const existing = providerMap.get(model.provider)
    if (existing) {
      existing.count++
    } else {
      providerMap.set(model.provider, {
        name: model.providerDisplayName,
        count: 1,
      })
    }
  }

  const providers: Provider[] = Array.from(providerMap.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    modelCount: data.count,
  }))

  // Sort with priority providers first, then by model count
  providers.sort((a, b) => {
    const aPriority = PRIORITY_PROVIDERS.indexOf(a.id)
    const bPriority = PRIORITY_PROVIDERS.indexOf(b.id)
    
    // If both are priority providers, sort by priority order
    if (aPriority !== -1 && bPriority !== -1) {
      return aPriority - bPriority
    }
    // Priority providers come first
    if (aPriority !== -1) return -1
    if (bPriority !== -1) return 1
    // Non-priority providers sorted by model count
    return b.modelCount - a.modelCount
  })

  cachedProviders = providers
  return providers
}

export { PRIORITY_PROVIDERS }

export async function getModelsByProvider(providerId: string): Promise<Model[]> {
  const models = await getAllModels()
  return models.filter(m => m.provider === providerId)
}

export async function getModel(providerId: string, modelId: string): Promise<Model | null> {
  const models = await getAllModels()
  // Decode URL-encoded model ID (e.g., "anthropic%2Fclaude-4-opus" -> "anthropic/claude-4-opus")
  const decodedModelId = decodeURIComponent(modelId)
  const decodedProviderId = decodeURIComponent(providerId)
  return models.find(m => m.provider === decodedProviderId && m.id === decodedModelId) || null
}
