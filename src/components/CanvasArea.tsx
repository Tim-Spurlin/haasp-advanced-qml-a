import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

interface CanvasAreaProps {
  components: Component[]
  selectedComponent: Component | null
  onSelectComponent: (component: Component | null) => void
  onUpdateComponent: (componentId: string, updates: Partial<Component>) => void
}

export default function CanvasArea({ 
  components, 
  selectedComponent, 
  onSelectComponent,
  onUpdateComponent 
}: CanvasAreaProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    componentId: string | null
    offset: { x: number; y: number }
  }>({ isDragging: false, componentId: null, offset: { x: 0, y: 0 } })

  const handleMouseDown = (e: React.MouseEvent, component: Component) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const offset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    
    setDragState({ isDragging: true, componentId: component.id, offset })
    onSelectComponent(component)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.componentId || !canvasRef.current) return

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const newX = Math.max(0, e.clientX - canvasRect.left - dragState.offset.x)
    const newY = Math.max(0, e.clientY - canvasRect.top - dragState.offset.y)

    onUpdateComponent(dragState.componentId, { x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setDragState({ isDragging: false, componentId: null, offset: { x: 0, y: 0 } })
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectComponent(null)
    }
  }

  const renderComponent = (component: Component) => {
    const isSelected = selectedComponent?.id === component.id
    const commonClasses = `absolute border-2 transition-colors ${
      isSelected ? 'border-primary shadow-lg' : 'border-transparent hover:border-muted-foreground/30'
    }`

    const style = {
      left: component.x,
      top: component.y,
      width: component.width,
      height: component.height,
      cursor: dragState.isDragging && dragState.componentId === component.id ? 'grabbing' : 'grab'
    }

    switch (component.type) {
      case 'button':
        return (
          <Button
            key={component.id}
            className={commonClasses}
            style={style}
            variant={component.props.variant || 'default'}
            onMouseDown={(e) => handleMouseDown(e, component)}
          >
            {component.props.text || 'Button'}
          </Button>
        )

      case 'input':
        return (
          <Input
            key={component.id}
            className={commonClasses}
            style={style}
            placeholder={component.props.placeholder || 'Enter text...'}
            onMouseDown={(e) => handleMouseDown(e, component)}
            readOnly
          />
        )

      case 'text':
        return (
          <div
            key={component.id}
            className={`${commonClasses} flex items-center px-2`}
            style={{ ...style, fontSize: component.props.fontSize || '14px' }}
            onMouseDown={(e) => handleMouseDown(e, component)}
          >
            {component.props.content || 'Sample text'}
          </div>
        )

      case 'card':
        return (
          <Card
            key={component.id}
            className={`${commonClasses} p-4`}
            style={style}
            onMouseDown={(e) => handleMouseDown(e, component)}
          >
            <div className="font-medium text-sm">{component.props.title || 'Card Title'}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {component.props.content || 'Card content'}
            </div>
          </Card>
        )

      case 'container':
        return (
          <div
            key={component.id}
            className={`${commonClasses} bg-muted/20 rounded`}
            style={{ 
              ...style, 
              backgroundColor: component.props.backgroundColor || 'transparent',
              padding: component.props.padding || '16px'
            }}
            onMouseDown={(e) => handleMouseDown(e, component)}
          >
            <div className="text-xs text-muted-foreground">Container</div>
          </div>
        )

      default:
        return (
          <div
            key={component.id}
            className={`${commonClasses} bg-gray-100 flex items-center justify-center`}
            style={style}
            onMouseDown={(e) => handleMouseDown(e, component)}
          >
            <span className="text-xs text-gray-600">{component.type}</span>
          </div>
        )
    }
  }

  return (
    <div 
      ref={canvasRef}
      className="relative h-full bg-card border-2 border-dashed border-muted overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
      style={{ minHeight: '600px' }}
    >
      {components.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-2">
            <div className="text-lg font-medium">Drop components here</div>
            <div className="text-sm">Select components from the palette or use AI generation</div>
          </div>
        </div>
      ) : (
        components.map(renderComponent)
      )}
      
      {/* Grid overlay for alignment guidance */}
      <svg
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3e%3cdefs%3e%3cpattern id=\'grid\' width=\'20\' height=\'20\' patternUnits=\'userSpaceOnUse\'%3e%3cpath d=\'m 20 0 l 0 20 m -20 0 l 20 0\' fill=\'none\' stroke=\'%23e2e8f0\' stroke-width=\'0.5\'/%3e%3c/pattern%3e%3c/defs%3e%3crect width=\'100%25\' height=\'100%25\' fill=\'url(%23grid)\' /%3e%3c/svg%3e")' }}
      />
    </div>
  )
}