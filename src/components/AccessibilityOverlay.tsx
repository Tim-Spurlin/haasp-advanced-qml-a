import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Eye, 
  EyeSlash, 
  Palette, 
  Lightning, 
  Target, 
  CheckCircle,
  Warning,
  Info,
  Moon,
  Sun
} from '@phosphor-icons/react'
import { useState, useEffect } from 'react'

interface AccessibilityState {
  screenReader: boolean
  highContrast: boolean
  largeText: boolean
  colorBlind: boolean
  focusIndicators: boolean
  reducedMotion: boolean
  darkMode: boolean
}

interface AccessibilityProps {
  accessibility: AccessibilityState
  onToggle: (setting: keyof AccessibilityState) => void
  components: any[]
  onAnalyze: () => void
}

const COLOR_BLIND_FILTERS = {
  protanopia: 'url(#protanopia-filter)',
  deuteranopia: 'url(#deuteranopia-filter)',
  tritanopia: 'url(#tritanopia-filter)',
  achromatopsia: 'url(#achromatopsia-filter)'
}

export default function AccessibilityOverlay({
  accessibility,
  onToggle,
  components,
  onAnalyze
}: AccessibilityProps) {
  const [contrastRatio, setContrastRatio] = useState(4.5)
  const [textScale, setTextScale] = useState(100)
  const [colorBlindType, setColorBlindType] = useState<keyof typeof COLOR_BLIND_FILTERS>('protanopia')
  const [auditResults, setAuditResults] = useState<any[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Perform accessibility audit
  const performAudit = async () => {
    setIsAnalyzing(true)
    
    // Simulate audit process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const results = components.map(component => {
      const issues: Array<{
        type: string
        rule: string
        message: string
        severity: string
      }> = []
      
      // Check for missing alt text on images
      if (component.type === 'image' && !component.props.alt) {
        issues.push({
          type: 'error',
          rule: 'WCAG 1.1.1',
          message: 'Image missing alt text',
          severity: 'high'
        })
      }
      
      // Check for low contrast (mock calculation)
      const hasLowContrast = Math.random() > 0.7
      if (hasLowContrast) {
        issues.push({
          type: 'warning',
          rule: 'WCAG 1.4.3',
          message: 'Contrast ratio may be insufficient',
          severity: 'medium'
        })
      }
      
      // Check for missing focus indicators
      if (!component.props.focusable && (component.type === 'button' || component.type === 'input')) {
        issues.push({
          type: 'warning',
          rule: 'WCAG 2.4.7',
          message: 'Missing visible focus indicator',
          severity: 'medium'
        })
      }
      
      // Check for missing semantic roles
      if (!component.props.role && component.type === 'container') {
        issues.push({
          type: 'info',
          rule: 'WCAG 4.1.2',
          message: 'Consider adding semantic role',
          severity: 'low'
        })
      }

      return {
        componentId: component.id,
        componentName: component.name,
        issues,
        score: Math.max(0, 100 - (issues.length * 15))
      }
    })
    
    setAuditResults(results)
    setIsAnalyzing(false)
    onAnalyze()
  }

  const getOverallScore = () => {
    if (auditResults.length === 0) return 0
    const average = auditResults.reduce((acc, result) => acc + result.score, 0) / auditResults.length
    return Math.round(average)
  }

  const getTotalIssues = () => {
    return auditResults.reduce((acc, result) => acc + result.issues.length, 0)
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <Warning className="w-4 h-4 text-red-500" />
      case 'warning': return <Warning className="w-4 h-4 text-yellow-500" />
      case 'info': return <Info className="w-4 h-4 text-blue-500" />
      default: return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Apply accessibility transformations to the page
  useEffect(() => {
    const root = document.documentElement
    
    // High contrast mode
    if (accessibility.highContrast) {
      root.style.filter = 'contrast(150%)'
    } else {
      root.style.filter = ''
    }
    
    // Large text scaling
    if (accessibility.largeText) {
      root.style.fontSize = `${textScale}%`
    } else {
      root.style.fontSize = '100%'
    }
    
    // Dark mode toggle
    if (accessibility.darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Reduced motion
    if (accessibility.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s')
    } else {
      root.style.removeProperty('--animation-duration')
    }
    
    return () => {
      root.style.filter = ''
      root.style.fontSize = '100%'
      root.classList.remove('dark')
      root.style.removeProperty('--animation-duration')
    }
  }, [accessibility, textScale])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Accessibility
          <Badge variant={getOverallScore() >= 80 ? 'default' : 'destructive'} className="ml-auto">
            {getOverallScore()}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Settings */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="screen-reader"
              checked={accessibility.screenReader}
              onCheckedChange={() => onToggle('screenReader')}
            />
            <Label htmlFor="screen-reader" className="text-xs">Screen Reader</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="high-contrast"
              checked={accessibility.highContrast}
              onCheckedChange={() => onToggle('highContrast')}
            />
            <Label htmlFor="high-contrast" className="text-xs">High Contrast</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="large-text"
              checked={accessibility.largeText}
              onCheckedChange={() => onToggle('largeText')}
            />
            <Label htmlFor="large-text" className="text-xs">Large Text</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="dark-mode"
              checked={accessibility.darkMode}
              onCheckedChange={() => onToggle('darkMode')}
            />
            <Label htmlFor="dark-mode" className="text-xs">
              {accessibility.darkMode ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="color-blind"
              checked={accessibility.colorBlind}
              onCheckedChange={() => onToggle('colorBlind')}
            />
            <Label htmlFor="color-blind" className="text-xs">Color Blind</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="reduced-motion"
              checked={accessibility.reducedMotion}
              onCheckedChange={() => onToggle('reducedMotion')}
            />
            <Label htmlFor="reduced-motion" className="text-xs">Reduced Motion</Label>
          </div>
        </div>

        <Separator />

        {/* Advanced Controls */}
        {accessibility.largeText && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Text Scale: {textScale}%</Label>
            <Slider
              value={[textScale]}
              onValueChange={(value) => setTextScale(value[0])}
              max={200}
              min={100}
              step={10}
              className="w-full"
            />
          </div>
        )}

        {accessibility.colorBlind && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Color Blindness Type</Label>
            <select
              value={colorBlindType}
              onChange={(e) => setColorBlindType(e.target.value as keyof typeof COLOR_BLIND_FILTERS)}
              className="w-full text-xs border rounded px-2 py-1 bg-background"
            >
              <option value="protanopia">Protanopia (Red-blind)</option>
              <option value="deuteranopia">Deuteranopia (Green-blind)</option>
              <option value="tritanopia">Tritanopia (Blue-blind)</option>
              <option value="achromatopsia">Achromatopsia (Complete)</option>
            </select>
          </div>
        )}

        {accessibility.highContrast && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Contrast Ratio: {contrastRatio.toFixed(1)}:1</Label>
            <Slider
              value={[contrastRatio]}
              onValueChange={(value) => setContrastRatio(value[0])}
              max={21}
              min={3}
              step={0.1}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">
              WCAG AA: 4.5:1 | AAA: 7:1
            </div>
          </div>
        )}

        <Separator />

        {/* Accessibility Audit */}
        <div className="space-y-2">
          <Button
            onClick={performAudit}
            disabled={isAnalyzing}
            className="w-full"
            size="sm"
          >
            <Target className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Run Accessibility Audit'}
          </Button>
          
          {auditResults.length > 0 && (
            <div className="p-2 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium">Audit Results</span>
                <Badge variant={getOverallScore() >= 80 ? 'default' : 'secondary'}>
                  {getTotalIssues()} issues
                </Badge>
              </div>
              
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {auditResults.map((result) => (
                    <div key={result.componentId} className="border rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-xs">{result.componentName}</span>
                        <Badge variant="outline" className="text-xs">
                          {result.score}%
                        </Badge>
                      </div>
                      
                      {result.issues.map((issue: any, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-xs">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <div className="font-medium">{issue.rule}</div>
                            <div className="text-muted-foreground">{issue.message}</div>
                          </div>
                          <Badge className={`text-xs ${getSeverityColor(issue.severity)}`}>
                            {issue.severity}
                          </Badge>
                        </div>
                      ))}
                      
                      {result.issues.length === 0 && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          No accessibility issues found
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Quick Fixes */}
        {auditResults.some(result => result.issues.length > 0) && (
          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => {
                // Simulate applying quick fixes
                setAuditResults(results => 
                  results.map(result => ({
                    ...result,
                    issues: result.issues.filter((issue: any) => issue.severity === 'high'),
                    score: Math.min(100, result.score + 20)
                  }))
                )
              }}
            >
              <Lightning className="w-4 h-4 mr-2" />
              Apply Quick Fixes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}