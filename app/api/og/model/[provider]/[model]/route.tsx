import { ImageResponse } from '@vercel/og'
import { getModel } from '@/lib/models'
import { formatPrice } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string; model: string }> }
) {
  const { provider, model: modelId } = await params
  const model = await getModel(provider, modelId)

  if (!model) {
    return new Response('Model not found', { status: 404 })
  }

  // Get capabilities
  const capabilities = []
  if (model.features.vision) capabilities.push('Vision')
  if (model.features.function_calling) capabilities.push('Tool Calling')
  if (model.features.reasoning) capabilities.push('Reasoning')
  if (model.modality.input.includes('image') && !model.features.vision) capabilities.push('Multimodal')
  if (capabilities.length === 0) capabilities.push('Text Generation')

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          background: '#100E0C',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Gradient Blob - Left Purple/Blue */}
        <div
          style={{
            position: 'absolute',
            left: '-15%',
            top: '5%',
            width: '60%',
            height: '90%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #66668F 0%, #3384B3 100%)',
            filter: 'blur(100px)',
            opacity: 0.5,
          }}
        />
        
        {/* Gradient Blob - Top Right Red/Purple */}
        <div
          style={{
            position: 'absolute',
            right: '5%',
            top: '-20%',
            width: '50%',
            height: '60%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #C62E42 0%, #904D6C 100%)',
            filter: 'blur(100px)',
            opacity: 0.4,
          }}
        />
        
        {/* Gradient Blob - Bottom Right */}
        <div
          style={{
            position: 'absolute',
            right: '-10%',
            bottom: '-10%',
            width: '50%',
            height: '60%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #904D6C 0%, #66668F 100%)',
            filter: 'blur(120px)',
            opacity: 0.35,
          }}
        />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '60px', position: 'relative', zIndex: 1 }}>
          {/* Provider */}
          <div
            style={{
              fontSize: '18px',
              color: 'rgba(237, 236, 236, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '24px',
            }}
          >
            {model.providerDisplayName}
          </div>

          {/* Model Name */}
          <div style={{ fontSize: '56px', fontWeight: 600, color: '#EDECEC', marginBottom: '40px', lineHeight: 1.1 }}>
            {model.name || model.id}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '60px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '14px', color: 'rgba(237, 236, 236, 0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>
                Input
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: '48px', fontWeight: 600, color: '#EDECEC', fontFamily: 'monospace' }}>
                  {formatPrice(model.pricing?.input)}
                </span>
                <span style={{ fontSize: '20px', color: 'rgba(237, 236, 236, 0.5)', marginLeft: '4px' }}>/M</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '14px', color: 'rgba(237, 236, 236, 0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>
                Output
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: '48px', fontWeight: 600, color: '#EDECEC', fontFamily: 'monospace' }}>
                  {formatPrice(model.pricing?.output)}
                </span>
                <span style={{ fontSize: '20px', color: 'rgba(237, 236, 236, 0.5)', marginLeft: '4px' }}>/M</span>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: 'auto' }}>
            {capabilities.slice(0, 4).map((cap) => (
              <div
                key={cap}
                style={{
                  padding: '10px 20px',
                  borderRadius: '100px',
                  background: 'rgba(237, 236, 236, 0.1)',
                  color: 'rgba(237, 236, 236, 0.8)',
                  fontSize: '16px',
                  fontWeight: 500,
                }}
              >
                {cap}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '24px', borderTop: '1px solid rgba(237, 236, 236, 0.1)' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px',
                fontWeight: 700,
              }}
            >
              P
            </div>
            <span style={{ fontSize: '18px', color: 'rgba(237, 236, 236, 0.5)' }}>
              portkey.ai/models
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
