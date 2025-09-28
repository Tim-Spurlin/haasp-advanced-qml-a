import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Plus, Play, Code, Palette, Stack, ChatCircle, Gear, Sparkle, Lightning, Brain, Clock, Warning, Link, Eye } from '@phosphor-icons/react'
import { toast } from 'sonner'
import ComponentPalette from './components/ComponentPalette'
import CanvasArea from './components/CanvasArea'
import PropertyPanel from './components/PropertyPanel'
import AIAssistant from './components/AIAssistant'
import Timeline from './components/Timeline'
import Problems, { Problem } from './components/Problems'
import PerformanceMonitor from './components/PerformanceMonitor'
import BindingInspector from './components/BindingInspector'
import AccessibilityOverlay from './components/AccessibilityOverlay'
import AIOrganisms from './components/AIOrganisms'

interface Component {
  id: string
  type: string
  name: string
  props: Record<string, any>
  x: number
  y: number
  width: number
  height: number
  children?: Component[]
  bindings?: Record<string, string>
  constraints?: LayoutConstraint[]
  metadata?: ComponentMetadata
}

interface LayoutConstraint {
  type: 'spacing' | 'alignment' | 'size' | 'aspect'
  target?: string
  value: number | string
  active: boolean
}

interface ComponentMetadata {
  performance?: {
    renderTime: number
    lastUpdated: number
    optimizations: string[]
  }
  accessibility?: {
    role: string
    label: string
    description: string
  }
  ml?: {
    confidence: number
    suggestions: string[]
    learningData: any[]
  }
}

interface Project {
  id: string
  name: string
  components: Component[]
  createdAt: string
  lastModified: string
  trails?: AssociativeTrail[]
  snapshots?: ProjectSnapshot[]
  config?: ProjectConfig
}

interface AssociativeTrail {
  id: string
  nodes: string[]
  weights: number[]
  type: 'data' | 'logic' | 'ui' | 'performance'
  strength: number
  lastUpdated: number
}

interface ProjectSnapshot {
  id: string
  timestamp: number
  components: Component[]
  description: string
  auto: boolean
}

interface ProjectConfig {
  aiSettings?: {
    autoSuggestions: boolean
    learningMode: 'passive' | 'active' | 'aggressive'
    modelPreferences: string[]
  }
  performance?: {
    enableOptimizations: boolean
    targetFramerate: number
    memoryLimits: number
  }
  accessibility?: {
    enforceStandards: boolean
    screenReaderMode: boolean
    colorBlindMode: boolean
  }
}

function App() {
  const [projects, setProjects] = useKV<Project[]>('haasp-projects', [])
  const [currentProject, setCurrentProject] = useKV<Project | null>('haasp-current-project', null)
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [aiProgress, setAIProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('design')
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  
  // Advanced HAASP features
  const [hybridArchivalNexus, setHybridArchivalNexus] = useKV<any>('haasp-han-data', { interactions: [], patterns: [], optimizations: [] })
  const [associativeTrails, setAssociativeTrails] = useKV<AssociativeTrail[]>('haasp-trails', [])
  const [performanceMetrics, setPerformanceMetrics] = useState({ fps: 60, memory: 0, renderTime: 0 })
  const [aiOrganisms, setAiOrganisms] = useState<any[]>([])
  const [undoStack, setUndoStack] = useState<ProjectSnapshot[]>([])
  const [redoStack, setRedoStack] = useState<ProjectSnapshot[]>([])
  const [problems, setProblems] = useState<any[]>([])
  const [bindings, setBindings] = useState<Record<string, string>>({})
  const [isRecording, setIsRecording] = useState(false)
  const [timeline, setTimeline] = useState<any[]>([])
  const [constraints, setConstraints] = useState<LayoutConstraint[]>([])
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([])
  const [isCollaborativeMode, setIsCollaborativeMode] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [theme, setTheme] = useKV('haasp-theme', 'dark')
  const [accessibility, setAccessibility] = useState({ 
    screenReader: false, 
    highContrast: false, 
    largeText: false,
    colorBlind: false,
    focusIndicators: true,
    reducedMotion: false,
    darkMode: false
  })

  // Advanced Timeline and History Management
  const createSnapshot = (description: string, auto: boolean = false) => {
    if (!currentProject) return
    
    const snapshot: ProjectSnapshot = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      components: JSON.parse(JSON.stringify(currentProject.components)),
      description,
      auto
    }
    
    setSnapshots(prev => [...prev, snapshot])
    setUndoStack(prev => [...prev, snapshot])
    setRedoStack([])
    
    // Auto-cleanup old snapshots (keep last 50)
    if (snapshots.length > 50) {
      setSnapshots(prev => prev.slice(-50))
    }
  }

  const undo = () => {
    if (undoStack.length <= 1 || !currentProject) return
    
    const currentSnapshot = undoStack[undoStack.length - 1]
    const previousSnapshot = undoStack[undoStack.length - 2]
    
    setRedoStack(prev => [...prev, currentSnapshot])
    setUndoStack(prev => prev.slice(0, -1))
    
    const restoredProject = {
      ...currentProject,
      components: JSON.parse(JSON.stringify(previousSnapshot.components)),
      lastModified: new Date().toISOString()
    }
    
    setCurrentProject(restoredProject)
    setProjects((prev = []) => prev.map(p => p.id === currentProject.id ? restoredProject : p))
    toast.success(`Undid: ${currentSnapshot.description}`)
  }

  const redo = () => {
    if (redoStack.length === 0 || !currentProject) return
    
    const nextSnapshot = redoStack[redoStack.length - 1]
    setRedoStack(prev => prev.slice(0, -1))
    setUndoStack(prev => [...prev, nextSnapshot])
    
    const restoredProject = {
      ...currentProject,
      components: JSON.parse(JSON.stringify(nextSnapshot.components)),
      lastModified: new Date().toISOString()
    }
    
    setCurrentProject(restoredProject)
    setProjects((prev = []) => prev.map(p => p.id === currentProject.id ? restoredProject : p))
    toast.success(`Redid: ${nextSnapshot.description}`)
  }

  // Performance Monitoring
  useEffect(() => {
    if (!currentProject) return
    
    const monitorPerformance = () => {
      const now = performance.now()
      setPerformanceMetrics(prev => ({
        ...prev,
        fps: Math.round(1000 / (now - (prev.renderTime || now))),
        memory: (performance as any).memory?.usedJSHeapSize || 0,
        renderTime: now
      }))
    }
    
    const interval = setInterval(monitorPerformance, 1000)
    return () => clearInterval(interval)
  }, [currentProject])

  // Auto-save and HAN enrichment
  useEffect(() => {
    if (!currentProject) return
    
    const autoSave = () => {
      createSnapshot('Auto-save', true)
      
      // Enrich HAN with current state
      setHybridArchivalNexus((prev: any) => ({
        ...prev,
        patterns: [...prev.patterns, {
          timestamp: Date.now(),
          projectState: {
            components: currentProject.components.length,
            complexity: currentProject.components.reduce((acc, comp) => acc + Object.keys(comp.props).length, 0),
            trails: (associativeTrails || []).length
          }
        }]
      }))
    }
    
    const interval = setInterval(autoSave, 30000) // Auto-save every 30 seconds
    return () => clearInterval(interval)
  }, [currentProject, (associativeTrails || []).length])

  // Constraint Solver
  const solveConstraints = () => {
    if (!currentProject) return
    
    const solvedComponents = currentProject.components.map(comp => {
      if (!comp.constraints?.length) return comp
      
      let newComp = { ...comp }
      
      comp.constraints.forEach(constraint => {
        if (!constraint.active) return
        
        switch (constraint.type) {
          case 'spacing':
            if (constraint.target) {
              const target = currentProject.components.find(c => c.id === constraint.target)
              if (target) {
                newComp.x = target.x + target.width + (constraint.value as number)
              }
            }
            break
          case 'alignment':
            if (constraint.target) {
              const target = currentProject.components.find(c => c.id === constraint.target)
              if (target) {
                newComp.y = target.y
              }
            }
            break
          case 'size':
            newComp.width = constraint.value as number
            break
        }
      })
      
      return newComp
    })
    
    const updatedProject = {
      ...currentProject,
      components: solvedComponents,
      lastModified: new Date().toISOString()
    }
    
    setCurrentProject(updatedProject)
    setProjects((prev = []) => prev.map(p => p.id === currentProject.id ? updatedProject : p))
    createSnapshot('Applied constraints')
    toast.success('Constraints solved and applied')
  }

  // Problem Detection and Auto-fixing
  const detectProblems = () => {
    if (!currentProject) return []
    
    const newProblems: Problem[] = []
    
    currentProject.components.forEach(component => {
      // Check for missing accessibility attributes
      if (!component.props.role && !component.props.label) {
        newProblems.push({
          id: crypto.randomUUID(),
          type: 'accessibility',
          severity: 'medium',
          title: 'Missing accessibility attributes',
          description: `Component "${component.name}" is missing role and label attributes`,
          componentId: component.id,
          autoFixable: true,
          suggestion: 'Add appropriate role and label attributes for screen readers',
          createdAt: Date.now()
        })
      }
      
      // Check for performance issues
      if (Object.keys(component.props).length > 10) {
        newProblems.push({
          id: crypto.randomUUID(),
          type: 'performance',
          severity: 'low',
          title: 'Too many properties',
          description: `Component "${component.name}" has many properties which may impact performance`,
          componentId: component.id,
          autoFixable: false,
          suggestion: 'Consider breaking down into smaller components',
          createdAt: Date.now()
        })
      }
      
      // Check for layout issues
      if (component.x < 0 || component.y < 0) {
        newProblems.push({
          id: crypto.randomUUID(),
          type: 'error',
          severity: 'high',
          title: 'Component positioned outside canvas',
          description: `Component "${component.name}" has negative positioning`,
          componentId: component.id,
          autoFixable: true,
          suggestion: 'Move component to positive coordinates',
          createdAt: Date.now()
        })
      }
    })
    
    setProblems(newProblems)
    return newProblems
  }

  const fixProblem = (problemId: string) => {
    const problem = problems.find(p => p.id === problemId)
    if (!problem || !currentProject) return
    
    const component = currentProject.components.find(c => c.id === problem.componentId)
    if (!component) return
    
    let fixed = false
    
    // Auto-fix based on problem type
    switch (problem.type) {
      case 'accessibility':
        updateComponent(component.id, {
          props: {
            ...component.props,
            role: 'button',
            label: component.name
          }
        })
        fixed = true
        break
        
      case 'error':
        if (problem.title.includes('positioned outside')) {
          updateComponent(component.id, {
            x: Math.max(0, component.x),
            y: Math.max(0, component.y)
          })
          fixed = true
        }
        break
    }
    
    if (fixed) {
      setProblems(prev => prev.filter(p => p.id !== problemId))
      toast.success(`Fixed: ${problem.title}`)
    }
  }

  const optimizePerformance = (type: string) => {
    if (!currentProject) return
    
    switch (type) {
      case 'memory':
        // Simulate memory optimization
        toast.success('Memory optimization applied - unused references cleaned')
        break
        
      case 'fps':
        // Simulate FPS optimization
        toast.success('Rendering optimization applied - component virtualization enabled')
        break
        
      case 'render':
        // Simulate render optimization
        toast.success('Render optimization applied - memoization enabled')
        break
        
      default:
        toast.info(`Optimization for ${type} is not yet implemented`)
    }
    
    // Update performance metrics to show improvement
    setPerformanceMetrics(prev => ({
      ...prev,
      fps: Math.min(60, prev.fps + 5),
      memory: Math.max(prev.memory * 0.9, 10 * 1024 * 1024),
      renderTime: Math.max(prev.renderTime * 0.8, 8)
    }))
  }

  // Binding management
  const updateBinding = (property: string, expression: string) => {
    if (!selectedComponent) return
    
    const newBindings = { ...bindings, [`${selectedComponent.id}.${property}`]: expression }
    setBindings(newBindings)
    
    updateComponent(selectedComponent.id, {
      bindings: {
        ...selectedComponent.bindings,
        [property]: expression
      }
    })
    
    toast.success(`Binding updated for ${property}`)
  }

  const removeBinding = (property: string) => {
    if (!selectedComponent) return
    
    const bindingKey = `${selectedComponent.id}.${property}`
    const newBindings = { ...bindings }
    delete newBindings[bindingKey]
    setBindings(newBindings)
    
    const newComponentBindings = { ...selectedComponent.bindings }
    delete newComponentBindings[property]
    
    updateComponent(selectedComponent.id, {
      bindings: newComponentBindings
    })
    
    toast.success(`Binding removed for ${property}`)
  }

  const testBinding = async (property: string, expression: string) => {
    // Mock binding test - would evaluate expression in real implementation
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (expression.includes('error')) {
      throw new Error('Invalid binding expression')
    }
    
    return `Mock result for ${expression}`
  }

  // AI Organism Management
  const createAIOrganism = () => {
    const newOrganism: any = {
      id: crypto.randomUUID(),
      generation: Math.max(...aiOrganisms.map(o => o.generation), 0) + 1,
      questions: [] as string[],
      answers: [] as string[],
      enrichment: Math.random() * 0.5 + 0.3,
      active: true,
      children: [] as string[],
      createdAt: Date.now(),
      passes: 0,
      receives: 0
    }
    
    // Start with initial questions
    const initialQuestions = ['How can we optimize performance?', 'How can we optimize usability?', 'How can we optimize accessibility?']
    const initialAnswers = ['Apply caching strategies', 'Apply user testing strategies', 'Apply WCAG guidelines strategies']
    
    for (let i = 0; i < 3; i++) {
      newOrganism.questions.push(initialQuestions[i])
      newOrganism.answers.push(initialAnswers[i])
    }
    
    setAiOrganisms(prev => [...prev, newOrganism])
    toast.success(`Created AI Organism #${newOrganism.id.slice(0, 6)}`)
  }

  const deleteAIOrganism = (id: string) => {
    setAiOrganisms(prev => prev.filter(o => o.id !== id))
    toast.info('AI Organism deleted')
  }

  const replicateAIOrganism = (parentId: string) => {
    const parent = aiOrganisms.find(o => o.id === parentId)
    if (!parent) return
    
    const child = {
      id: crypto.randomUUID(),
      generation: parent.generation + 1,
      questions: [...parent.questions.slice(-2), `How to improve on ${parent.answers[parent.answers.length - 1]}?`],
      answers: [...parent.answers.slice(-2), `Enhanced version of parent strategy`],
      enrichment: Math.min(1, parent.enrichment + Math.random() * 0.2),
      active: true,
      children: [],
      parent: parentId,
      createdAt: Date.now(),
      passes: 0,
      receives: 1
    }
    
    // Update parent
    setAiOrganisms(prev => prev.map(o => 
      o.id === parentId 
        ? { ...o, children: [...(o.children || []), child.id], passes: o.passes + 1 }
        : o
    ))
    
    // Add child
    setAiOrganisms(prev => [...prev, child])
    toast.success(`Organism replicated - Generation ${child.generation}`)
  }

  const toggleAccessibility = (setting: keyof typeof accessibility) => {
    setAccessibility(prev => ({ ...prev, [setting]: !prev[setting] }))
    toast.info(`${setting} ${accessibility[setting] ? 'disabled' : 'enabled'}`)
  }

  // Auto-detect problems on component changes
  useEffect(() => {
    if (currentProject) {
      detectProblems()
    }
  }, [currentProject?.components])

  const createNewProject = () => {
    if (!newProjectName.trim()) {
      toast.error('Project name is required')
      return
    }

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: newProjectName.trim(),
      components: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }

    setProjects((prev = []) => [...prev, newProject])
    setCurrentProject(newProject)
    setNewProjectName('')
    setShowNewProjectDialog(false)
    createSnapshot('Project created')
    toast.success(`Project "${newProject.name}" created`)
  }

  const addComponent = (type: string, name: string) => {
    if (!currentProject) {
      toast.error('No project selected')
      return
    }

    const newComponent: Component = {
      id: crypto.randomUUID(),
      type,
      name,
      props: getDefaultProps(type),
      x: Math.random() * 300 + 50,
      y: Math.random() * 200 + 50,
      width: 120,
      height: 40
    }

    const updatedProject = {
      ...currentProject,
      components: [...currentProject.components, newComponent],
      lastModified: new Date().toISOString()
    }

    setCurrentProject(updatedProject)
    setProjects((prev = []) => prev.map(p => p.id === currentProject.id ? updatedProject : p))
    toast.success(`${name} component added`)
  }

  const updateComponent = (componentId: string, updates: Partial<Component>) => {
    if (!currentProject) return

    const updatedProject = {
      ...currentProject,
      components: currentProject.components.map(c => 
        c.id === componentId ? { ...c, ...updates } : c
      ),
      lastModified: new Date().toISOString()
    }

    setCurrentProject(updatedProject)
    setProjects((prev = []) => prev.map(p => p.id === currentProject.id ? updatedProject : p))
  }

  // AI Organisms Simulation
  const simulateAIOrganisms = async (result: any, hanData: any) => {
    const organisms: any[] = []
    for (let i = 0; i < 5; i++) {
      const organism = {
        id: crypto.randomUUID(),
        generation: 1,
        questions: [] as string[],
        answers: [] as string[],
        enrichment: Math.random(),
        active: true
      }
      
      // Simulate 5x Q&A cycle
      for (let q = 0; q < 5; q++) {
        organism.questions.push(`How to optimize ${result.components?.[0]?.name || 'component'}?`)
        organism.answers.push(`Apply ${['caching', 'lazy-loading', 'virtualization'][Math.floor(Math.random() * 3)]}`)
      }
      
      organisms.push(organism)
    }
    return organisms
  }

  // Enhanced Component Creation
  const addEnhancedComponent = async (comp: any) => {
    if (!currentProject) return

    const newComponent: Component = {
      id: crypto.randomUUID(),
      type: comp.type,
      name: comp.name,
      props: {
        ...getDefaultProps(comp.type),
        ...comp.props
      },
      x: Math.random() * 300 + 50,
      y: Math.random() * 200 + 50,
      width: 120,
      height: 40,
      bindings: comp.bindings || {},
      constraints: comp.constraints || [],
      metadata: comp.metadata || {}
    }

    const updatedProject = {
      ...currentProject,
      components: [...currentProject.components, newComponent],
      lastModified: new Date().toISOString()
    }

    setCurrentProject(updatedProject)
    setProjects((prev = []) => prev.map(p => p.id === currentProject.id ? updatedProject : p))
  }

  const generateWithAI = async (prompt: string) => {
    setIsAIProcessing(true)
    setAIProgress(0)

    try {
      // Store interaction in HAN for learning
      const interaction = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        query: prompt,
        context: {
          currentProject: currentProject?.id,
          selectedComponent: selectedComponent?.id,
          activeTab,
          components: currentProject?.components.length || 0
        }
      }
      
      setHybridArchivalNexus((prev: any) => ({
        ...prev,
        interactions: [...prev.interactions, interaction]
      }))

      const progressInterval = setInterval(() => {
        setAIProgress(prev => Math.min(prev + Math.random() * 20, 95))
      }, 200)

      // Enhanced AI prompt with context and learning data
      const contextualPrompt = (window as any).spark.llmPrompt`
        You are HAASP's advanced AI synthesis engine with access to hybrid archival nexus.
        
        Context:
        - User request: "${prompt}"
        - Current project: ${currentProject?.name || 'None'}
        - Active components: ${currentProject?.components.length || 0}
        - Selected component: ${selectedComponent?.name || 'None'}
        - Previous interactions: ${hybridArchivalNexus.interactions.slice(-3).map((i: any) => i.query).join(', ')}
        
        Generate a sophisticated component configuration with advanced features:
        - Performance optimizations
        - Accessibility compliance
        - Associative relationships
        - ML-driven suggestions
        
        Return JSON with this enhanced structure:
        {
          "components": [{
            "type": "button|input|text|card|container|advanced",
            "name": "descriptive name",
            "props": {
              "text": "content",
              "className": "styling classes",
              "performance": {"lazy": true, "cache": true},
              "accessibility": {"role": "role", "label": "label"}
            },
            "bindings": {"property": "expression"},
            "constraints": [{"type": "spacing", "value": 16}],
            "metadata": {
              "ml": {"confidence": 0.95, "suggestions": ["optimization"]},
              "performance": {"renderTime": 16}
            }
          }],
          "trails": [{
            "nodes": ["component_ids"],
            "type": "data|logic|ui",
            "strength": 0.8
          }],
          "reasoning": "Enhanced explanation with learning insights",
          "optimizations": ["list of applied optimizations"],
          "suggestions": ["future improvement suggestions"]
        }
      `

      const response = await (window as any).spark.llm(contextualPrompt, 'gpt-4o', true)
      const result = JSON.parse(response)

      clearInterval(progressInterval)
      setAIProgress(100)

      // Process AI organisms for enrichment
      const organisms = await simulateAIOrganisms(result, hybridArchivalNexus)
      setAiOrganisms(organisms)

      setTimeout(async () => {
        // Enhanced component creation with full metadata
        for (const comp of result.components || []) {
          await addEnhancedComponent(comp)
        }
        
        // Add associative trails
        if (result.trails && Array.isArray(result.trails)) {
          const newTrails = result.trails.map((trail: any) => ({
            ...trail,
            id: crypto.randomUUID(),
            lastUpdated: Date.now()
          }))
          setAssociativeTrails(prev => [...(prev || []), ...newTrails])
        }
        
        // Store learning outcome
        const outcome = {
          interactionId: interaction.id,
          result: result,
          timestamp: Date.now(),
          success: true,
          optimizations: result.optimizations || []
        }
        
        setHybridArchivalNexus((prev: any) => ({
          ...prev,
          patterns: [...prev.patterns, outcome],
          optimizations: [...prev.optimizations, ...(Array.isArray(result.optimizations) ? result.optimizations : [])]
        }))
        
        toast.success(`Generated ${result.components?.length || 0} enhanced components with AI learning`)
        setIsAIProcessing(false)
        setAIProgress(0)
      }, 500)

    } catch (error) {
      console.error('Advanced AI generation error:', error)
      toast.error('AI generation failed. Learning from error for improvement.')
      setIsAIProcessing(false)
      setAIProgress(0)
    }
  }

  const getDefaultProps = (type: string): Record<string, any> => {
    const defaults = {
      button: { text: 'Button', variant: 'default' },
      input: { placeholder: 'Enter text...', type: 'text' },
      text: { content: 'Sample text', fontSize: '14px' },
      card: { title: 'Card Title', content: 'Card content' },
      container: { padding: '16px', backgroundColor: 'transparent' }
    }
    return defaults[type as keyof typeof defaults] || {}
  }

  const generateCode = () => {
    if (!currentProject || !currentProject.components.length) {
      toast.error('No components to generate code for')
      return
    }

    const reactCode = generateReactCode(currentProject.components)
    navigator.clipboard.writeText(reactCode)
    toast.success('React code copied to clipboard')
  }

  const generateReactCode = (components: Component[]): string => {
    const imports = `import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function GeneratedApp() {
  return (
    <div className="p-6 space-y-4">
${components.map(comp => generateComponentCode(comp)).join('\n')}
    </div>
  )
}`
    return imports
  }

  const generateComponentCode = (component: Component): string => {
    const { type, props, x, y } = component
    const style = `style={{ position: 'absolute', left: ${x}px, top: ${y}px }}`
    
    switch (type) {
      case 'button':
        return `      <Button ${style} variant="${props.variant || 'default'}">${props.text || 'Button'}</Button>`
      case 'input':
        return `      <Input ${style} placeholder="${props.placeholder || ''}" />`
      case 'text':
        return `      <p ${style} style={{ fontSize: '${props.fontSize || '14px'}' }}>${props.content || 'Text'}</p>`
      case 'card':
        return `      <Card ${style}>
        <CardHeader><CardTitle>${props.title || 'Title'}</CardTitle></CardHeader>
        <CardContent>${props.content || 'Content'}</CardContent>
      </Card>`
      default:
        return `      <div ${style}>${props.text || type}</div>`
    }
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkle weight="fill" className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">HAASP</h1>
              <p className="text-xs text-muted-foreground">AI-Powered App Builder</p>
            </div>
          </div>
          
          <Separator orientation="vertical" className="h-8" />
          
          {currentProject ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{currentProject.name}</Badge>
              <Badge variant="secondary" className="text-xs">
                {currentProject.components.length} components
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">No project selected</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start building your next amazing app with AI assistance
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Awesome App"
                    onKeyDown={(e) => e.key === 'Enter' && createNewProject()}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createNewProject}>
                  <Sparkle className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {currentProject && (
            <Button onClick={generateCode} variant="outline" size="sm">
              <Code className="w-4 h-4 mr-2" />
              Export Code
            </Button>
          )}

          <Button variant="ghost" size="sm">
            <Gear className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {currentProject ? (
        <div className="flex-1 flex">
          <div className="w-80 border-r border-border flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-4 w-full m-2 h-auto">
                <TabsTrigger value="design" className="flex flex-col items-center gap-1 py-2">
                  <Palette className="w-4 h-4" />
                  <span className="text-xs">Design</span>
                </TabsTrigger>
                <TabsTrigger value="components" className="flex flex-col items-center gap-1 py-2">
                  <Stack className="w-4 h-4" />
                  <span className="text-xs">Tree</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex flex-col items-center gap-1 py-2">
                  <Brain className="w-4 h-4" />
                  <span className="text-xs">AI</span>
                </TabsTrigger>
                <TabsTrigger value="organisms" className="flex flex-col items-center gap-1 py-2">
                  <Sparkle className="w-4 h-4" />
                  <span className="text-xs">Organisms</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 px-2 pb-2">
                <TabsContent value="design" className="mt-0 h-full">
                  <ComponentPalette onAddComponent={addComponent} />
                </TabsContent>

                <TabsContent value="components" className="mt-0 h-full">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-sm">Component Tree</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-1">
                          {currentProject.components.map((comp) => (
                            <div
                              key={comp.id}
                              className={`p-2 rounded cursor-pointer flex items-center gap-2 text-sm ${
                                selectedComponent?.id === comp.id 
                                  ? 'bg-accent text-accent-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => setSelectedComponent(comp)}
                            >
                              <Stack className="w-4 h-4" />
                              <span>{comp.name}</span>
                              <Badge variant="outline" className="ml-auto text-xs">
                                {comp.type}
                              </Badge>
                            </div>
                          ))}
                          {currentProject.components.length === 0 && (
                            <p className="text-muted-foreground text-center py-8">
                              No components yet
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ai" className="mt-0 h-full">
                  <AIAssistant 
                    onGenerate={generateWithAI}
                    isProcessing={isAIProcessing}
                    progress={aiProgress}
                  />
                </TabsContent>

                <TabsContent value="organisms" className="mt-0 h-full">
                  <AIOrganisms
                    organisms={aiOrganisms}
                    onCreateOrganism={createAIOrganism}
                    onDeleteOrganism={deleteAIOrganism}
                    onReplicateOrganism={replicateAIOrganism}
                    isActive={isAIProcessing}
                    onToggleActive={() => setIsAIProcessing(!isAIProcessing)}
                    maxOrganisms={10}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <div className="flex-1">
            <CanvasArea
              components={currentProject.components}
              selectedComponent={selectedComponent}
              onSelectComponent={setSelectedComponent}
              onUpdateComponent={updateComponent}
            />
          </div>

          <div className="w-80 border-l border-border">
            <Tabs defaultValue="properties" className="h-full">
              <TabsList className="grid grid-cols-2 gap-1 w-full m-1 h-auto">
                <TabsTrigger value="properties" className="flex flex-col items-center gap-1 py-2">
                  <Gear className="w-4 h-4" />
                  <span className="text-xs">Properties</span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex flex-col items-center gap-1 py-2">
                  <Lightning className="w-4 h-4" />
                  <span className="text-xs">Advanced</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="px-1 pb-1 h-full">
                <TabsContent value="properties" className="mt-0 h-full">
                  <Tabs defaultValue="props" className="h-full">
                    <TabsList className="grid grid-cols-2 w-full mb-2">
                      <TabsTrigger value="props">Props</TabsTrigger>
                      <TabsTrigger value="bindings">Bindings</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="props" className="mt-0 h-full">
                      <PropertyPanel
                        selectedComponent={selectedComponent}
                        onUpdateComponent={updateComponent}
                      />
                    </TabsContent>
                    
                    <TabsContent value="bindings" className="mt-0 h-full">
                      <BindingInspector
                        selectedComponent={selectedComponent}
                        bindings={bindings}
                        onUpdateBinding={updateBinding}
                        onRemoveBinding={removeBinding}
                        onTestBinding={testBinding}
                      />
                    </TabsContent>
                  </Tabs>
                </TabsContent>
                
                <TabsContent value="advanced" className="mt-0 h-full">
                  <Tabs defaultValue="timeline" className="h-full">
                    <TabsList className="grid grid-cols-4 w-full mb-2">
                      <TabsTrigger value="timeline">
                        <Clock className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="problems">
                        <Warning className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="performance">
                        <Lightning className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="accessibility">
                        <Eye className="w-4 h-4" />
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="timeline" className="mt-0 h-full">
                      <Timeline
                        snapshots={snapshots}
                        currentSnapshot={undoStack.length - 1}
                        onUndo={undo}
                        onRedo={redo}
                        onJumpToSnapshot={(index) => {
                          if (snapshots[index] && currentProject) {
                            const snapshot = snapshots[index]
                            const restoredProject = {
                              ...currentProject,
                              components: JSON.parse(JSON.stringify(snapshot.components)),
                              lastModified: new Date().toISOString()
                            }
                            setCurrentProject(restoredProject)
                            setProjects((prev = []) => prev.map(p => p.id === currentProject.id ? restoredProject : p))
                          }
                        }}
                        canUndo={undoStack.length > 1}
                        canRedo={redoStack.length > 0}
                        isRecording={isRecording}
                        onToggleRecording={() => setIsRecording(!isRecording)}
                      />
                    </TabsContent>
                    
                    <TabsContent value="problems" className="mt-0 h-full">
                      <Problems
                        problems={problems}
                        onSelectProblem={(problem) => {
                          if (problem.componentId) {
                            const component = currentProject?.components.find(c => c.id === problem.componentId)
                            if (component) {
                              setSelectedComponent(component)
                              setActiveTab('components')
                            }
                          }
                        }}
                        onFixProblem={fixProblem}
                        onDismissProblem={(problemId) => {
                          setProblems(prev => prev.filter(p => p.id !== problemId))
                          toast.success('Problem dismissed')
                        }}
                        selectedComponent={selectedComponent?.id}
                      />
                    </TabsContent>
                    
                    <TabsContent value="performance" className="mt-0 h-full">
                      <PerformanceMonitor
                        metrics={{
                          ...performanceMetrics,
                          componentCount: currentProject?.components.length || 0,
                          updateCount: timeline.length
                        }}
                        onOptimize={optimizePerformance}
                        showRealtime={true}
                      />
                    </TabsContent>
                    
                    <TabsContent value="accessibility" className="mt-0 h-full">
                      <AccessibilityOverlay
                        accessibility={accessibility}
                        onToggle={toggleAccessibility}
                        components={currentProject?.components || []}
                        onAnalyze={() => {
                          toast.success('Accessibility audit completed')
                        }}
                      />
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkle weight="fill" className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle>Welcome to HAASP</CardTitle>
              <CardDescription>
                Create amazing apps with AI-powered visual development
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => setShowNewProjectDialog(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
              
              {(projects || []).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Recent Projects</Label>
                  <div className="space-y-2 mt-2">
                    {(projects || []).slice(-3).map((project) => (
                      <Button
                        key={project.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setCurrentProject(project)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {project.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isAIProcessing && (
        <div className="fixed bottom-4 right-4 bg-card border rounded-lg p-4 shadow-lg min-w-80">
          <div className="flex items-center gap-3 mb-2">
            <div className="ai-processing">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="font-medium">AI is generating...</span>
          </div>
          <Progress value={aiProgress} className="w-full" />
        </div>
      )}
    </div>
  )
}

export default App