'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Github, ExternalLink, Menu, X, Star } from 'lucide-react'
import { useState } from 'react'

interface HeroProps {
  modelCount?: number
  providerCount?: number
}

// How to Use Modal
function HowToUseModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1A1918] border border-white/10 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#1A1918] border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white uppercase tracking-wide">How to Use</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6 text-[#EDECEC]/90">
          <p>
            This is a comprehensive open-source database of AI model specifications, pricing, and features.
          </p>
          
          <p>
            There&apos;s no single database with information about all the available AI models. We started this as a community-contributed project to address this. The data powers{' '}
            <a 
              href="https://github.com/Portkey-AI/gateway" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white underline decoration-dotted underline-offset-2 hover:decoration-solid"
            >
              Portkey&apos;s AI Gateway
            </a>.
          </p>

          {/* API Section */}
          <div>
            <h3 className="text-white font-semibold text-base mb-2">API</h3>
            <p className="mb-3">You can access this data through a free API — no authentication required.</p>
            <div className="bg-[#0D0D0C] rounded-lg p-4 font-mono text-sm">
              <span className="text-white/50">curl </span>
              <a 
                href="https://api.portkey.ai/model-configs/pricing/openai/gpt-4o"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline decoration-dotted underline-offset-2 hover:decoration-solid"
              >
                https://api.portkey.ai/model-configs/pricing/openai/gpt-4o
              </a>
            </div>
            <p className="mt-3 text-sm text-[#EDECEC]/70">
              Use the <span className="text-white font-medium">Model ID</span> field to do a lookup on any model. 
              Replace <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">{'{provider}'}</code> and <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">{'{model}'}</code> in the URL.
            </p>
          </div>

          {/* API Endpoints */}
          <div>
            <h3 className="text-white font-semibold text-base mb-2">API Endpoints</h3>
            <div className="bg-[#0D0D0C] rounded-lg p-4 font-mono text-sm space-y-2">
              <div>
                <span className="text-white/50"># Get pricing config</span>
                <br />
                <span className="text-white">/model-configs/pricing/{'{provider}'}/{'{model}'}</span>
              </div>
              <div>
                <span className="text-white/50"># Get general config</span>
                <br />
                <span className="text-white">/model-configs/general/{'{provider}'}/{'{model}'}</span>
              </div>
            </div>
          </div>

          {/* Quick Start */}
          <div>
            <h3 className="text-white font-semibold text-base mb-2">Quick Start</h3>
            <div className="bg-[#0D0D0C] rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre className="text-white/90">{`// JavaScript
const response = await fetch(
  'https://api.portkey.ai/model-configs/pricing/openai/gpt-4o'
);
const pricing = await response.json();

const inputCost = tokens.input * pricing.pay_as_you_go.request_token.price;
const outputCost = tokens.output * pricing.pay_as_you_go.response_token.price;`}</pre>
            </div>
          </div>

          {/* Contribute Section */}
          <div>
            <h3 className="text-white font-semibold text-base mb-2">Contribute</h3>
            <p>
              The data is stored in the{' '}
              <a 
                href="https://github.com/portkey-ai/models" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white underline decoration-dotted underline-offset-2 hover:decoration-solid"
              >
                GitHub repo
              </a>
              {' '}as JSON files, organized by provider and model.
            </p>
            <p className="mt-2">
              We need your help keeping this up to date. Feel free to edit the data and submit a pull request. Refer to the{' '}
              <a 
                href="https://github.com/portkey-ai/models#readme" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white underline decoration-dotted underline-offset-2 hover:decoration-solid"
              >
                README
              </a>
              {' '}for more information.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between text-sm text-[#EDECEC]/50">
          <a 
            href="https://github.com/portkey-ai/models" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Edit on GitHub
          </a>
          <span>
            Built by{' '}
            <a 
              href="https://portkey.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Portkey
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}

// Integrated Header for Hero
function HeroHeader({ onHowToUseClick }: { onHowToUseClick: () => void }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems: { href: string; label: string }[] = []

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header className="absolute top-0 left-0 right-0 h-14 z-50">
      <div className="max-w-[1400px] mx-auto h-full px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image 
            src="/assets/Full Logo Light.png" 
            alt="Portkey" 
            width={100} 
            height={24}
            className="h-6 w-auto opacity-90 group-hover:opacity-100 transition-opacity"
          />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isActive(item.href)
                  ? 'text-text-primary bg-white/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <a 
            href="https://portkey.ai/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all text-sm font-medium"
          >
            Docs
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
          <a 
            href="https://github.com/portkey-ai/models" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all text-sm font-medium"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <button 
            onClick={onHowToUseClick}
            className="btn btn-primary btn-sm"
          >
            How to Use
          </button>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-bg-base/95 backdrop-blur-xl border-b border-border-secondary">
          <nav className="flex flex-col p-4 gap-1">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? 'text-text-primary bg-bg-elevated'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

export default function Hero({ modelCount = 2334, providerCount = 40 }: HeroProps) {
  const [showHowToUse, setShowHowToUse] = useState(false)

  return (
    <section className="relative min-h-[57.67vh] overflow-hidden bg-[#100E0C]">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Left blob - Purple/Blue */}
        <div 
          className="absolute -left-[20%] top-[5%] w-[60%] h-[80%] rounded-full blur-[120px] opacity-60 animate-blob-1"
          style={{
            background: 'linear-gradient(135deg, #66668F 0%, #3384B3 100%)',
          }}
        />
        
        {/* Top right blob - Red/Purple */}
        <div 
          className="absolute right-[5%] -top-[20%] w-[50%] h-[60%] rounded-full blur-[120px] opacity-50 animate-blob-2"
          style={{
            background: 'linear-gradient(135deg, #C62E42 0%, #904D6C 100%)',
          }}
        />
        
        {/* Right blob - Purple/Blue */}
        <div 
          className="absolute -right-[15%] top-[30%] w-[50%] h-[70%] rounded-full blur-[120px] opacity-40 animate-blob-3"
          style={{
            background: 'linear-gradient(135deg, #66668F 0%, #3384B3 100%)',
          }}
        />

        {/* Additional subtle blob for depth */}
        <div 
          className="absolute left-[30%] top-[60%] w-[40%] h-[50%] rounded-full blur-[150px] opacity-30 animate-blob-4"
          style={{
            background: 'linear-gradient(135deg, #904D6C 0%, #66668F 100%)',
          }}
        />
      </div>

      {/* Noise texture overlay for depth */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <HeroHeader onHowToUseClick={() => setShowHowToUse(true)} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[51vh] px-4 md:px-6 pt-14">
        <div className="max-w-[900px] mx-auto text-center">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#EDECEC] tracking-tight mb-4 leading-[1.1]">
            Portkey Models
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-[#EDECEC]/80 max-w-3xl mx-auto font-medium">
            Accurate pricing for{' '}
            <span className="text-[#EDECEC]">{modelCount.toLocaleString()}+</span> models across{' '}
            <span className="text-[#EDECEC]">{providerCount}+</span> providers
          </p>
          
          {/* CTA Button */}
          <div className="flex justify-center mt-6">
            <a
              href="https://github.com/portkey-ai/models"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 text-[#EDECEC] font-medium text-sm hover:bg-white/15 hover:scale-[1.02] transition-all duration-200 border border-white/10 hover:border-white/20"
            >
              <Star className="w-4 h-4" />
              Star on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade to content */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-base to-transparent pointer-events-none" />

      {/* How to Use Modal */}
      <HowToUseModal isOpen={showHowToUse} onClose={() => setShowHowToUse(false)} />
    </section>
  )
}
