import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Globe, Headphones, Video, Image, Sparkles, Zap, Box, MessageSquare, Layers, ArrowRight, Check, X as XIcon } from 'lucide-react'
import Header from '@/components/Header'
import ModelCardPreview from '@/components/ModelCardPreview'
import { getModel, getAllModels } from '@/lib/models'
import { formatPrice, formatContextWindow, AdditionalUnit, formatAdditionalPrice } from '@/lib/types'
import { getProviderColor } from '@/lib/gradients'

interface ModelPageProps {
  params: Promise<{ provider: string; model: string }>
}

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const { provider, model: modelId } = await params
  const model = await getModel(provider, modelId)
  
  if (!model) {
    return { title: 'Model Not Found' }
  }

  const description = `${model.id} by ${model.providerDisplayName}. Input: ${formatPrice(model.pricing?.input)}/M, Output: ${formatPrice(model.pricing?.output)}/M. ${model.features.vision ? 'Vision, ' : ''}${model.features.function_calling ? 'Tool Calling, ' : ''}${model.maxOutputTokens ? formatContextWindow(model.maxOutputTokens) + ' output tokens' : ''}`

  return {
    title: `${model.id} | ${model.providerDisplayName} | AI Model Directory`,
    description,
    openGraph: {
      title: `${model.id} | ${model.providerDisplayName}`,
      description,
      images: [`/api/og/model/${provider}/${modelId}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${model.id} | ${model.providerDisplayName}`,
      description,
      images: [`/api/og/model/${provider}/${modelId}`],
    },
  }
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { provider, model: modelId } = await params
  const model = await getModel(provider, modelId)

  if (!model) {
    notFound()
  }

  const providerStyle = getProviderColor(provider)

  // Feature check component
  const FeatureItem = ({ label, supported }: { label: string; supported: boolean }) => (
    <div className="flex items-center gap-3 py-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${supported ? 'bg-emerald-500/10' : 'bg-bg-elevated'}`}>
        {supported ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <XIcon className="w-4 h-4 text-text-muted" />
        )}
      </div>
      <span className={`text-sm ${supported ? 'text-text-primary' : 'text-text-muted'}`}>{label}</span>
    </div>
  )

  return (
    <main className="min-h-screen bg-bg-base">
      <Header />
      
      <div className="pt-20 px-4 md:px-6 max-w-[1200px] mx-auto pb-16">
        {/* Back link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Models
        </Link>

        {/* Model Header - OpenAI Style */}
        <div className="mb-8 pb-8 border-b border-border-primary">
          <div className="flex items-start gap-4 mb-6">
            {/* Provider Icon */}
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
              style={{ backgroundColor: providerStyle.color }}
            >
              {model.providerDisplayName.charAt(0)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-semibold text-text-primary truncate">
                  {model.id}
                </h1>
              </div>
              <p className="text-text-muted text-sm">
                {model.providerDisplayName}
              </p>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {model.contextWindow && (
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-text-muted" />
                <span className="text-text-secondary">{formatContextWindow(model.contextWindow)} context</span>
              </div>
            )}
            {model.maxOutputTokens && (
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-text-muted" />
                <span className="text-text-secondary">{formatContextWindow(model.maxOutputTokens)} max output</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-text-muted" />
              <span className="text-text-secondary capitalize">{model.type}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pricing Section - Card Style */}
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Pricing</h2>
              <p className="text-sm text-text-muted mb-4">
                Per 1M tokens
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-bg-primary border border-border-primary">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Input</div>
                  <div className="text-xl font-semibold text-text-primary font-mono">
                    {formatPrice(model.pricing?.input)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary border border-border-primary">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Cached input</div>
                  <div className="text-xl font-semibold text-text-primary font-mono">
                    {formatPrice(model.pricing?.cached_input)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary border border-border-primary">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Output</div>
                  <div className="text-xl font-semibold text-text-primary font-mono">
                    {formatPrice(model.pricing?.output)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary border border-border-primary">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Cache write</div>
                  <div className="text-xl font-semibold text-text-primary font-mono">
                    {formatPrice(model.pricing?.cache_write)}
                  </div>
                </div>
              </div>
            </section>

            {/* Additional Pricing */}
            {model.pricing?.additional && model.pricing.additional.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-text-primary mb-4">Additional Pricing</h2>
                <div className="rounded-xl bg-bg-primary border border-border-primary divide-y divide-border-secondary">
                  {model.pricing.additional.map((unit: AdditionalUnit, idx: number) => {
                    const getCategoryIcon = (category: AdditionalUnit['category']) => {
                      switch (category) {
                        case 'search': return <Globe className="w-4 h-4" />
                        case 'audio': return <Headphones className="w-4 h-4" />
                        case 'video': return <Video className="w-4 h-4" />
                        case 'image': return <Image className="w-4 h-4" />
                        case 'thinking': return <Sparkles className="w-4 h-4" />
                        default: return <Zap className="w-4 h-4" />
                      }
                    }
                    return (
                      <div key={idx} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center badge-${unit.category}`}>
                            {getCategoryIcon(unit.category)}
                          </div>
                          <span className="text-sm text-text-secondary">{unit.displayName}</span>
                        </div>
                        <span className="text-sm font-mono text-text-primary">
                          {formatAdditionalPrice(unit.price)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Modalities */}
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Modalities</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-bg-primary border border-border-primary p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-text-muted" />
                    <span className="text-xs text-text-muted uppercase tracking-wider">Input</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {model.modality.input.map(m => (
                      <span key={m} className="px-3 py-1.5 rounded-lg bg-bg-elevated text-text-secondary text-sm capitalize">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-bg-primary border border-border-primary p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowRight className="w-4 h-4 text-text-muted" />
                    <span className="text-xs text-text-muted uppercase tracking-wider">Output</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {model.modality.output.map(m => (
                      <span key={m} className="px-3 py-1.5 rounded-lg bg-bg-elevated text-text-secondary text-sm capitalize">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section - OpenAI Style */}
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Features</h2>
              <div className="rounded-xl bg-bg-primary border border-border-primary divide-y divide-border-secondary">
                <div className="flex items-center justify-between px-4">
                  <FeatureItem label="Streaming" supported={model.features.streaming ?? true} />
                </div>
                <div className="flex items-center justify-between px-4">
                  <FeatureItem label="Function calling" supported={model.features.function_calling ?? false} />
                </div>
                <div className="flex items-center justify-between px-4">
                  <FeatureItem label="Vision" supported={model.features.vision ?? false} />
                </div>
                <div className="flex items-center justify-between px-4">
                  <FeatureItem label="Reasoning" supported={model.features.reasoning ?? false} />
                </div>
                <div className="flex items-center justify-between px-4">
                  <FeatureItem label="JSON mode" supported={model.features.json_mode ?? false} />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Share Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ModelCardPreview model={model} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export async function generateStaticParams() {
  const models = await getAllModels()
  return models.map((model) => ({
    provider: model.provider,
    model: model.id,
  }))
}
