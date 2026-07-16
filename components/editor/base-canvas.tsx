"use client"

import { useCallback } from "react"
import {
  ReactFlow,
  MiniMap,
  Background,
  ConnectionMode,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  Handle,
  Position,
  NodeResizer,
  type NodeProps,
} from "@xyflow/react"
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
import { Square, Diamond, Circle, Pill as PillIcon, Cylinder, Hexagon } from "lucide-react"

import { type CanvasNode, NODE_COLORS } from "@/types/canvas"
import { cn } from "@/lib/utils"

import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"

let idCounter = 0
function generateNodeId(shape: string): string {
  idCounter += 1
  return `${shape}-${Date.now()}-${idCounter}`
}

function CanvasNodeComponent({ data, selected }: NodeProps<CanvasNode>) {
  // Find matching color pair or default to Neutral dark (index 0)
  const colorPair =
    NODE_COLORS.find((c) => c.fill.toLowerCase() === data.color?.toLowerCase()) ||
    NODE_COLORS[0]

  const shape = data.shape || "rectangle"
  const isSelected = selected

  // Render shape background and border
  let shapeElement = null

  if (shape === "rectangle") {
    shapeElement = (
      <div
        className={cn(
          "absolute inset-0 rounded-xl border-2 transition-all duration-200",
          isSelected
            ? "border-accent-primary shadow-lg shadow-accent-primary/10"
            : "border-border-default group-hover:border-border-subtle"
        )}
        style={{ backgroundColor: colorPair.fill }}
      />
    )
  } else if (shape === "circle" || shape === "pill") {
    shapeElement = (
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 transition-all duration-200",
          isSelected
            ? "border-accent-primary shadow-lg shadow-accent-primary/10"
            : "border-border-default group-hover:border-border-subtle"
        )}
        style={{ backgroundColor: colorPair.fill }}
      />
    )
  } else if (shape === "diamond") {
    shapeElement = (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="50,2 98,50 50,98 2,50"
          fill={colorPair.fill}
          className={cn(
            "stroke-2 transition-all duration-200",
            isSelected
              ? "stroke-[var(--accent-primary)] [filter:drop-shadow(0_0_4px_rgba(0,200,212,0.3))]"
              : "stroke-[var(--border-default)] group-hover:stroke-[var(--border-subtle)]"
          )}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  } else if (shape === "cylinder") {
    shapeElement = (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Main cylinder body */}
        <path
          d="M 4,20 L 4,80 A 46,15 0 0,0 96,80 L 96,20 Z"
          fill={colorPair.fill}
          className={cn(
            "stroke-2 transition-all duration-200",
            isSelected
              ? "stroke-[var(--accent-primary)] [filter:drop-shadow(0_0_4px_rgba(0,200,212,0.3))]"
              : "stroke-[var(--border-default)] group-hover:stroke-[var(--border-subtle)]"
          )}
          vectorEffect="non-scaling-stroke"
        />
        {/* Top cylinder lip */}
        <ellipse
          cx="50"
          cy="20"
          rx="46"
          ry="15"
          fill={colorPair.fill}
          className={cn(
            "stroke-2 transition-all duration-200",
            isSelected
              ? "stroke-[var(--accent-primary)]"
              : "stroke-[var(--border-default)] group-hover:stroke-[var(--border-subtle)]"
          )}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  } else if (shape === "hexagon") {
    shapeElement = (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="25,2 75,2 98,50 75,98 25,98 2,50"
          fill={colorPair.fill}
          className={cn(
            "stroke-2 transition-all duration-200",
            isSelected
              ? "stroke-[var(--accent-primary)] [filter:drop-shadow(0_0_4px_rgba(0,200,212,0.3))]"
              : "stroke-[var(--border-default)] group-hover:stroke-[var(--border-subtle)]"
          )}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }

  return (
    <div
      className="group w-full h-full flex items-center justify-center p-3 relative"
      style={{
        color: colorPair.text,
      }}
    >
      <NodeResizer
        isVisible={isSelected}
        minWidth={40}
        minHeight={40}
        handleClassName="!h-2.5 !w-2.5 !bg-bg-elevated !border-2 !border-accent-primary !rounded-full -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-all duration-150"
        lineClassName="!border-accent-primary/40"
      />

      {shapeElement}

      {/* Handles at all four sides for connections */}
      {/* Top & Left act as targets, Bottom & Right act as sources */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !w-2 !h-2 border border-border-default !rounded-full z-20"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !w-2 !h-2 border border-border-default !rounded-full z-20"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !w-2 !h-2 border border-border-default !rounded-full z-20"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !w-2 !h-2 border border-border-default !rounded-full z-20"
      />

      <span className="text-sm font-medium text-center break-words select-none pointer-events-none px-2 z-10">
        {data.label}
      </span>
    </div>
  )
}

const nodeTypes = {
  canvasNode: CanvasNodeComponent,
}

function BaseCanvasInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow({
    suspense: true,
    nodes: {
      initial: [],
    },
    edges: {
      initial: [],
    },
  })

  const { screenToFlowPosition, addNodes } = useReactFlow()

  const onDragStart = (event: React.DragEvent, shape: string) => {
    let width = 150
    let height = 80

    if (shape === "circle") {
      width = 90
      height = 90
    } else if (shape === "diamond") {
      width = 120
      height = 120
    } else if (shape === "pill") {
      width = 140
      height = 70
    } else if (shape === "cylinder") {
      width = 100
      height = 110
    } else if (shape === "hexagon") {
      width = 120
      height = 100
    }

    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ shape, width, height })
    )
    event.dataTransfer.effectAllowed = "move"

    // Create custom ghost drag image
    const dragEl = document.createElement("div")
    dragEl.style.position = "absolute"
    dragEl.style.top = "-1000px"
    dragEl.style.width = `${width}px`
    dragEl.style.height = `${height}px`
    dragEl.style.pointerEvents = "none"

    if (shape === "rectangle") {
      dragEl.innerHTML = `<div style="width:100%;height:100%;border:2px dashed #00c8d4;background:rgba(0,200,212,0.15);border-radius:12px;"></div>`
    } else if (shape === "circle" || shape === "pill") {
      dragEl.innerHTML = `<div style="width:100%;height:100%;border:2px dashed #00c8d4;background:rgba(0,200,212,0.15);border-radius:9999px;"></div>`
    } else if (shape === "diamond") {
      dragEl.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,2 98,50 50,98 2,50" fill="rgba(0,200,212,0.15)" stroke="#00c8d4" stroke-width="2" stroke-dasharray="4" />
        </svg>`
    } else if (shape === "cylinder") {
      dragEl.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 4,20 L 4,80 A 46,15 0 0,0 96,80 L 96,20 Z" fill="rgba(0,200,212,0.15)" stroke="#00c8d4" stroke-width="2" stroke-dasharray="4" />
          <ellipse cx="50" cy="20" rx="46" ry="15" fill="rgba(0,200,212,0.15)" stroke="#00c8d4" stroke-width="2" stroke-dasharray="4" />
        </svg>`
    } else if (shape === "hexagon") {
      dragEl.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="25,2 75,2 98,50 75,98 25,98 2,50" fill="rgba(0,200,212,0.15)" stroke="#00c8d4" stroke-width="2" stroke-dasharray="4" />
        </svg>`
    }

    document.body.appendChild(dragEl)
    event.dataTransfer.setDragImage(dragEl, width / 2, height / 2)
    setTimeout(() => {
      document.body.removeChild(dragEl)
    }, 0)
  }

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const rawData = event.dataTransfer.getData("application/reactflow")
      if (!rawData) return

      try {
        const { shape, width, height } = JSON.parse(rawData)

        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })

        // Center the dropped shape under the cursor
        const adjustedPosition = {
          x: position.x - width / 2,
          y: position.y - height / 2,
        }

        const id = generateNodeId(shape)
        const newNode = {
          id,
          type: "canvasNode",
          position: adjustedPosition,
          width,
          height,
          style: {
            width,
            height,
          },
          data: {
            label: "",
            color: "#1F1F1F", // default color
            shape,
          },
        }

        addNodes(newNode)
      } catch (err) {
        console.error("Failed to parse shape drag payload:", err)
      }
    },
    [screenToFlowPosition, addNodes]
  )

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="w-full h-full"
      >
        {/* Collaborative presence cursors */}
        <Cursors />

        {/* Custom styled canvas background dots */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(42, 42, 48, 0.3)"
        />

        {/* MiniMap tailored to match Ghost AI dark design tokens */}
        <MiniMap
          nodeColor="#111114"
          maskColor="rgba(8, 8, 9, 0.7)"
          style={{
            backgroundColor: "#18181c",
            border: "1px solid #2a2a30",
            borderRadius: "12px",
          }}
          className="!bg-bg-elevated !border-border-default !rounded-xl"
        />
      </ReactFlow>

      {/* Floating Shapes Panel */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-2 bg-bg-elevated/95 backdrop-blur-md border border-border-default rounded-full shadow-2xl pointer-events-auto">
        <div className="text-[10px] text-text-muted px-2 font-mono border-r border-border-subtle mr-1 select-none tracking-widest font-bold">
          SHAPES
        </div>
        {[
          { shape: "rectangle", icon: Square, label: "Rectangle" },
          { shape: "diamond", icon: Diamond, label: "Diamond" },
          { shape: "circle", icon: Circle, label: "Circle" },
          { shape: "pill", icon: PillIcon, label: "Pill" },
          { shape: "cylinder", icon: Cylinder, label: "Cylinder" },
          { shape: "hexagon", icon: Hexagon, label: "Hexagon" },
        ].map(({ shape, icon: Icon, label }) => (
          <div
            key={shape}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-text-secondary hover:text-accent-primary hover:border-accent-primary hover:scale-105 active:scale-95 transition-all duration-200 cursor-grab"
            draggable
            onDragStart={(e) => onDragStart(e, shape)}
            title={label}
            aria-label={label}
          >
            <Icon className="h-5 w-5 stroke-[1.5]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function BaseCanvas() {
  return (
    <ReactFlowProvider>
      <BaseCanvasInner />
    </ReactFlowProvider>
  )
}

export default BaseCanvas

