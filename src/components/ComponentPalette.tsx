import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Rectangle, TextAa, CursorClick, Square, GridFour } from '@phosphor-icons/react'

interface ComponentPaletteProps {
  onAddComponent: (type: string, name: string) => void
}

const COMPONENT_TYPES = [
  { type: 'button', name: 'Button', icon: Rectangle, description: 'Interactive button element' },
  { type: 'input', name: 'Input Field', icon: Rectangle, description: 'Text input component' },
  { type: 'text', name: 'Text', icon: TextAa, description: 'Static text element' },
  { type: 'card', name: 'Card', icon: Square, description: 'Container with border and shadow' },
  { type: 'container', name: 'Container', icon: GridFour, description: 'Layout container' }
]

export default function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">Component Palette</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-2 gap-2">
            {COMPONENT_TYPES.map((component) => {
              const Icon = component.icon
              return (
                <Button
                  key={component.type}
                  variant="outline"
                  className="h-auto p-3 flex flex-col gap-2 hover:bg-accent"
                  onClick={() => onAddComponent(component.type, component.name)}
                >
                  <Icon className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-medium text-xs">{component.name}</div>
                  </div>
                </Button>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}