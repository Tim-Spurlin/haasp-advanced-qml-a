import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Brain, 
  Lightning, 
  Play, 
  Pause, 
  X, 
  Plus,
  ArrowRight,
  Sparkle,
  CircleDashed
} from '@phosphor-icons/react'
import { useState, useEffect } from 'react'

interface AIOrganism {
  id: string
  generation: number
  questions: string[]
  answers: string[]
  enrichment: number
  active: boolean
  children?: string[]
  parent?: string
  createdAt: number
  deletedAt?: number
  passes: number
  receives: number
}

interface AIOrganismsProps {
  organisms: AIOrganism[]
  onCreateOrganism: () => void
  onDeleteOrganism: (id: string) => void
  onReplicateOrganism: (id: string) => void
  isActive: boolean
  onToggleActive: () => void
  maxOrganisms?: number
}

export default function AIOrganisms({
  organisms,
  onCreateOrganism,
  onDeleteOrganism,
  onReplicateOrganism,
  isActive,
  onToggleActive,
  maxOrganisms = 10
}: AIOrganismsProps) {
  const [selectedOrganism, setSelectedOrganism] = useState<AIOrganism | null>(null)
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalAnswers: 0,
    avgEnrichment: 0,
    generations: 0
  })

  // Calculate statistics
  useEffect(() => {
    const activeOrganisms = organisms.filter(o => o.active)
    const totalQuestions = activeOrganisms.reduce((sum, o) => sum + o.questions.length, 0)
    const totalAnswers = activeOrganisms.reduce((sum, o) => sum + o.answers.length, 0)
    const avgEnrichment = activeOrganisms.length > 0 
      ? activeOrganisms.reduce((sum, o) => sum + o.enrichment, 0) / activeOrganisms.length 
      : 0
    const generations = Math.max(...organisms.map(o => o.generation), 0)

    setStats({
      totalQuestions,
      totalAnswers,
      avgEnrichment,
      generations
    })
  }, [organisms])

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  const getOrganismColor = (organism: AIOrganism) => {
    if (!organism.active) return 'text-gray-400'
    if (organism.enrichment > 0.8) return 'text-green-500'
    if (organism.enrichment > 0.6) return 'text-blue-500'
    if (organism.enrichment > 0.4) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getGenerationColor = (generation: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800'
    ]
    return colors[generation % colors.length]
  }

  const shouldDelete = (organism: AIOrganism) => {
    // Deletion criteria: 2 receives + passes, or low enrichment over time
    return organism.receives >= 2 && organism.passes >= 2 && organism.enrichment < 0.3
  }

  const canReplicate = (organism: AIOrganism) => {
    return organism.active && organism.enrichment > 0.7 && organism.questions.length >= 5
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="w-4 h-4" />
          AI Organisms
          <Badge variant={isActive ? 'default' : 'secondary'} className="ml-auto">
            {organisms.filter(o => o.active).length}/{maxOrganisms}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Panel */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isActive ? 'default' : 'outline'}
            onClick={onToggleActive}
            className="flex-1"
          >
            {isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isActive ? 'Pause' : 'Start'} Simulation
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onCreateOrganism}
            disabled={organisms.filter(o => o.active).length >= maxOrganisms}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-2 bg-muted rounded">
            <div className="font-bold text-lg">{stats.totalQuestions}</div>
            <div className="text-xs text-muted-foreground">Questions</div>
          </div>
          <div className="p-2 bg-muted rounded">
            <div className="font-bold text-lg">{stats.totalAnswers}</div>
            <div className="text-xs text-muted-foreground">Answers</div>
          </div>
          <div className="p-2 bg-muted rounded">
            <div className="font-bold text-lg">{(stats.avgEnrichment * 100).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Avg Enrichment</div>
          </div>
          <div className="p-2 bg-muted rounded">
            <div className="font-bold text-lg">Gen {stats.generations}</div>
            <div className="text-xs text-muted-foreground">Generation</div>
          </div>
        </div>

        <Separator />

        {/* Organisms List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {organisms.map((organism) => (
              <div
                key={organism.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedOrganism?.id === organism.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted'
                } ${!organism.active ? 'opacity-50' : ''}`}
                onClick={() => setSelectedOrganism(organism)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CircleDashed 
                      className={`w-4 h-4 ${getOrganismColor(organism)} ${
                        organism.active && isActive ? 'animate-spin' : ''
                      }`} 
                    />
                    <span className="font-medium text-sm">
                      Organism #{organism.id.slice(0, 6)}
                    </span>
                    <Badge className={`text-xs ${getGenerationColor(organism.generation)}`}>
                      Gen {organism.generation}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-1">
                    {canReplicate(organism) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          onReplicateOrganism(organism.id)
                        }}
                        className="h-6 px-2"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                    
                    {(shouldDelete(organism) || !organism.active) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteOrganism(organism.id)
                        }}
                        className="h-6 px-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Enrichment</span>
                    <span>{(organism.enrichment * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={organism.enrichment * 100} className="h-1" />
                  
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>Q: {organism.questions.length}</div>
                    <div>A: {organism.answers.length}</div>
                    <div>P/R: {organism.passes}/{organism.receives}</div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Created {formatTime(organism.createdAt)}
                  </div>
                  
                  {shouldDelete(organism) && (
                    <Badge variant="destructive" className="text-xs">
                      Marked for deletion
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            
            {organisms.length === 0 && (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No AI organisms yet</p>
                <p className="text-xs text-muted-foreground">
                  Create your first organism to start the enrichment process
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Selected Organism Details */}
        {selectedOrganism && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-2">
              Organism #{selectedOrganism.id.slice(0, 6)} Details
            </h4>
            
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <span>Generation:</span>
                <span>{selectedOrganism.generation}</span>
                
                <span>Active:</span>
                <span>{selectedOrganism.active ? 'Yes' : 'No'}</span>
                
                <span>Passes:</span>
                <span>{selectedOrganism.passes}</span>
                
                <span>Receives:</span>
                <span>{selectedOrganism.receives}</span>
              </div>
              
              <Separator />
              
              <div>
                <span className="font-medium">Recent Questions:</span>
                <ScrollArea className="h-20 mt-1">
                  <div className="space-y-1">
                    {selectedOrganism.questions.slice(-3).map((question, index) => (
                      <div key={index} className="text-muted-foreground">
                        • {question}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              <div>
                <span className="font-medium">Recent Answers:</span>
                <ScrollArea className="h-20 mt-1">
                  <div className="space-y-1">
                    {selectedOrganism.answers.slice(-3).map((answer, index) => (
                      <div key={index} className="text-muted-foreground">
                        • {answer}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>
            {isActive ? (
              <><Lightning className="w-3 h-3 inline mr-1" />Active</>
            ) : (
              'Simulation paused'
            )}
          </span>
          <span>{organisms.filter(o => shouldDelete(o)).length} pending deletion</span>
        </div>
      </CardContent>
    </Card>
  )
}