import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Link, 
  Play, 
  Warning, 
  CheckCircle, 
  Code, 
  Eye, 
  EyeSlash,
  Plus,
  X,
  Lightbulb
} from '@phosphor-icons/react'
import { useState, useMemo } from 'react'

interface Binding {
  id: string
  property: string
  expression: string
  component: string
  dependencies: string[]
  isValid: boolean
  error?: string
  performance?: {
    evaluationTime: number
    evaluationCount: number
    lastEvaluation: number
  }
}

interface BindingInspectorProps {
  selectedComponent?: any
  bindings: Record<string, string>
  onUpdateBinding: (property: string, expression: string) => void
  onRemoveBinding: (property: string) => void
  onTestBinding: (property: string, expression: string) => Promise<any>
}

export default function BindingInspector({
  selectedComponent,
  bindings,
  onUpdateBinding,
  onRemoveBinding,
  onTestBinding
}: BindingInspectorProps) {
  const [newBindingProperty, setNewBindingProperty] = useState('')
  const [newBindingExpression, setNewBindingExpression] = useState('')
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [isTestingAll, setIsTestingAll] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Parse bindings into structured format
  const parsedBindings = useMemo(() => {
    if (!selectedComponent || !bindings) return []
    
    return Object.entries(bindings).map(([property, expression]) => {
      // Analyze expression for dependencies
      const dependencies: string[] = []
      const componentIdRegex = /\$\{([^}]+)\}/g
      let match
      while ((match = componentIdRegex.exec(expression)) !== null) {
        dependencies.push(match[1])
      }

      // Basic validation
      let isValid = true
      let error = ''
      
      try {
        // Simple syntax check (would need proper parser in real implementation)
        if (expression.includes('${') && !expression.includes('}')) {
          isValid = false
          error = 'Unclosed template literal'
        }
      } catch (e) {
        isValid = false
        error = (e as Error).message
      }

      return {
        id: `${selectedComponent.id}-${property}`,
        property,
        expression,
        component: selectedComponent.name,
        dependencies,
        isValid,
        error,
        performance: {
          evaluationTime: Math.random() * 10, // Mock data
          evaluationCount: Math.floor(Math.random() * 100),
          lastEvaluation: Date.now() - Math.random() * 60000
        }
      } as Binding
    })
  }, [selectedComponent, bindings])

  const handleAddBinding = () => {
    if (!newBindingProperty.trim() || !newBindingExpression.trim()) return
    
    onUpdateBinding(newBindingProperty.trim(), newBindingExpression.trim())
    setNewBindingProperty('')
    setNewBindingExpression('')
  }

  const handleTestBinding = async (binding: Binding) => {
    try {
      const result = await onTestBinding(binding.property, binding.expression)
      setTestResults(prev => ({
        ...prev,
        [binding.id]: { success: true, result }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [binding.id]: { success: false, error: (error as Error).message }
      }))
    }
  }

  const handleTestAllBindings = async () => {
    setIsTestingAll(true)
    setTestResults({})
    
    for (const binding of parsedBindings) {
      await handleTestBinding(binding)
    }
    
    setIsTestingAll(false)
  }

  const getBindingSuggestions = (property: string) => {
    const suggestions: string[] = []
    
    // Common binding patterns
    if (property.toLowerCase().includes('text')) {
      suggestions.push('${otherComponent.text}', '${data.title}', '"Hello " + ${user.name}')
    } else if (property.toLowerCase().includes('visible')) {
      suggestions.push('${state.isActive}', '${component.value > 0}', '${!component.disabled}')
    } else if (property.toLowerCase().includes('style')) {
      suggestions.push('"color: " + ${theme.primary}', '${state.error ? "color: red" : ""}')
    }
    
    return suggestions
  }

  const formatTime = (ms: number) => {
    return `${ms.toFixed(2)}ms`
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  if (!selectedComponent) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Link className="w-4 h-4" />
            Binding Inspector
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm">Select a component to view bindings</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Link className="w-4 h-4" />
          Binding Inspector
          <Badge variant="secondary" className="ml-auto">
            {parsedBindings.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Component Info */}
        <div className="p-2 bg-muted rounded-lg">
          <div className="font-medium text-sm">{selectedComponent.name}</div>
          <div className="text-xs text-muted-foreground">#{selectedComponent.id.slice(0, 8)}</div>
        </div>

        {/* Add New Binding */}
        <div className="space-y-2 p-2 border rounded-lg">
          <Label className="text-xs font-medium">Add New Binding</Label>
          <Input
            placeholder="Property name (e.g., 'text', 'visible')"
            value={newBindingProperty}
            onChange={(e) => setNewBindingProperty(e.target.value)}
            className="h-8"
          />
          <Textarea
            placeholder="Binding expression (e.g., '${otherComponent.value}')"
            value={newBindingExpression}
            onChange={(e) => setNewBindingExpression(e.target.value)}
            className="h-16 text-xs font-mono"
          />
          
          {/* Suggestions */}
          {newBindingProperty && getBindingSuggestions(newBindingProperty).length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Suggestions:</Label>
              <div className="flex flex-wrap gap-1">
                {getBindingSuggestions(newBindingProperty).map((suggestion, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    onClick={() => setNewBindingExpression(suggestion)}
                    className="h-6 px-2 text-xs font-mono"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <Button onClick={handleAddBinding} size="sm" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Binding
          </Button>
        </div>

        <Separator />

        {/* Test All Bindings */}
        {parsedBindings.length > 0 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleTestAllBindings}
              disabled={isTestingAll}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              {isTestingAll ? 'Testing...' : 'Test All'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {/* Bindings List */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {parsedBindings.map((binding) => (
              <div key={binding.id} className="border rounded-lg p-3">
                {/* Binding Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    <span className="font-medium text-sm">{binding.property}</span>
                    {binding.isValid ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <Warning className="w-4 h-4 text-red-600" />
                    }
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestBinding(binding)}
                      className="h-6 px-2"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRemoveBinding(binding.property)}
                      className="h-6 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Expression */}
                <div className="mb-2">
                  <Textarea
                    value={binding.expression}
                    onChange={(e) => onUpdateBinding(binding.property, e.target.value)}
                    className="h-16 text-xs font-mono"
                  />
                </div>

                {/* Error */}
                {binding.error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 mb-2">
                    <Warning className="w-3 h-3 inline mr-1" />
                    {binding.error}
                  </div>
                )}

                {/* Test Result */}
                {testResults[binding.id] && (
                  <div className={`p-2 border rounded text-xs mb-2 ${
                    testResults[binding.id].success 
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {testResults[binding.id].success ? (
                      <div>
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Result: {JSON.stringify(testResults[binding.id].result)}
                      </div>
                    ) : (
                      <div>
                        <Warning className="w-3 h-3 inline mr-1" />
                        Error: {testResults[binding.id].error}
                      </div>
                    )}
                  </div>
                )}

                {/* Dependencies */}
                {binding.dependencies.length > 0 && (
                  <div className="mb-2">
                    <Label className="text-xs text-muted-foreground">Dependencies:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {binding.dependencies.map((dep, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advanced Performance Info */}
                {showAdvanced && binding.performance && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>Eval Time: {formatTime(binding.performance.evaluationTime)}</div>
                      <div>Count: {binding.performance.evaluationCount}</div>
                      <div className="col-span-2">
                        Last: {formatTimestamp(binding.performance.lastEvaluation)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {parsedBindings.length === 0 && (
              <div className="text-center py-8">
                <Lightbulb className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No bindings yet</p>
                <p className="text-xs text-muted-foreground">
                  Add bindings to create dynamic relationships between components
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}