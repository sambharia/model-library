import { Model } from '@/lib/types'

interface JsonLdProps {
  model?: Model
  type: 'website' | 'model' | 'organization'
}

export default function JsonLd({ model, type }: JsonLdProps) {
  const baseUrl = 'https://portkey.ai/models'

  if (type === 'website') {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'AI Model Directory',
      description: 'The open source AI model directory. Compare pricing, features, and capabilities across 600+ models from 40+ providers.',
      url: baseUrl,
      publisher: {
        '@type': 'Organization',
        name: 'Portkey',
        url: 'https://portkey.ai',
      },
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
    )
  }

  if (type === 'model' && model) {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: model.id,
      description: `${model.id} by ${model.providerDisplayName}. AI language model with ${model.features.vision ? 'vision, ' : ''}${model.features.function_calling ? 'tool calling, ' : ''}capabilities.`,
      applicationCategory: 'AI/ML',
      operatingSystem: 'Cloud',
      offers: model.pricing ? {
        '@type': 'Offer',
        price: model.pricing.input,
        priceCurrency: model.pricing.currency,
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: model.pricing.input,
          priceCurrency: model.pricing.currency,
          unitText: 'per million tokens',
        },
      } : undefined,
      provider: {
        '@type': 'Organization',
        name: model.providerDisplayName,
      },
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
    )
  }

  if (type === 'organization') {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Portkey',
      url: 'https://portkey.ai',
      logo: `${baseUrl}/assets/Full Logo Light.png`,
      sameAs: [
        'https://github.com/portkey-ai/gateway',
        'https://twitter.com/portkeyai',
      ],
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
    )
  }

  return null
}
