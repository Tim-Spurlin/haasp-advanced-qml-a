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
import { Plus, Play, Code, Palette, Stack, ChatCircle, Gear, Sparkle, Lightning, Brain } from '@phosphor-icons/react'
import { toast } from 'sonner'
import ComponentPalette from './components/ComponentPalette'
import CanvasArea from './components/CanvasArea'
import PropertyPanel from './components/PropertyPanel'
import AIAssistant from './components/AIAssistant'

interface Component {
  id: string
  type: string
  name: string
  props: Record<string, any>
  x: number
  y: number
  width: number
  height: number
}

interface Project {
  id: string
  name: string
  components: Component[]
  createdAt: string
  lastModified: string
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

  const generateWithAI = async (prompt: string) => {
    setIsAIProcessing(true)
    setAIProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setAIProgress(prev => Math.min(prev + Math.random() * 20, 95))
      }, 200)

      const aiPrompt = (window as any).spark.llmPrompt`
        You are HAASP's AI component generator. Based on this user request: "${prompt}"

        Generate a realistic UI component configuration. Return valid JSON with this structure:
        {
          "components": [
            {
              "type": "button|input|text|card|container",
              "name": "descriptive name",
              "props": {
                "text": "content",
                "placeholder": "hint text",
                "className": "styling classes"
              }
            }
          ],
          "reasoning": "Brief explanation of choices made"
        }

        Focus on practical, useful components that match the user's intent.
      `

      const response = await (window as any).spark.llm(aiPrompt, 'gpt-4o', true)
      const result = JSON.parse(response)

      clearInterval(progressInterval)
      setAIProgress(100)

      setTimeout(() => {
        result.components.forEach((comp: any) => {
          addComponent(comp.type, comp.name)
        })
        
        toast.success(`Generated ${result.components.length} components`)
        setIsAIProcessing(false)
        setAIProgress(0)
      }, 500)

    } catch (error) {
      console.error('AI generation error:', error)
      toast.error('AI generation failed. Please try again.')
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
              <TabsList className="grid grid-cols-3 w-full m-4">
                <TabsTrigger value="design" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Design
                </TabsTrigger>
                <TabsTrigger value="components" className="flex items-center gap-2">
                  <Stack className="w-4 h-4" />
                  Tree
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 px-4 pb-4">
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
            <PropertyPanel
              selectedComponent={selectedComponent}
              onUpdateComponent={updateComponent}
            />
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