import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

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

interface PropertyPanelProps {
  selectedComponent: Component | null
  onUpdateComponent: (componentId: string, updates: Partial<Component>) => void
}

export default function PropertyPanel({ selectedComponent, onUpdateComponent }: PropertyPanelProps) {
  if (!selectedComponent) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <div className="text-sm">No component selected</div>
            <div className="text-xs mt-1">Click on a component in the canvas</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const updateProperty = (key: string, value: any) => {
    onUpdateComponent(selectedComponent.id, {
      props: { ...selectedComponent.props, [key]: value }
    })
  }

  const updatePosition = (key: 'x' | 'y', value: number) => {
    onUpdateComponent(selectedComponent.id, { [key]: value })
  }

  const updateSize = (key: 'width' | 'height', value: number) => {
    onUpdateComponent(selectedComponent.id, { [key]: value })
  }

  const renderPropertyControls = () => {
    const { type, props } = selectedComponent
    
    const commonControls = (
      <>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">LAYOUT</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="x-pos" className="text-xs">X Position</Label>
              <Input
                id="x-pos"
                type="number"
                value={selectedComponent.x}
                onChange={(e) => updatePosition('x', parseInt(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="y-pos" className="text-xs">Y Position</Label>
              <Input
                id="y-pos"
                type="number"
                value={selectedComponent.y}
                onChange={(e) => updatePosition('y', parseInt(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="width" className="text-xs">Width</Label>
              <Input
                id="width"
                type="number"
                value={selectedComponent.width}
                onChange={(e) => updateSize('width', parseInt(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-xs">Height</Label>
              <Input
                id="height"
                type="number"
                value={selectedComponent.height}
                onChange={(e) => updateSize('height', parseInt(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
        <Separator />
      </>
    )

    switch (type) {
      case 'button':
        return (
          <div className="space-y-4">
            {commonControls}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">BUTTON</Label>
              <div>
                <Label htmlFor="button-text" className="text-xs">Text</Label>
                <Input
                  id="button-text"
                  value={props.text || ''}
                  onChange={(e) => updateProperty('text', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="button-variant" className="text-xs">Variant</Label>
                <Select value={props.variant || 'default'} onValueChange={(value) => updateProperty('variant', value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="destructive">Destructive</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="ghost">Ghost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 'input':
        return (
          <div className="space-y-4">
            {commonControls}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">INPUT</Label>
              <div>
                <Label htmlFor="input-placeholder" className="text-xs">Placeholder</Label>
                <Input
                  id="input-placeholder"
                  value={props.placeholder || ''}
                  onChange={(e) => updateProperty('placeholder', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="input-type" className="text-xs">Type</Label>
                <Select value={props.type || 'text'} onValueChange={(value) => updateProperty('type', value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="password">Password</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="space-y-4">
            {commonControls}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">TEXT</Label>
              <div>
                <Label htmlFor="text-content" className="text-xs">Content</Label>
                <Input
                  id="text-content"
                  value={props.content || ''}
                  onChange={(e) => updateProperty('content', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="text-size" className="text-xs">Font Size</Label>
                <Input
                  id="text-size"
                  value={props.fontSize || '14px'}
                  onChange={(e) => updateProperty('fontSize', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        )

      case 'card':
        return (
          <div className="space-y-4">
            {commonControls}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">CARD</Label>
              <div>
                <Label htmlFor="card-title" className="text-xs">Title</Label>
                <Input
                  id="card-title"
                  value={props.title || ''}
                  onChange={(e) => updateProperty('title', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="card-content" className="text-xs">Content</Label>
                <Input
                  id="card-content"
                  value={props.content || ''}
                  onChange={(e) => updateProperty('content', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        )

      case 'container':
        return (
          <div className="space-y-4">
            {commonControls}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">CONTAINER</Label>
              <div>
                <Label htmlFor="container-padding" className="text-xs">Padding</Label>
                <Input
                  id="container-padding"
                  value={props.padding || '16px'}
                  onChange={(e) => updateProperty('padding', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="container-bg" className="text-xs">Background</Label>
                <Input
                  id="container-bg"
                  value={props.backgroundColor || 'transparent'}
                  onChange={(e) => updateProperty('backgroundColor', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        )

      default:
        return commonControls
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">Properties</CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="bg-primary/10 px-2 py-1 rounded">{selectedComponent.type}</span>
          <span>{selectedComponent.name}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          {renderPropertyControls()}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}