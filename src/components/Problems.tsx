import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Warning, X, CheckCircle, Info, Eye, EyeSlash, Wrench } from '@phosphor-icons/react'
import { useState, useMemo } from 'react'

export interface Problem {
  id: string
  type: 'error' | 'warning' | 'info' | 'accessibility' | 'performance' | 'suggestion'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  componentId?: string
  line?: number
  column?: number
  autoFixable: boolean
  suggestion?: string
  createdAt: number
}

interface ProblemsProps {
  problems: Problem[]
  onSelectProblem: (problem: Problem) => void
  onFixProblem: (problemId: string) => void
  onDismissProblem: (problemId: string) => void
  selectedComponent?: string
}

const PROBLEM_ICONS = {
  error: Warning,
  warning: Warning,
  info: Info,
  accessibility: Eye,
  performance: CheckCircle,
  suggestion: Wrench
}

const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
}

export default function Problems({
  problems,
  onSelectProblem,
  onFixProblem,
  onDismissProblem,
  selectedComponent
}: ProblemsProps) {
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<Problem['type'] | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<Problem['severity'] | 'all'>('all')
  const [showFixableOnly, setShowFixableOnly] = useState(false)

  const filteredProblems = useMemo(() => {
    return problems.filter(problem => {
      // Text filter
      if (filter && !problem.title.toLowerCase().includes(filter.toLowerCase()) &&
          !problem.description.toLowerCase().includes(filter.toLowerCase())) {
        return false
      }
      
      // Type filter
      if (typeFilter !== 'all' && problem.type !== typeFilter) {
        return false
      }
      
      // Severity filter
      if (severityFilter !== 'all' && problem.severity !== severityFilter) {
        return false
      }
      
      // Fixable filter
      if (showFixableOnly && !problem.autoFixable) {
        return false
      }
      
      // Component filter (if a component is selected)
      if (selectedComponent && problem.componentId !== selectedComponent) {
        return false
      }
      
      return true
    }).sort((a, b) => {
      // Sort by severity first, then by creation time
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      if (severityDiff !== 0) return severityDiff
      
      return b.createdAt - a.createdAt
    })
  }, [problems, filter, typeFilter, severityFilter, showFixableOnly, selectedComponent])

  const problemCounts = useMemo(() => {
    return problems.reduce((acc, problem) => {
      acc[problem.severity] = (acc[problem.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [problems])

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const getProblemIcon = (type: Problem['type']) => {
    const Icon = PROBLEM_ICONS[type]
    return <Icon className="w-4 h-4" />
  }

  const getSeverityBadgeClass = (severity: Problem['severity']) => {
    return SEVERITY_COLORS[severity]
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Warning className="w-4 h-4" />
          Problems
          {problems.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {problems.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {problems.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(problemCounts).map(([severity, count]) => (
              <div key={severity} className="text-center">
                <div className={`text-sm font-bold ${
                  severity === 'critical' ? 'text-red-600' :
                  severity === 'high' ? 'text-orange-600' :
                  severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                }`}>
                  {count}
                </div>
                <div className="text-xs text-muted-foreground capitalize">{severity}</div>
              </div>
            ))}
          </div>
        )}

        {problems.length > 0 && <Separator />}

        {/* Filters */}
        <div className="space-y-2">
          <Input
            placeholder="Search problems..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-8"
          />
          
          <div className="flex gap-1 flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="text-xs border rounded px-2 py-1 bg-background"
            >
              <option value="all">All Types</option>
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="accessibility">A11y</option>
              <option value="performance">Performance</option>
              <option value="suggestion">Suggestions</option>
            </select>
            
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="text-xs border rounded px-2 py-1 bg-background"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <Button
              size="sm"
              variant={showFixableOnly ? "default" : "outline"}
              onClick={() => setShowFixableOnly(!showFixableOnly)}
              className="h-7 px-2 text-xs"
            >
              {showFixableOnly ? <EyeSlash className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              Auto-fix
            </Button>
          </div>
        </div>

        {/* Problems List */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {filteredProblems.map((problem) => (
              <div
                key={problem.id}
                className="p-3 border rounded-lg hover:bg-muted cursor-pointer group"
                onClick={() => onSelectProblem(problem)}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {getProblemIcon(problem.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{problem.title}</h4>
                      <Badge className={`text-xs ${getSeverityBadgeClass(problem.severity)}`}>
                        {problem.severity}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {problem.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {problem.componentId && (
                          <span>#{problem.componentId.slice(0, 8)}</span>
                        )}
                        {problem.line && (
                          <span>Line {problem.line}</span>
                        )}
                        <span>{formatTime(problem.createdAt)}</span>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {problem.autoFixable && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFixProblem(problem.id)
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            <Wrench className="w-3 h-3 mr-1" />
                            Fix
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDismissProblem(problem.id)
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {problem.suggestion && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <strong>Suggestion:</strong> {problem.suggestion}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredProblems.length === 0 && problems.length > 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">
                No problems match your filters
              </p>
            )}
            
            {problems.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                <p className="text-sm font-medium">No problems found</p>
                <p className="text-xs text-muted-foreground">Your project looks good!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {problems.some(p => p.autoFixable) && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => problems.filter(p => p.autoFixable).forEach(p => onFixProblem(p.id))}
              className="flex-1"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Fix All Auto-fixable
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}