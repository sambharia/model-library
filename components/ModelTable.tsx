'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Wrench, 
  Brain,
  Copy,
  Check,
  ArrowUpDown,
  X,
  SlidersHorizontal,
  ExternalLink,
  Globe,
  Headphones,
  Video,
  Image,
  Sparkles,
  Zap
} from 'lucide-react'
import Fuse from 'fuse.js'
import { Model, Provider, formatPrice, AdditionalUnit, formatAdditionalPrice } from '@/lib/types'
import { getProviderColor } from '@/lib/gradients'
import { PRIORITY_PROVIDERS } from '@/lib/models'

interface ModelTableProps {
  models: Model[]
  providers: Provider[]
}

type SortField = 'provider' | 'name' | 'inputPrice' | 'outputPrice' | 'cacheRead' | 'cacheWrite'
type SortDirection = 'asc' | 'desc'

export default function ModelTable({ models, providers }: ModelTableProps) {
  const [search, setSearch] = useState('')
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('provider')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Fuse.js for fuzzy search
  const fuse = useMemo(() => new Fuse(models, {
    keys: ['id', 'name', 'provider', 'providerDisplayName'],
    threshold: 0.3,
    ignoreLocation: true,
  }), [models])

  // Filter and sort models
  const filteredModels = useMemo(() => {
    let result = models

    // Apply search
    if (search.trim()) {
      const searchResults = fuse.search(search.trim())
      result = searchResults.map(r => r.item)
    }

    // Apply provider filter
    if (selectedProviders.length > 0) {
      result = result.filter(m => selectedProviders.includes(m.provider))
    }

    // Apply feature filters
    if (selectedFeatures.includes('vision')) {
      result = result.filter(m => m.features.vision)
    }
    if (selectedFeatures.includes('tools')) {
      result = result.filter(m => m.features.function_calling)
    }
    if (selectedFeatures.includes('reasoning')) {
      result = result.filter(m => m.features.reasoning)
    }

    // Helper to check if a model has pricing
    const hasPricing = (m: Model) => {
      const inputPrice = m.pricing?.input || 0
      const outputPrice = m.pricing?.output || 0
      return !(inputPrice === 0 && outputPrice === 0)
    }

    // Helper to get provider priority (lower = higher priority)
    const getProviderPriority = (providerId: string) => {
      const idx = PRIORITY_PROVIDERS.indexOf(providerId)
      return idx === -1 ? PRIORITY_PROVIDERS.length : idx
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      // First: models with pricing come before models without pricing
      const aHasPricing = hasPricing(a)
      const bHasPricing = hasPricing(b)
      if (aHasPricing !== bHasPricing) {
        return aHasPricing ? -1 : 1
      }

      let comparison = 0
      
      switch (sortField) {
        case 'provider':
          // Sort by priority first, then alphabetically
          const aPriority = getProviderPriority(a.provider)
          const bPriority = getProviderPriority(b.provider)
          if (aPriority !== bPriority) {
            comparison = aPriority - bPriority
          } else {
            comparison = a.providerDisplayName.localeCompare(b.providerDisplayName)
          }
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'inputPrice':
          comparison = (a.pricing?.input || 0) - (b.pricing?.input || 0)
          break
        case 'outputPrice':
          comparison = (a.pricing?.output || 0) - (b.pricing?.output || 0)
          break
        case 'cacheRead':
          comparison = (a.pricing?.cached_input || 0) - (b.pricing?.cached_input || 0)
          break
        case 'cacheWrite':
          comparison = (a.pricing?.cache_write || 0) - (b.pricing?.cache_write || 0)
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [models, search, selectedProviders, selectedFeatures, sortField, sortDirection, fuse])

  // Get models with additional pricing
  const modelsWithExtras = useMemo(() => {
    return filteredModels.filter(m => m.pricing?.additional && m.pricing.additional.length > 0)
  }, [filteredModels])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleProvider = (providerId: string) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(p => p !== providerId)
        : [...prev, providerId]
    )
  }

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    )
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const clearFilters = () => {
    setSelectedProviders([])
    setSelectedFeatures([])
    setSearch('')
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-3 h-3 text-accent-primary" /> 
      : <ChevronDown className="w-3 h-3 text-accent-primary" />
  }

  // Get icon for additional unit category
  const getCategoryIcon = (category: AdditionalUnit['category']) => {
    switch (category) {
      case 'search': return <Globe className="w-3.5 h-3.5" />
      case 'audio': return <Headphones className="w-3.5 h-3.5" />
      case 'video': return <Video className="w-3.5 h-3.5" />
      case 'image': return <Image className="w-3.5 h-3.5" />
      case 'thinking': return <Sparkles className="w-3.5 h-3.5" />
      default: return <Zap className="w-3.5 h-3.5" />
    }
  }

  const hasActiveFilters = selectedProviders.length > 0 || selectedFeatures.length > 0 || search.trim()
  const activeFilterCount = selectedProviders.length + selectedFeatures.length + (search ? 1 : 0)

  return (
    <div className="model-table-section">
      {/* Search and Filter Bar */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-sm font-medium transition-all ${
              showFilters || hasActiveFilters
                ? 'border-accent-primary/50 bg-accent-primary/10 text-accent-primary'
                : 'border-border-primary bg-bg-secondary text-text-secondary hover:text-text-primary hover:border-border-hover'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-accent-primary text-bg-base text-xs flex items-center justify-center font-medium">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-text-muted hover:text-accent-primary transition-colors"
            >
              Clear
            </button>
          )}

          {/* Results Count */}
          <div className="ml-auto text-sm text-text-muted font-mono">
            {filteredModels.length.toLocaleString()}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="p-4 rounded-xl bg-bg-secondary border border-border-primary space-y-4 animate-fade-in">
            {/* Provider Filter */}
            <div>
              <label className="label mb-2 block">
                Providers
              </label>
              <div className="flex flex-wrap gap-2">
                {providers.slice(0, 15).map(provider => {
                  const providerStyle = getProviderColor(provider.id)
                  const isSelected = selectedProviders.includes(provider.id)
                  return (
                    <button
                      key={provider.id}
                      onClick={() => toggleProvider(provider.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                        isSelected
                          ? 'bg-bg-elevated border border-border-hover text-text-primary'
                          : 'bg-bg-primary border border-border-secondary text-text-secondary hover:border-border-primary hover:text-text-primary'
                      }`}
                    >
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: providerStyle.color }}
                      />
                      {provider.name}
                      <span className="text-text-muted text-xs">({provider.modelCount})</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Feature Filter */}
            <div>
              <label className="label mb-2 block">
                Features
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleFeature('vision')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                    selectedFeatures.includes('vision')
                      ? 'badge-vision'
                      : 'bg-bg-primary border border-border-secondary text-text-secondary hover:border-border-primary hover:text-text-primary'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Vision
                </button>
                <button
                  onClick={() => toggleFeature('tools')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                    selectedFeatures.includes('tools')
                      ? 'badge-tools'
                      : 'bg-bg-primary border border-border-secondary text-text-secondary hover:border-border-primary hover:text-text-primary'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Tools
                </button>
                <button
                  onClick={() => toggleFeature('reasoning')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                    selectedFeatures.includes('reasoning')
                      ? 'badge-reasoning'
                      : 'bg-bg-primary border border-border-secondary text-text-secondary hover:border-border-primary hover:text-text-primary'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" />
                  Reasoning
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Pricing Table */}
      <div className="rounded-xl border border-border-primary overflow-hidden bg-bg-primary">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th 
                  className="cursor-pointer hover:bg-bg-hover transition-colors"
                  onClick={() => handleSort('provider')}
                >
                  <div className="flex items-center gap-1.5">
                    Provider
                    <SortIcon field="provider" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer hover:bg-bg-hover transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1.5">
                    Model ID
                    <SortIcon field="name" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer hover:bg-bg-hover transition-colors"
                  onClick={() => handleSort('inputPrice')}
                >
                  <div className="flex items-center gap-1.5">
                    Input $/M
                    <SortIcon field="inputPrice" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer hover:bg-bg-hover transition-colors"
                  onClick={() => handleSort('outputPrice')}
                >
                  <div className="flex items-center gap-1.5">
                    Output $/M
                    <SortIcon field="outputPrice" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer hover:bg-bg-hover transition-colors"
                  onClick={() => handleSort('cacheRead')}
                >
                  <div className="flex items-center gap-1.5">
                    Cache Read $/M
                    <SortIcon field="cacheRead" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer hover:bg-bg-hover transition-colors"
                  onClick={() => handleSort('cacheWrite')}
                >
                  <div className="flex items-center gap-1.5">
                    Cache Write $/M
                    <SortIcon field="cacheWrite" />
                  </div>
                </th>
                <th>Features</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map((model) => {
                const providerStyle = getProviderColor(model.provider)
                return (
                  <tr key={`${model.provider}-${model.id}`} className="group">
                    <td>
                      <Link 
                        href={`/models/${model.provider}`}
                        className="inline-flex items-center gap-2 hover:text-accent-primary transition-colors group/provider"
                      >
                        <span 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: providerStyle.color }}
                        />
                        <span className="text-text-secondary group-hover/provider:text-accent-primary transition-colors">
                          {model.providerDisplayName}
                        </span>
                        <ExternalLink className="w-3 h-3 text-text-faint group-hover/provider:text-accent-primary transition-colors" />
                      </Link>
                    </td>
                    <td>
                      <Link 
                        href={`/models/${encodeURIComponent(model.provider)}/${encodeURIComponent(model.id)}`}
                        className="inline-flex items-center gap-2 font-medium text-text-primary hover:text-accent-primary transition-colors group/model"
                      >
                        {model.id}
                        <ExternalLink className="w-3 h-3 text-text-faint group-hover/model:text-accent-primary transition-colors" />
                      </Link>
                    </td>
                    <td className="font-mono">
                      <span className="text-text-primary">{formatPrice(model.pricing?.input)}</span>
                    </td>
                    <td className="font-mono">
                      <span className="text-text-primary">{formatPrice(model.pricing?.output)}</span>
                    </td>
                    <td className="font-mono">
                      <span className="text-text-primary">{formatPrice(model.pricing?.cached_input)}</span>
                    </td>
                    <td className="font-mono">
                      <span className="text-text-primary">{formatPrice(model.pricing?.cache_write)}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {model.features.vision && (
                          <span className="badge badge-vision" title="Vision">
                            <Eye className="w-3 h-3" />
                          </span>
                        )}
                        {model.features.function_calling && (
                          <span className="badge badge-tools" title="Tool Calling">
                            <Wrench className="w-3 h-3" />
                          </span>
                        )}
                        {model.features.reasoning && (
                          <span className="badge badge-reasoning" title="Reasoning">
                            <Brain className="w-3 h-3" />
                          </span>
                        )}
                        {!model.features.vision && !model.features.function_calling && !model.features.reasoning && (
                          <span className="text-text-faint">—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => copyToClipboard(model.id, model.id)}
                        className="p-1.5 rounded-md hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-all opacity-0 group-hover:opacity-100"
                        title="Copy model ID"
                      >
                        {copiedId === model.id ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredModels.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-text-muted mb-3">No models found</p>
            <button 
              onClick={clearFilters}
              className="text-sm text-accent-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Additional Pricing Section */}
      {modelsWithExtras.length > 0 && (
        <div className="mt-8">
          <h3 className="heading-md text-text-primary mb-4">
            Additional Pricing
            <span className="ml-2 text-sm font-normal text-text-muted">
              ({modelsWithExtras.length} models with extra costs)
            </span>
          </h3>
          <div className="rounded-xl border border-border-primary overflow-hidden bg-bg-primary">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Model ID</th>
                    <th>Unit Type</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {modelsWithExtras.flatMap((model) => {
                    const providerStyle = getProviderColor(model.provider)
                    return (model.pricing?.additional || []).map((unit, idx) => (
                      <tr key={`${model.provider}-${model.id}-${unit.name}`}>
                        {idx === 0 ? (
                          <>
                            <td rowSpan={model.pricing?.additional?.length}>
                              <div className="flex items-center gap-2">
                                <span 
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: providerStyle.color }}
                                />
                                <span className="text-text-secondary">
                                  {model.providerDisplayName}
                                </span>
                              </div>
                            </td>
                            <td rowSpan={model.pricing?.additional?.length}>
                              <Link 
                                href={`/models/${encodeURIComponent(model.provider)}/${encodeURIComponent(model.id)}`}
                                className="text-text-primary hover:text-accent-primary transition-colors"
                              >
                                {model.id}
                              </Link>
                            </td>
                          </>
                        ) : null}
                        <td>
                          <div className="flex items-center gap-2">
                            <span className={`badge badge-${unit.category}`}>
                              {getCategoryIcon(unit.category)}
                            </span>
                            <span className="text-text-secondary">{unit.displayName}</span>
                          </div>
                        </td>
                        <td className="font-mono text-text-primary">
                          {formatAdditionalPrice(unit.price)}
                        </td>
                      </tr>
                    ))
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
