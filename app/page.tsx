import Hero from '@/components/Hero'
import LogoRibbon from '@/components/LogoRibbon'
import ModelTable from '@/components/ModelTable'
import { getAllModels, getProviders } from '@/lib/models'

export default async function Home() {
  const models = await getAllModels()
  const providers = await getProviders()

  return (
    <main className="min-h-screen bg-bg-base relative">
      <Hero 
        modelCount={models.length} 
        providerCount={providers.length}
      />
      <LogoRibbon />
      <section className="model-table-section px-4 md:px-6 py-12 max-w-[1400px] mx-auto">
        <ModelTable models={models} providers={providers} />
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border-secondary py-8 px-4 md:px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-text-muted">
            Open source by{' '}
            <a 
              href="https://portkey.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-accent-primary transition-colors"
            >
              Portkey
            </a>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a 
              href="https://github.com/portkey-ai/gateway" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              GitHub
            </a>
            <a 
              href="https://portkey.ai/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              Documentation
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
