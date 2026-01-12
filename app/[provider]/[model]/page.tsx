import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Eye, Wrench, Brain, ChevronRight } from 'lucide-react'
import Header from '@/components/Header'
import ModelCardPreview from '@/components/ModelCardPreview'
import { getModel, getAllModels } from '@/lib/models'
import { formatPrice, formatContextWindow } from '@/lib/types'
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

  return (
    <main className="min-h-screen bg-bg-base">
      <Header />
      
      <div className="pt-20 px-4 md:px-6 max-w-[1200px] mx-auto pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-text-muted mb-8">
          <Link href="/" className="hover:text-text-primary transition-colors">Models</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/${provider}`} className="hover:text-text-primary transition-colors">
            {model.providerDisplayName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-text-secondary truncate max-w-[200px]">{model.id}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left Column - Model Info */}
          <div>
            {/* Model Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-lg"
                  style={{ backgroundColor: providerStyle.color }}
                >
                  {model.providerDisplayName.charAt(0)}
                </div>
                <span className="text-text-secondary">{model.providerDisplayName}</span>
              </div>
              <h1 className="display-md text-text-primary mb-2">
                {model.id}
              </h1>
              <p className="text-text-muted font-mono text-sm">
                {model.id}
              </p>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="p-4 rounded-xl bg-bg-primary border border-border-primary">
                <div className="label mb-1">Input Price</div>
                <div className="text-2xl font-semibold text-text-primary font-mono">
                  {formatPrice(model.pricing?.input)}
                  <span className="text-sm text-text-muted font-normal ml-1">/M</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-bg-primary border border-border-primary">
                <div className="label mb-1">Output Price</div>
                <div className="text-2xl font-semibold text-text-primary font-mono">
                  {formatPrice(model.pricing?.output)}
                  <span className="text-sm text-text-muted font-normal ml-1">/M</span>
                </div>
              </div>
            </div>

            {/* Specs */}
            <div className="space-y-4 mb-8">
              <h2 className="heading-md text-text-primary">Specifications</h2>
              <div className="grid grid-cols-2 gap-3">
                {model.maxOutputTokens && (
                  <div className="p-3 rounded-lg bg-bg-primary border border-border-primary">
                    <div className="label mb-1">Max Output</div>
                    <div className="text-text-primary font-mono text-sm">
                      {formatContextWindow(model.maxOutputTokens)}
                    </div>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-bg-primary border border-border-primary">
                  <div className="label mb-1">Type</div>
                  <div className="text-text-primary text-sm capitalize">{model.type}</div>
                </div>
                {model.pricing?.cached_input && (
                  <div className="p-3 rounded-lg bg-bg-primary border border-border-primary">
                    <div className="label mb-1">Cached Input</div>
                    <div className="text-text-primary font-mono text-sm">
                      {formatPrice(model.pricing.cached_input)}/M
                    </div>
                  </div>
                )}
                {model.pricing?.cache_write && (
                  <div className="p-3 rounded-lg bg-bg-primary border border-border-primary">
                    <div className="label mb-1">Cache Write</div>
                    <div className="text-text-primary font-mono text-sm">
                      {formatPrice(model.pricing.cache_write)}/M
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <h2 className="heading-md text-text-primary">Features</h2>
              <div className="flex flex-wrap gap-2">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  model.features.vision 
                    ? 'badge-vision' 
                    : 'bg-bg-primary border border-border-primary text-text-muted'
                }`}>
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">Vision</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  model.features.function_calling 
                    ? 'badge-tools' 
                    : 'bg-bg-primary border border-border-primary text-text-muted'
                }`}>
                  <Wrench className="w-4 h-4" />
                  <span className="text-sm font-medium">Tool Calling</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  model.features.reasoning 
                    ? 'badge-reasoning' 
                    : 'bg-bg-primary border border-border-primary text-text-muted'
                }`}>
                  <Brain className="w-4 h-4" />
                  <span className="text-sm font-medium">Reasoning</span>
                </div>
              </div>
            </div>

            {/* Modalities */}
            <div className="space-y-4">
              <h2 className="heading-md text-text-primary">Modalities</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-bg-primary border border-border-primary">
                  <div className="label mb-2">Input</div>
                  <div className="flex flex-wrap gap-1.5">
                    {model.modality.input.map(m => (
                      <span key={m} className="px-2 py-1 rounded-md bg-bg-elevated text-text-secondary text-xs capitalize">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary border border-border-primary">
                  <div className="label mb-2">Output</div>
                  <div className="flex flex-wrap gap-1.5">
                    {model.modality.output.map(m => (
                      <span key={m} className="px-2 py-1 rounded-md bg-bg-elevated text-text-secondary text-xs capitalize">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Card Preview */}
          <div>
            <ModelCardPreview model={model} />
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
