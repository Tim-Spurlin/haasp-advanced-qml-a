import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Play, Pause, SkipBack, SkipForward, Clock, Sparkle } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'

interface ProjectSnapshot {
  id: string
  timestamp: number
  components: any[]
  description: string
  auto: boolean
}

interface TimelineProps {
  snapshots: ProjectSnapshot[]
  currentSnapshot: number
  onUndo: () => void
  onRedo: () => void
  onJumpToSnapshot: (index: number) => void
  canUndo: boolean
  canRedo: boolean
  isRecording: boolean
  onToggleRecording: () => void
}

export default function Timeline({
  snapshots,
  currentSnapshot,
  onUndo,
  onRedo,
  onJumpToSnapshot,
  canUndo,
  canRedo,
  isRecording,
  onToggleRecording
}: TimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [selectedRange, setSelectedRange] = useState<[number, number]>([0, snapshots.length - 1])

  // Auto-playback functionality
  useEffect(() => {
    if (!isPlaying || snapshots.length === 0) return

    const interval = setInterval(() => {
      const nextIndex = Math.min(currentSnapshot + 1, snapshots.length - 1)
      if (nextIndex === currentSnapshot) {
        setIsPlaying(false)
      } else {
        onJumpToSnapshot(nextIndex)
      }
    }, 1000 / playbackSpeed)

    return () => clearInterval(interval)
  }, [isPlaying, currentSnapshot, snapshots.length, playbackSpeed, onJumpToSnapshot])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getSnapshotIcon = (snapshot: ProjectSnapshot) => {
    if (snapshot.auto) return <Clock className="w-3 h-3" />
    return <Sparkle className="w-3 h-3" />
  }

  const handleSliderChange = (value: number[]) => {
    onJumpToSnapshot(value[0])
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Timeline & History
          <Badge variant={isRecording ? "default" : "secondary"} className="ml-auto">
            {isRecording ? "Recording" : "Paused"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onJumpToSnapshot(0)}
            disabled={currentSnapshot === 0}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant={isPlaying ? "default" : "outline"}
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={snapshots.length === 0}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onJumpToSnapshot(snapshots.length - 1)}
            disabled={currentSnapshot === snapshots.length - 1}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Timeline Slider */}
        {snapshots.length > 0 && (
          <div className="space-y-2">
            <Slider
              value={[currentSnapshot]}
              onValueChange={handleSliderChange}
              max={snapshots.length - 1}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Start</span>
              <span>{currentSnapshot + 1} / {snapshots.length}</span>
              <span>Latest</span>
            </div>
          </div>
        )}

        {/* Playback Speed */}
        <div className="space-y-2">
          <label className="text-xs font-medium">Playback Speed: {playbackSpeed}x</label>
          <Slider
            value={[playbackSpeed]}
            onValueChange={(value) => setPlaybackSpeed(value[0])}
            max={5}
            min={0.25}
            step={0.25}
            className="w-full"
          />
        </div>

        {/* Recording Toggle */}
        <Button
          variant={isRecording ? "destructive" : "default"}
          size="sm"
          onClick={onToggleRecording}
          className="w-full"
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>

        {/* Snapshots List */}
        <ScrollArea className="h-[200px]">
          <div className="space-y-1">
            {snapshots.map((snapshot, index) => (
              <div
                key={snapshot.id}
                className={`p-2 rounded cursor-pointer flex items-center gap-2 text-xs hover:bg-muted ${
                  index === currentSnapshot ? 'bg-accent text-accent-foreground' : ''
                }`}
                onClick={() => onJumpToSnapshot(index)}
              >
                {getSnapshotIcon(snapshot)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{snapshot.description}</div>
                  <div className="text-muted-foreground">{formatTime(snapshot.timestamp)}</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {snapshot.components.length}
                </Badge>
              </div>
            ))}
            {snapshots.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No snapshots yet
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Progress Indicator */}
        {snapshots.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{Math.round(((currentSnapshot + 1) / snapshots.length) * 100)}%</span>
            </div>
            <Progress value={((currentSnapshot + 1) / snapshots.length) * 100} className="h-1" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}