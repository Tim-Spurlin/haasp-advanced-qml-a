import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Brain, PaperPlaneTilt, Sparkle } from '@phosphor-icons/react'

interface AIAssistantProps {
  onGenerate: (prompt: string) => Promise<void>
  isProcessing: boolean
  progress: number
}

const EXAMPLE_PROMPTS = [
  "Create a login form with email and password fields",
  "Build a dashboard with cards showing statistics",
  "Design a contact form with name, email, and message",
  "Make a product card with image, title, and price",
  "Generate a navigation menu with multiple links"
]

const AI_CAPABILITIES = [
  { name: "Component Generation", description: "Creates UI components from descriptions", icon: Sparkle },
  { name: "Layout Assistance", description: "Suggests optimal layouts and spacing", icon: Brain },
  { name: "Smart Suggestions", description: "Recommends improvements and best practices", icon: Brain }
]

export default function AIAssistant({ onGenerate, isProcessing, progress }: AIAssistantProps) {
  const [prompt, setPrompt] = useState('')
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])

  const handleSubmit = async () => {
    if (!prompt.trim() || isProcessing) return

    const userMessage = prompt.trim()
    setConversation(prev => [...prev, { role: 'user', content: userMessage }])
    setPrompt('')

    try {
      await onGenerate(userMessage)
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: `I've generated components based on your request: "${userMessage}". The new components have been added to your canvas and are ready for customization.` 
      }])
    } catch (error) {
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while processing your request. Please try again.' 
      }])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="w-4 h-4" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* AI Capabilities */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">CAPABILITIES</h4>
          <div className="space-y-1">
            {AI_CAPABILITIES.map((capability) => {
              const Icon = capability.icon
              return (
                <div key={capability.name} className="flex items-start gap-2 text-xs">
                  <Icon className="w-3 h-3 mt-0.5 text-primary" />
                  <div>
                    <div className="font-medium">{capability.name}</div>
                    <div className="text-muted-foreground text-xs">{capability.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Conversation History */}
        {conversation.length > 0 && (
          <div className="flex-1">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">CONVERSATION</h4>
            <ScrollArea className="h-40 border rounded p-2">
              <div className="space-y-2">
                {conversation.map((message, index) => (
                  <div key={index} className={`text-xs ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <Badge variant={message.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                      {message.role === 'user' ? 'You' : 'AI'}
                    </Badge>
                    <div className={`mt-1 p-2 rounded text-xs ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground ml-4' 
                        : 'bg-muted mr-4'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="ai-processing">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <span>AI is processing your request...</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Input Area */}
        <div className="space-y-2">
          <Textarea
            placeholder="Describe what you want to build... (e.g., 'Create a login form with email and password')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-20 text-sm resize-none"
            disabled={isProcessing}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={!prompt.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Brain className="w-4 h-4 mr-2 ai-processing" />
                Processing...
              </>
            ) : (
              <>
                <PaperPlaneTilt className="w-4 h-4 mr-2" />
                Generate Components
              </>
            )}
          </Button>
        </div>

        {/* Example Prompts */}
        {conversation.length === 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">EXAMPLE PROMPTS</h4>
            <div className="space-y-1">
              {EXAMPLE_PROMPTS.map((example, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-auto py-2 px-2 text-left"
                  onClick={() => setPrompt(example)}
                  disabled={isProcessing}
                >
                  <Sparkle className="w-3 h-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{example}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}