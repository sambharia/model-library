'use client'

import { useState, useMemo, useEffect, Fragment, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  Globe,
  Headphones,
  Video,
  Image,
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  CheckCircle2,
  Clock,
  ArrowDownAZ,
  DollarSign,
  Building2,
} from 'lucide-react'
import Fuse from 'fuse.js'
import { Model, Provider, formatPrice, AdditionalUnit, formatAdditionalPrice } from '@/lib/types'
import { getProviderColor } from '@/lib/gradients'
import { PRIORITY_PROVIDERS, getModelPriority } from '@/lib/models'

interface ModelTableProps {
  models: Model[]
  providers: Provider[]
}

type SortField = 'provider' | 'name' | 'inputPrice' | 'outputPrice' | 'cacheRead' | 'cacheWrite' | 'topModels' | 'lastUpdated' | 'alphabetical'
type SortDirection = 'asc' | 'desc'
type FeatureFilter = 'vision' | 'tools' | 'reasoning'

const PAGE_SIZE = 200

export default function ModelTable({ models, providers }: ModelTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [providerSearch, setProviderSearch] = useState('')
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureFilter[]>([])
  const [sortField, setSortField] = useState<SortField>('topModels')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  
  // Refs for dropdowns
  const providerDropdownRef = useRef<HTMLDivElement>(null)
  const featuresDropdownRef = useRef<HTMLDivElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openDropdown === 'provider' && providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
      if (openDropdown === 'features' && featuresDropdownRef.current && !featuresDropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
      if (openDropdown === 'sort' && sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openDropdown])
  
  // Filter providers based on search
  const filteredProviders = useMemo(() => {
    if (!providerSearch.trim()) return providers
    const searchLower = providerSearch.toLowerCase()
    return providers.filter(p => p.name.toLowerCase().includes(searchLower) || p.id.toLowerCase().includes(searchLower))
  }, [providers, providerSearch])

  // Fuse.js for fuzzy search
  const fuse = useMemo(() => new Fuse(models, {
    keys: ['id', 'name', 'provider', 'providerDisplayName'],
    threshold: 0.3,
    ignoreLocation: true,
  }), [models])

  // Featured providers: top 4 models from each shown first in default sort
  const FEATURED_PROVIDERS = ['openai', 'anthropic', 'google', 'bedrock', 'azure-openai', 'vertex-ai', 'together-ai']
  const MODELS_PER_PROVIDER = 4

  // Pre-compute the featured model keys (top 4 per featured provider)
  const featuredModelMap = useMemo(() => {
    // Map of "provider-modelId" → sort position (0-based across all featured)
    const map = new Map<string, number>()
    let position = 0

    for (const providerId of FEATURED_PROVIDERS) {
      const providerModels = models
        .filter(m => m.provider === providerId)
        .sort((a, b) => {
          // Priority pattern models first
          const aPriority = getModelPriority(a.id)
          const bPriority = getModelPriority(b.id)
          if (aPriority !== -1 && bPriority === -1) return -1
          if (aPriority === -1 && bPriority !== -1) return 1
          if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority
          // Then models with pricing first
          const aHasPrice = (a.pricing?.input || 0) + (a.pricing?.output || 0) > 0
          const bHasPrice = (b.pricing?.input || 0) + (b.pricing?.output || 0) > 0
          if (aHasPrice !== bHasPrice) return aHasPrice ? -1 : 1
          return a.id.localeCompare(b.id)
        })
        .slice(0, MODELS_PER_PROVIDER)

      for (const m of providerModels) {
        map.set(`${m.provider}-${m.id}`, position++)
      }
    }

    return map
  }, [models])

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

    // Apply feature filters (combined)
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

    // Helper for date comparison
    const getUpdatedTime = (m: Model) => m.lastUpdated ? new Date(m.lastUpdated).getTime() : 0

    // Apply sorting
    result = [...result].sort((a, b) => {
      // Always prioritize models with pricing first
      const aHasPricing = hasPricing(a)
      const bHasPricing = hasPricing(b)
      if (aHasPricing !== bHasPricing) {
        return aHasPricing ? -1 : 1
      }

      let comparison = 0
      
      switch (sortField) {
        case 'topModels': {
          // Featured models (top 4 per provider) first, then rest alphabetically
          const aKey = `${a.provider}-${a.id}`
          const bKey = `${b.provider}-${b.id}`
          const aFeatured = featuredModelMap.has(aKey)
          const bFeatured = featuredModelMap.has(bKey)

          if (aFeatured && bFeatured) {
            // Both featured — use pre-computed position
            comparison = featuredModelMap.get(aKey)! - featuredModelMap.get(bKey)!
          } else if (aFeatured !== bFeatured) {
            comparison = aFeatured ? -1 : 1
          } else {
            // Both non-featured — alphabetical by id
            comparison = a.id.localeCompare(b.id)
          }
          break
        }
        case 'lastUpdated': {
          comparison = getUpdatedTime(b) - getUpdatedTime(a)
          if (comparison === 0) comparison = a.id.localeCompare(b.id)
          break
        }
        case 'alphabetical': {
          comparison = a.id.localeCompare(b.id)
          break
        }
        case 'provider': {
          // Sort by provider priority first
          const aProviderPriority = getProviderPriority(a.provider)
          const bProviderPriority = getProviderPriority(b.provider)
          if (aProviderPriority !== bProviderPriority) {
            comparison = aProviderPriority - bProviderPriority
          } else {
            // Same provider — priority models first, then alphabetical
            const aModelPriority = getModelPriority(a.id)
            const bModelPriority = getModelPriority(b.id)
            
            const aIsPriority = aModelPriority !== -1
            const bIsPriority = bModelPriority !== -1
            
            if (aIsPriority && !bIsPriority) {
              comparison = -1
            } else if (!aIsPriority && bIsPriority) {
              comparison = 1
            } else if (aIsPriority && bIsPriority) {
              comparison = aModelPriority - bModelPriority
            } else {
              comparison = a.id.localeCompare(b.id)
            }
          }
          break
        }
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
  }, [models, search, selectedProviders, selectedFeatures, sortField, sortDirection, fuse, featuredModelMap])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedProviders, selectedFeatures, sortField, sortDirection])

  // Calculate pagination
  const totalPages = Math.ceil(filteredModels.length / PAGE_SIZE)
  const showPagination = filteredModels.length > PAGE_SIZE
  
  // Get paginated models
  const paginatedModels = useMemo(() => {
    if (!showPagination) return filteredModels
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredModels.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredModels, currentPage, showPagination])

  const toggleRowExpanded = (modelKey: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(modelKey)) {
        newSet.delete(modelKey)
      } else {
        newSet.add(modelKey)
      }
      return newSet
    })
  }

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
  
  const toggleFeature = (feature: FeatureFilter) => {
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
    setProviderSearch('')
    setSortField('topModels')
    setSortDirection('asc')
  }
  
  const handleRowClick = (model: Model, e: React.MouseEvent) => {
    // Don't navigate if clicking on a link, button, or the expand arrow
    const target = e.target as HTMLElement
    if (target.closest('a') || target.closest('button')) return
    router.push(`/${encodeURIComponent(model.provider)}/${encodeURIComponent(model.id)}`)
  }
  
  // Format relative time
  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
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
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
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

          {/* Provider Dropdown - Searchable */}
          <div className="relative" ref={providerDropdownRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'provider' ? null : 'provider')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedProviders.length > 0
                  ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30'
                  : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-primary hover:border-border-hover'
              }`}
            >
              <Filter className="w-4 h-4" />
              {selectedProviders.length > 0 ? `Providers (${selectedProviders.length})` : 'Provider'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'provider' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'provider' && (
              <div className="absolute top-full left-0 mt-2 w-[280px] rounded-xl bg-bg-secondary border border-border-primary shadow-2xl z-50 animate-fade-in overflow-hidden">
                {/* Search input */}
                <div className="p-2 border-b border-border-secondary">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search providers..."
                      value={providerSearch}
                      onChange={(e) => setProviderSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm bg-bg-primary border border-border-secondary rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
                      autoFocus
                    />
                  </div>
                </div>
                {/* Provider list */}
                <div className="max-h-[280px] overflow-y-auto p-1">
                  {filteredProviders.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-text-muted text-center">No providers found</div>
                  ) : (
                    filteredProviders.map(provider => {
                      const providerStyle = getProviderColor(provider.id)
                      const isSelected = selectedProviders.includes(provider.id)
                      return (
                        <button
                          key={provider.id}
                          onClick={() => toggleProvider(provider.id)}
                          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all text-left ${
                            isSelected
                              ? 'bg-accent-primary/10 text-accent-primary'
                              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                          }`}
                        >
                          <span 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: providerStyle.color }}
                          />
                          <span className="flex-1 truncate">{provider.name}</span>
                          <span className="text-text-muted text-xs tabular-nums">{provider.modelCount}</span>
                          {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                        </button>
                      )
                    })
                  )}
                </div>
                {selectedProviders.length > 0 && (
                  <div className="p-2 border-t border-border-secondary">
                    <button
                      onClick={() => { setSelectedProviders([]); setProviderSearch('') }}
                      className="w-full py-2 text-xs text-text-muted hover:text-accent-primary transition-colors"
                    >
                      Clear selection
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Features Dropdown - Combined */}
          <div className="relative" ref={featuresDropdownRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'features' ? null : 'features')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFeatures.length > 0
                  ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30'
                  : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-primary hover:border-border-hover'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {selectedFeatures.length > 0 ? `Features (${selectedFeatures.length})` : 'Features'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'features' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'features' && (
              <div className="absolute top-full left-0 mt-2 w-[200px] rounded-xl bg-bg-secondary border border-border-primary shadow-2xl z-50 animate-fade-in p-1">
                <button
                  onClick={() => toggleFeature('vision')}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                    selectedFeatures.includes('vision')
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span className="flex-1">Vision</span>
                  {selectedFeatures.includes('vision') && <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => toggleFeature('tools')}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                    selectedFeatures.includes('tools')
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span className="flex-1">Tools</span>
                  {selectedFeatures.includes('tools') && <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => toggleFeature('reasoning')}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                    selectedFeatures.includes('reasoning')
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                  }`}
                >
                  <Brain className="w-4 h-4" />
                  <span className="flex-1">Reasoning</span>
                  {selectedFeatures.includes('reasoning') && <Check className="w-4 h-4" />}
                </button>
                {selectedFeatures.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-border-secondary">
                    <button
                      onClick={() => setSelectedFeatures([])}
                      className="w-full py-2 text-xs text-text-muted hover:text-accent-primary transition-colors"
                    >
                      Clear selection
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-primary hover:border-border-hover"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortField === 'topModels' ? 'Top Models' : 
               sortField === 'lastUpdated' ? 'Recently Updated' :
               sortField === 'alphabetical' ? 'A → Z' :
               sortField === 'provider' ? 'Provider' :
               sortField === 'inputPrice' ? 'Input Price' :
               sortField === 'outputPrice' ? 'Output Price' :
               'Sort'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'sort' && (
              <div className="absolute top-full right-0 mt-2 w-[240px] rounded-xl bg-bg-secondary border border-border-primary shadow-2xl z-50 animate-fade-in overflow-hidden">
                <div className="p-1">
                  <div className="px-3 py-1.5 text-xs font-medium text-text-muted uppercase tracking-wide">Default</div>
                  <button
                    onClick={() => { setSortField('topModels'); setSortDirection('asc'); setOpenDropdown(null) }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all text-left ${
                      sortField === 'topModels' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Top Models First
                  </button>
                </div>
                <div className="border-t border-border-secondary mx-1" />
                <div className="p-1">
                  <div className="px-3 py-1.5 text-xs font-medium text-text-muted uppercase tracking-wide">Order</div>
                  <button
                    onClick={() => { setSortField('lastUpdated'); setSortDirection('asc'); setOpenDropdown(null) }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all text-left ${
                      sortField === 'lastUpdated' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Recently Updated
                  </button>
                  <button
                    onClick={() => { setSortField('alphabetical'); setSortDirection('asc'); setOpenDropdown(null) }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all text-left ${
                      sortField === 'alphabetical' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                    }`}
                  >
                    <ArrowDownAZ className="w-4 h-4" />
                    Alphabetical (A → Z)
                  </button>
                  <button
                    onClick={() => { setSortField('provider'); setSortDirection('asc'); setOpenDropdown(null) }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all text-left ${
                      sortField === 'provider' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    By Provider
                  </button>
                </div>
                <div className="border-t border-border-secondary mx-1" />
                <div className="p-1">
                  <div className="px-3 py-1.5 text-xs font-medium text-text-muted uppercase tracking-wide">Price</div>
                  <button
                    onClick={() => { setSortField('inputPrice'); setSortDirection('asc'); setOpenDropdown(null) }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all text-left ${
                      sortField === 'inputPrice' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    Input Price (Low → High)
                  </button>
                  <button
                    onClick={() => { setSortField('outputPrice'); setSortDirection('asc'); setOpenDropdown(null) }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all text-left ${
                      sortField === 'outputPrice' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    Output Price (Low → High)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-2.5 py-2 text-sm text-text-muted hover:text-accent-primary transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}

          {/* Results Count */}
          <div className="ml-auto text-sm text-text-muted font-mono">
            {filteredModels.length.toLocaleString()} models
          </div>
        </div>
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
                <th className="text-center">Verified</th>
                <th>Updated</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedModels.map((model) => {
                const providerStyle = getProviderColor(model.provider)
                const modelKey = `${model.provider}-${model.id}`
                const hasAdditionalPricing = model.pricing?.additional && model.pricing.additional.length > 0
                const isExpanded = expandedRows.has(modelKey)
                
                return (
                  <Fragment key={modelKey}>
                    <tr 
                      className="group cursor-pointer hover:bg-bg-secondary"
                      onClick={(e) => handleRowClick(model, e)}
                    >
                      <td>
                        <div className="flex items-center gap-1">
                          {hasAdditionalPricing ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleRowExpanded(modelKey) }}
                              className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-all"
                              title={isExpanded ? "Hide additional pricing" : "Show additional pricing"}
                            >
                              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                          ) : (
                            <span className="w-5.5" />
                          )}
                          <Link 
                            href={`/${model.provider}`}
                            className="inline-flex items-center gap-2 hover:text-accent-primary transition-colors group/provider"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: providerStyle.color }}
                            />
                            <span className="text-text-secondary group-hover/provider:text-accent-primary transition-colors">
                              {model.providerDisplayName}
                            </span>
                          </Link>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary">
                            {model.id}
                          </span>
                          {hasAdditionalPricing && (
                            <span 
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors"
                              onClick={(e) => { e.stopPropagation(); toggleRowExpanded(modelKey) }}
                              title="Click to see additional pricing"
                            >
                              <Zap className="w-3 h-3" />
                              +{model.pricing?.additional?.length}
                            </span>
                          )}
                        </div>
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
                      <td className="text-center">
                        {model.verified === true ? (
                          <span title="Verified">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                          </span>
                        ) : (
                          <span className="text-text-faint">—</span>
                        )}
                      </td>
                      <td>
                        <span className="text-text-muted text-xs">
                          {formatRelativeTime(model.lastUpdated)}
                        </span>
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
                    {/* Expanded row for additional pricing */}
                    {hasAdditionalPricing && isExpanded && (
                      <tr key={`${modelKey}-expanded`} className="bg-bg-secondary/50">
                        <td colSpan={10} className="!py-3 !px-4">
                          <div className="pl-6">
                            <div className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wide">Additional Pricing</div>
                            <div className="flex flex-wrap gap-3">
                              {model.pricing?.additional?.map((unit) => (
                                <div 
                                  key={unit.name}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-primary border border-border-primary"
                                >
                                  <span className={`badge badge-${unit.category}`}>
                                    {getCategoryIcon(unit.category)}
                                  </span>
                                  <span className="text-sm text-text-secondary">{unit.displayName}</span>
                                  <span className="text-sm font-mono text-text-primary">{formatAdditionalPrice(unit.price)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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

      {/* Pagination Controls */}
      {showPagination && (
        <div className="mt-4 flex items-center justify-between gap-4 px-2">
          <div className="text-sm text-text-muted">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredModels.length)} of {filteredModels.length.toLocaleString()} models
          </div>
          
          <div className="flex items-center gap-1">
            {/* First page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-border-primary bg-bg-secondary text-text-secondary hover:bg-bg-elevated hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-bg-secondary disabled:hover:text-text-secondary transition-all"
              title="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            
            {/* Previous page */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-border-primary bg-bg-secondary text-text-secondary hover:bg-bg-elevated hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-bg-secondary disabled:hover:text-text-secondary transition-all"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1 mx-2">
              {(() => {
                const pages: (number | 'ellipsis')[] = []
                const showPages = 5
                
                if (totalPages <= showPages + 2) {
                  // Show all pages if few enough
                  for (let i = 1; i <= totalPages; i++) pages.push(i)
                } else {
                  // Always show first page
                  pages.push(1)
                  
                  // Calculate range around current page
                  let start = Math.max(2, currentPage - 1)
                  let end = Math.min(totalPages - 1, currentPage + 1)
                  
                  // Adjust if at edges
                  if (currentPage <= 3) {
                    end = Math.min(4, totalPages - 1)
                  } else if (currentPage >= totalPages - 2) {
                    start = Math.max(totalPages - 3, 2)
                  }
                  
                  // Add ellipsis before middle pages
                  if (start > 2) pages.push('ellipsis')
                  
                  // Add middle pages
                  for (let i = start; i <= end; i++) pages.push(i)
                  
                  // Add ellipsis after middle pages
                  if (end < totalPages - 1) pages.push('ellipsis')
                  
                  // Always show last page
                  pages.push(totalPages)
                }
                
                return pages.map((page, idx) => 
                  page === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-text-muted">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[36px] h-9 px-3 rounded-md text-sm font-medium transition-all ${
                        currentPage === page
                          ? 'bg-accent-primary text-white'
                          : 'border border-border-primary bg-bg-secondary text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )
              })()}
            </div>
            
            {/* Next page */}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-border-primary bg-bg-secondary text-text-secondary hover:bg-bg-elevated hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-bg-secondary disabled:hover:text-text-secondary transition-all"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            {/* Last page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-border-primary bg-bg-secondary text-text-secondary hover:bg-bg-elevated hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-bg-secondary disabled:hover:text-text-secondary transition-all"
              title="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
