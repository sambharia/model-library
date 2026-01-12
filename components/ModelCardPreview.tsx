'use client'

import { useState, useMemo } from 'react'
import { Link as LinkIcon, Check } from 'lucide-react'
import { Model, formatPrice } from '@/lib/types'

const basePath = '/models'

interface ModelCardPreviewProps {
  model: Model
}

export default function ModelCardPreview({ model }: ModelCardPreviewProps) {
  const [copied, setCopied] = useState(false)
  
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${model.provider}/${model.id}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Get capabilities list
  const capabilities = useMemo(() => {
    const caps = []
    if (model.features.vision) caps.push('Vision')
    if (model.features.function_calling) caps.push('Tool Calling')
    if (model.features.reasoning) caps.push('Reasoning')
    if (model.modality.input.includes('image') && !model.features.vision) caps.push('Multimodal')
    if (caps.length === 0) caps.push('Text Generation')
    return caps.slice(0, 3)
  }, [model])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="heading-md text-text-primary mb-1">Share This Model</h2>
        <p className="text-sm text-text-muted">
          Download or share on social media
        </p>
      </div>

      {/* Card Preview - Hero Gradient Style */}
      <div className="relative rounded-xl overflow-hidden bg-[#100E0C] border border-[rgba(237,236,236,0.1)]">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Left blob - Purple/Blue */}
          <div 
            className="absolute -left-[30%] top-[10%] w-[70%] h-[80%] rounded-full blur-[60px] opacity-50 animate-blob-1"
            style={{
              background: 'linear-gradient(135deg, #66668F 0%, #3384B3 100%)',
            }}
          />
          
          {/* Top right blob - Red/Purple */}
          <div 
            className="absolute right-[0%] -top-[20%] w-[50%] h-[60%] rounded-full blur-[60px] opacity-40 animate-blob-2"
            style={{
              background: 'linear-gradient(135deg, #C62E42 0%, #904D6C 100%)',
            }}
          />
          
          {/* Bottom blob */}
          <div 
            className="absolute left-[20%] bottom-[0%] w-[50%] h-[50%] rounded-full blur-[80px] opacity-30 animate-blob-3"
            style={{
              background: 'linear-gradient(135deg, #904D6C 0%, #66668F 100%)',
            }}
          />
        </div>

        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative p-6">
          {/* Provider */}
          <div className="text-[11px] text-[#EDECEC]/60 tracking-wide uppercase mb-6">
            {model.providerDisplayName}
          </div>

          {/* Model Name - Hero style */}
          <h3 className="text-xl font-semibold text-[#EDECEC] tracking-tight mb-6 leading-tight">
            {model.name || model.id}
          </h3>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-[10px] text-[#EDECEC]/40 tracking-widest uppercase mb-1">Input</div>
              <div className="text-2xl font-semibold text-[#EDECEC] font-mono">
                {formatPrice(model.pricing?.input)}
                <span className="text-sm text-[#EDECEC]/50 font-normal">/M</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#EDECEC]/40 tracking-widest uppercase mb-1">Output</div>
              <div className="text-2xl font-semibold text-[#EDECEC] font-mono">
                {formatPrice(model.pricing?.output)}
                <span className="text-sm text-[#EDECEC]/50 font-normal">/M</span>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div className="flex flex-wrap gap-2 mb-6">
            {capabilities.map((cap) => (
              <span 
                key={cap} 
                className="px-3 py-1.5 rounded-full bg-[#EDECEC]/10 text-[#EDECEC]/80 text-xs font-medium"
              >
                {cap}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2.5 pt-4 border-t border-[#EDECEC]/10">
            <img 
              src={`${basePath}/assets/Full Logo Light.png`}
              alt="Portkey" 
              width={80} 
              height={20}
              className="h-5 w-auto opacity-70"
            />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex gap-3">
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-text-primary text-bg-base font-medium text-sm hover:opacity-90 transition-all"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4" />
              Copy Link
            </>
          )}
        </button>
      </div>
    </div>
  )
}
