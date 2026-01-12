import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Eye, Wrench, Brain, ChevronRight, Star, Github, Globe, Headphones, Video, Image, Sparkles, Zap } from 'lucide-react'
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

  return (
    <main className="min-h-screen bg-bg-base">
      <Header />
      
      <div className="pt-20 px-4 md:px-6 max-w-[1200px] mx-auto pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-text-muted mb-8">
          <Link href="/" className="hover:text-text-primary transition-colors">Models</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/models/${provider}`} className="hover:text-text-primary transition-colors">
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

            {/* Token Pricing */}
            <div className="space-y-4 mb-8">
              <h2 className="heading-md text-text-primary">Token Pricing</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-bg-primary border border-border-primary">
                  <div className="label mb-1">Input</div>
                  <div className="text-2xl font-semibold text-text-primary font-mono">
                    {formatPrice(model.pricing?.input)}
                    <span className="text-sm text-text-muted font-normal ml-1">/M</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary border border-border-primary">
                  <div className="label mb-1">Output</div>
                  <div className="text-2xl font-semibold text-text-primary font-mono">
                    {formatPrice(model.pricing?.output)}
                    <span className="text-sm text-text-muted font-normal ml-1">/M</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary border border-border-primary">
                  <div className="label mb-1">Cache Read</div>
                  <div className="text-xl font-semibold text-text-primary font-mono">
                    {formatPrice(model.pricing?.cached_input)}
                    {model.pricing?.cached_input ? <span className="text-sm text-text-muted font-normal ml-1">/M</span> : null}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary border border-border-primary">
                  <div className="label mb-1">Cache Write</div>
                  <div className="text-xl font-semibold text-text-primary font-mono">
                    {formatPrice(model.pricing?.cache_write)}
                    {model.pricing?.cache_write ? <span className="text-sm text-text-muted font-normal ml-1">/M</span> : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Pricing */}
            {model.pricing?.additional && model.pricing.additional.length > 0 && (
              <div className="space-y-4 mb-8">
                <h2 className="heading-md text-text-primary">Additional Pricing</h2>
                <div className="rounded-xl bg-bg-primary border border-border-primary overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-primary">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Unit Type</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Price</th>
                      </tr>
                    </thead>
                    <tbody>
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
                          <tr key={idx} className="border-b border-border-secondary last:border-b-0">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`badge badge-${unit.category}`}>
                                  {getCategoryIcon(unit.category)}
                                </span>
                                <span className="text-text-secondary">{unit.displayName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-text-primary">
                              {formatAdditionalPrice(unit.price)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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

            {/* Star on GitHub CTA */}
            <a
              href="https://github.com/portkey-ai/models"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-bg-primary to-bg-elevated border border-border-primary hover:border-border-secondary transition-all"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-bg-elevated group-hover:bg-white/10 transition-colors">
                <Github className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">
                  Star this repo
                </div>
                <div className="text-xs text-text-muted">
                  Help us keep this data up to date
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-elevated group-hover:bg-white/10 transition-colors">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">Star</span>
              </div>
            </a>
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
