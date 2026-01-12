import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import Header from '@/components/Header'
import ModelTable from '@/components/ModelTable'
import { getModelsByProvider, getProviders } from '@/lib/models'
import { getProviderColor } from '@/lib/gradients'

interface ProviderPageProps {
  params: Promise<{ provider: string }>
}

export async function generateMetadata({ params }: ProviderPageProps): Promise<Metadata> {
  const { provider } = await params
  const providers = await getProviders()
  const providerData = providers.find(p => p.id === provider)
  
  if (!providerData) {
    return { title: 'Provider Not Found' }
  }

  return {
    title: `${providerData.name} Models | AI Model Directory`,
    description: `Explore ${providerData.modelCount} AI models from ${providerData.name}. Compare pricing, features, and capabilities.`,
    openGraph: {
      title: `${providerData.name} Models | AI Model Directory`,
      description: `Explore ${providerData.modelCount} AI models from ${providerData.name}. Compare pricing, features, and capabilities.`,
    },
  }
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { provider } = await params
  const models = await getModelsByProvider(provider)
  const providers = await getProviders()
  const providerData = providers.find(p => p.id === provider)

  if (!providerData || models.length === 0) {
    notFound()
  }

  const providerStyle = getProviderColor(provider)

  return (
    <main className="min-h-screen bg-bg-base" style={{ backgroundImage: 'none' }}>
      <Header />
      
      <div className="pt-20 px-4 md:px-6 max-w-[1400px] mx-auto pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-text-muted mb-8">
          <Link href="/" className="hover:text-text-primary transition-colors">Models</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-text-secondary">{providerData.name}</span>
        </nav>

        {/* Provider Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg"
              style={{ backgroundColor: providerStyle.color }}
            >
              {providerData.name.charAt(0)}
            </div>
            <div>
              <h1 className="display-md text-text-primary">
                {providerData.name}
              </h1>
              <p className="text-text-secondary text-sm">
                {providerData.modelCount} models available
              </p>
            </div>
          </div>
        </div>

        {/* Models Table */}
        <ModelTable models={models} providers={providers} />
      </div>
    </main>
  )
}

export async function generateStaticParams() {
  const providers = await getProviders()
  return providers.map((provider) => ({
    provider: provider.id,
  }))
}
