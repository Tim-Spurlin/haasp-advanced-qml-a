import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Lightning, 
  Timer, 
  Database, 
  ChartBar, 
  Warning, 
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus 
} from '@phosphor-icons/react'
import { useState, useEffect, useMemo } from 'react'

interface PerformanceMetrics {
  fps: number
  memory: number
  renderTime: number
  networkRequests?: number
  cacheHits?: number
  componentCount: number
  updateCount: number
}

interface PerformanceHistory {
  timestamp: number
  metrics: PerformanceMetrics
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics
  onOptimize: (type: string) => void
  showRealtime?: boolean
}

const PERFORMANCE_THRESHOLDS = {
  fps: { good: 55, warning: 45, critical: 30 },
  memory: { good: 50 * 1024 * 1024, warning: 100 * 1024 * 1024, critical: 200 * 1024 * 1024 },
  renderTime: { good: 16, warning: 33, critical: 50 }
}

export default function PerformanceMonitor({ 
  metrics, 
  onOptimize, 
  showRealtime = true 
}: PerformanceMonitorProps) {
  const [history, setHistory] = useState<PerformanceHistory[]>([])
  const [isMonitoring, setIsMonitoring] = useState(showRealtime)
  const [selectedMetric, setSelectedMetric] = useState<keyof PerformanceMetrics>('fps')

  // Record performance history
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      setHistory(prev => {
        const newHistory = [...prev, {
          timestamp: Date.now(),
          metrics: { ...metrics }
        }]
        // Keep only last 100 data points
        return newHistory.slice(-100)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [metrics, isMonitoring])

  const getStatusColor = (value: number, thresholds: any) => {
    if (value >= thresholds.good || value <= thresholds.good) return 'text-green-600'
    if (value >= thresholds.warning || value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusBadge = (value: number, thresholds: any, inverse = false) => {
    const isGood = inverse ? value <= thresholds.good : value >= thresholds.good
    const isWarning = inverse ? value <= thresholds.warning : value >= thresholds.warning
    
    if (isGood) return <Badge className="bg-green-100 text-green-800">Good</Badge>
    if (isWarning) return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
    return <Badge className="bg-red-100 text-red-800">Critical</Badge>
  }

  const getTrend = (metricKey: keyof PerformanceMetrics) => {
    if (history.length < 2) return null
    
    const recent = history.slice(-10)
    const current = recent[recent.length - 1]?.metrics[metricKey] || 0
    const previous = recent[0]?.metrics[metricKey] || 0
    
    if (current > previous) return <ArrowUp className="w-3 h-3 text-green-600" />
    if (current < previous) return <ArrowDown className="w-3 h-3 text-red-600" />
    return <Minus className="w-3 h-3 text-gray-600" />
  }

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatTime = (ms: number) => {
    return `${ms.toFixed(1)}ms`
  }

  const getOptimizationSuggestions = () => {
    const suggestions: Array<{
      type: string
      title: string
      description: string
      action: string
    }> = []
    
    if (metrics.fps < PERFORMANCE_THRESHOLDS.fps.warning) {
      suggestions.push({
        type: 'fps',
        title: 'Low Frame Rate',
        description: 'Consider reducing component complexity or enabling virtualization',
        action: 'Optimize Rendering'
      })
    }
    
    if (metrics.memory > PERFORMANCE_THRESHOLDS.memory.warning) {
      suggestions.push({
        type: 'memory',
        title: 'High Memory Usage',
        description: 'Clean up unused components or implement lazy loading',
        action: 'Optimize Memory'
      })
    }
    
    if (metrics.renderTime > PERFORMANCE_THRESHOLDS.renderTime.warning) {
      suggestions.push({
        type: 'render',
        title: 'Slow Render Time',
        description: 'Reduce DOM manipulations or use memoization',
        action: 'Optimize Render'
      })
    }
    
    if (metrics.componentCount > 100) {
      suggestions.push({
        type: 'components',
        title: 'Too Many Components',
        description: 'Consider component virtualization or tree shaking',
        action: 'Reduce Components'
      })
    }

    return suggestions
  }

  const getOverallScore = () => {
    let score = 100
    
    // FPS scoring
    if (metrics.fps < PERFORMANCE_THRESHOLDS.fps.critical) score -= 30
    else if (metrics.fps < PERFORMANCE_THRESHOLDS.fps.warning) score -= 15
    
    // Memory scoring
    if (metrics.memory > PERFORMANCE_THRESHOLDS.memory.critical) score -= 25
    else if (metrics.memory > PERFORMANCE_THRESHOLDS.memory.warning) score -= 10
    
    // Render time scoring
    if (metrics.renderTime > PERFORMANCE_THRESHOLDS.renderTime.critical) score -= 25
    else if (metrics.renderTime > PERFORMANCE_THRESHOLDS.renderTime.warning) score -= 10
    
    return Math.max(0, score)
  }

  const overallScore = getOverallScore()
  const suggestions = getOptimizationSuggestions()

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightning className="w-4 h-4" />
          Performance Monitor
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={overallScore >= 80 ? 'default' : overallScore >= 60 ? 'secondary' : 'destructive'}>
              {overallScore}%
            </Badge>
            <Button
              size="sm"
              variant={isMonitoring ? "default" : "outline"}
              onClick={() => setIsMonitoring(!isMonitoring)}
              className="h-6 px-2"
            >
              {isMonitoring ? 'Live' : 'Paused'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Performance Score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Performance</span>
            <span className={overallScore >= 80 ? 'text-green-600' : overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'}>
              {overallScore}%
            </span>
          </div>
          <Progress 
            value={overallScore} 
            className={`h-2 ${
              overallScore >= 80 ? '[&>div]:bg-green-500' : 
              overallScore >= 60 ? '[&>div]:bg-yellow-500' : 
              '[&>div]:bg-red-500'
            }`}
          />
        </div>

        <Separator />

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* FPS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Timer className="w-3 h-3" />
                <span className="text-xs font-medium">FPS</span>
                {getTrend('fps')}
              </div>
              {getStatusBadge(metrics.fps, PERFORMANCE_THRESHOLDS.fps)}
            </div>
            <div className={`text-lg font-bold ${getStatusColor(metrics.fps, PERFORMANCE_THRESHOLDS.fps)}`}>
              {metrics.fps.toFixed(0)}
            </div>
          </div>

          {/* Memory */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span className="text-xs font-medium">Memory</span>
                {getTrend('memory')}
              </div>
              {getStatusBadge(metrics.memory, PERFORMANCE_THRESHOLDS.memory, true)}
            </div>
            <div className={`text-sm font-bold ${getStatusColor(metrics.memory, PERFORMANCE_THRESHOLDS.memory)}`}>
              {formatBytes(metrics.memory)}
            </div>
          </div>

          {/* Render Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <ChartBar className="w-3 h-3" />
                <span className="text-xs font-medium">Render</span>
                {getTrend('renderTime')}
              </div>
              {getStatusBadge(metrics.renderTime, PERFORMANCE_THRESHOLDS.renderTime, true)}
            </div>
            <div className={`text-sm font-bold ${getStatusColor(metrics.renderTime, PERFORMANCE_THRESHOLDS.renderTime)}`}>
              {formatTime(metrics.renderTime)}
            </div>
          </div>

          {/* Component Count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Lightning className="w-3 h-3" />
                <span className="text-xs font-medium">Components</span>
                {getTrend('componentCount')}
              </div>
            </div>
            <div className="text-sm font-bold">
              {metrics.componentCount}
            </div>
          </div>
        </div>

        {/* Performance History Chart (Mini) */}
        {history.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium">History</label>
            <div className="h-16 flex items-end gap-0.5">
              {history.slice(-20).map((point, index) => {
                const value = point.metrics[selectedMetric]
                const maxValue = Math.max(...history.map(h => h.metrics[selectedMetric] as number))
                const height = Math.max(2, (value as number / maxValue) * 60)
                
                return (
                  <div
                    key={index}
                    className="bg-primary flex-1 rounded-t-sm"
                    style={{ height: `${height}%` }}
                    title={`${selectedMetric}: ${value}`}
                  />
                )
              })}
            </div>
            <div className="flex gap-1">
              {(['fps', 'memory', 'renderTime'] as const).map((metric) => (
                <Button
                  key={metric}
                  size="sm"
                  variant={selectedMetric === metric ? "default" : "outline"}
                  onClick={() => setSelectedMetric(metric)}
                  className="h-6 px-2 text-xs capitalize"
                >
                  {metric.replace('Time', '')}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Optimization Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="flex items-center gap-2">
              <Warning className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium">Optimization Suggestions</span>
            </div>
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="p-2 border rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs">{suggestion.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {suggestion.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onOptimize(suggestion.type)}
                        className="h-6 px-2 text-xs flex-shrink-0"
                      >
                        {suggestion.action}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* No Issues */}
        {suggestions.length === 0 && (
          <div className="text-center py-4">
            <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm font-medium">Performance Excellent</p>
            <p className="text-xs text-muted-foreground">No optimizations needed</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}