'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Github, ExternalLink, Menu, X } from 'lucide-react'
import { useState } from 'react'

const basePath = '/models'

export default function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems: { href: string; label: string }[] = []

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-bg-base/80 backdrop-blur-xl border-b border-border-secondary">
      <div className="max-w-[1400px] mx-auto h-full px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <img 
            src={`${basePath}/assets/Full Logo Light.png`}
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
                  ? 'text-text-primary bg-bg-elevated'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <a 
            href="https://portkey.ai/docs/product/model-catalog/portkey-models" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50 transition-all text-sm font-medium"
          >
            Use the API
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
          <a 
            href="https://portkey.ai/rankings" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50 transition-all text-sm font-medium"
          >
            Trending Models
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
          <a 
            href="https://github.com/portkey-ai/models" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50 transition-all text-sm font-medium"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-bg-base/95 backdrop-blur-xl border-b border-border-secondary">
          <nav className="flex flex-col p-4 gap-1">
            <a 
              href="https://portkey.ai/docs/product/model-catalog/portkey-models"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50 transition-all"
            >
              Use the API
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
            <a 
              href="https://portkey.ai/rankings"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50 transition-all"
            >
              Trending Models
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
