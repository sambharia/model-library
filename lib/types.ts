export interface AdditionalUnit {
  name: string
  price: number
  displayName: string
  category: 'search' | 'audio' | 'video' | 'image' | 'thinking' | 'other'
}

export interface ModelPricing {
  input: number
  output: number
  cached_input?: number
  cache_write?: number
  unit: string
  currency: string
  additional?: AdditionalUnit[]
}

export interface ModelFeatures {
  vision?: boolean
  function_calling?: boolean
  reasoning?: boolean
  streaming?: boolean
  json_mode?: boolean
}

export interface Model {
  id: string
  name: string
  provider: string
  providerDisplayName: string
  type: 'chat' | 'embedding' | 'image' | 'completion'
  maxOutputTokens?: number
  contextWindow?: number
  modality: {
    input: string[]
    output: string[]
  }
  features: ModelFeatures
  pricing?: ModelPricing
  verified?: boolean
  lastUpdated?: string // ISO date string
}

export interface Provider {
  id: string
  name: string
  modelCount: number
}

export function formatPrice(price: number | undefined): string {
  if (price === undefined || price === null) return '—'
  if (price === 0) return 'Free'
  if (price < 0.01) return `$${price.toFixed(4)}`
  if (price < 1) return `$${price.toFixed(2)}`
  return `$${price.toFixed(2)}`
}

export function formatContextWindow(tokens: number | undefined): string {
  if (!tokens) return '—'
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K`
  return tokens.toString()
}

// Format additional unit price (prices are stored in cents * 100, so divide by 100 for cents)
export function formatAdditionalPrice(price: number): string {
  // The JSON stores prices as cents × 100 (e.g., 100 = $1, 25 = $0.25)
  const cents = price / 100
  if (cents >= 1) return `$${cents.toFixed(2)}`
  if (cents >= 0.01) return `${cents.toFixed(2)}¢`
  return `${(cents * 100).toFixed(4)}¢`
}

// Format the display name for additional units
export function formatUnitDisplayName(name: string): string {
  const displayNames: Record<string, string> = {
    'web_search': 'Web Search',
    'file_search': 'File Search',
    'search': 'Search',
    'thinking_token': 'Thinking',
    'image_token': 'Image Token',
    'image_1k': 'Image (1K)',
    'megapixels': 'Megapixels',
    'video_seconds': 'Video (sec)',
    'video_duration_seconds_720_1280': 'Video 720p',
    'video_duration_seconds_1280_720': 'Video 720p',
    'video_duration_seconds_1024_1792': 'Video 1024×1792',
    'video_duration_seconds_1792_1024': 'Video 1792×1024',
    'request_audio_token': 'Audio In',
    'response_audio_token': 'Audio Out',
    'routing_units': 'Routing',
    'input_image': 'Image Input',
    'input_video_essential': 'Video Essential',
    'input_video_standard': 'Video Standard',
    'input_video_plus': 'Video Plus',
    'web_search_low_context': 'Web Search (Low)',
    'web_search_medium_context': 'Web Search (Med)',
    'web_search_high_context': 'Web Search (High)',
    'default_steps': 'Default Steps',
  }
  return displayNames[name] || name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Get category for additional unit
export function getUnitCategory(name: string): AdditionalUnit['category'] {
  if (name.includes('search')) return 'search'
  if (name.includes('audio')) return 'audio'
  if (name.includes('video')) return 'video'
  if (name.includes('image') || name.includes('megapixels')) return 'image'
  if (name.includes('thinking')) return 'thinking'
  return 'other'
}

