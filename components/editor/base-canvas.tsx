"use client"

import { useCallback, useState, useRef, useEffect } from "react"
import {
  ReactFlow,
  MiniMap,
  Background,
  ConnectionMode,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  useNodes,
  useEdges,
  Handle,
  Position,
  NodeResizer,
  NodeToolbar,
  EdgeLabelRenderer,
  getSmoothStepPath,
  MarkerType,
  type NodeProps,
  type EdgeProps,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { useHistory, useMyPresence } from "@liveblocks/react"
import { useRoom } from "@liveblocks/react/suspense"
import {
  Square,
  Diamond,
  Circle,
  Pill as PillIcon,
  Cylinder,
  Hexagon,
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo,
  Redo,
  Trash2,
} from "lucide-react"

import { type CanvasNode, type CanvasEdge, NODE_COLORS } from "@/types/canvas"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { StarterTemplatesModal } from "./starter-templates-modal"
import { type CanvasTemplate } from "./starter-templates"
import { LiveCursors } from "./live-cursors"
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave"
import { cn } from "@/lib/utils"

import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"

let idCounter = 0
function generateNodeId(shape: string): string {
  idCounter += 1
  return `${shape}-${Date.now()}-${idCounter}`
}

function CanvasNodeComponent({ id, data, selected }: NodeProps<CanvasNode>) {
  const { setNodes, deleteElements } = useReactFlow()
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Find matching color pair or default to Neutral dark (index 0)
  const colorPair =
    NODE_COLORS.find((c) => c.fill.toLowerCase() === data.color?.toLowerCase()) ||
    NODE_COLORS[0]

  const shape = data.shape || "rectangle"
  const isSelected = selected

  const updateLabel = useCallback(
    (newLabel: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                label: newLabel,
              },
            }
          }
          return n
        })
      )
    },
    [id, setNodes]
  )

  const updateColor = useCallback(
    (newColor: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                color: newColor,
              },
            }
          }
          return n
        })
      )
    },
    [id, setNodes]
  )

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
      // Auto adjust height on mount
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [isEditing])

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    target.style.height = "auto"
    target.style.height = `${target.scrollHeight}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      e.currentTarget.blur()
    } else if (e.key === "Escape") {
      e.preventDefault()
      setIsEditing(false)
    }
  }

  // Render shape background and border
  let shapeElement = null

  if (shape === "rectangle") {
    shapeElement = (
      <div
        className={cn(
          "absolute inset-0 rounded-xl border-2 transition-all duration-300 ease-in-out",
          "border-[var(--node-border)] bg-[var(--node-fill)]",
          "shadow-[0_0_8px_var(--node-glow),inset_0_0_4px_var(--node-glow-inset)]",
          "group-hover:border-[var(--node-border-hover)] group-hover:shadow-[0_0_14px_var(--node-glow-hover),inset_0_0_6px_var(--node-glow-inset-hover)]",
          isSelected && "border-[var(--node-border-selected)] shadow-[0_0_20px_var(--node-glow-selected),inset_0_0_10px_var(--node-glow-inset-selected)]"
        )}
        style={{
          "--node-fill": colorPair.fill,
          "--node-border": `${colorPair.text}33`,       // 20% opacity accent border
          "--node-border-hover": `${colorPair.text}80`, // 50% opacity accent border
          "--node-border-selected": colorPair.text,     // 100% opacity accent border
          "--node-glow": `${colorPair.text}1f`,         // 12% opacity accent glow
          "--node-glow-hover": `${colorPair.text}4d`,   // 30% opacity accent glow
          "--node-glow-selected": `${colorPair.text}80`, // 50% opacity accent glow
          "--node-glow-inset": `${colorPair.text}0d`,   // 5% opacity inset glow
          "--node-glow-inset-hover": `${colorPair.text}1f`, // 12% opacity inset glow
          "--node-glow-inset-selected": `${colorPair.text}33`, // 20% opacity inset glow
        } as React.CSSProperties}
      />
    )
  } else if (shape === "circle" || shape === "pill") {
    shapeElement = (
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 transition-all duration-300 ease-in-out",
          "border-[var(--node-border)] bg-[var(--node-fill)]",
          "shadow-[0_0_8px_var(--node-glow),inset_0_0_4px_var(--node-glow-inset)]",
          "group-hover:border-[var(--node-border-hover)] group-hover:shadow-[0_0_14px_var(--node-glow-hover),inset_0_0_6px_var(--node-glow-inset-hover)]",
          isSelected && "border-[var(--node-border-selected)] shadow-[0_0_20px_var(--node-glow-selected),inset_0_0_10px_var(--node-glow-inset-selected)]"
        )}
        style={{
          "--node-fill": colorPair.fill,
          "--node-border": `${colorPair.text}33`,
          "--node-border-hover": `${colorPair.text}80`,
          "--node-border-selected": colorPair.text,
          "--node-glow": `${colorPair.text}1f`,
          "--node-glow-hover": `${colorPair.text}4d`,
          "--node-glow-selected": `${colorPair.text}80`,
          "--node-glow-inset": `${colorPair.text}0d`,
          "--node-glow-inset-hover": `${colorPair.text}1f`,
          "--node-glow-inset-selected": `${colorPair.text}33`,
        } as React.CSSProperties}
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
          className={cn(
            "stroke-2 transition-all duration-300 ease-in-out",
            "fill-[var(--node-fill)] stroke-[var(--node-border)]",
            "[filter:drop-shadow(0_0_4px_var(--node-glow))]",
            "group-hover:stroke-[var(--node-border-hover)] group-hover:[filter:drop-shadow(0_0_8px_var(--node-glow-hover))]",
            isSelected && "stroke-[var(--node-border-selected)] [filter:drop-shadow(0_0_12px_var(--node-glow-selected))]"
          )}
          style={{
            "--node-fill": colorPair.fill,
            "--node-border": `${colorPair.text}33`,
            "--node-border-hover": `${colorPair.text}80`,
            "--node-border-selected": colorPair.text,
            "--node-glow": `${colorPair.text}1f`,
            "--node-glow-hover": `${colorPair.text}4d`,
            "--node-glow-selected": `${colorPair.text}80`,
          } as React.CSSProperties}
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
          className={cn(
            "stroke-2 transition-all duration-300 ease-in-out",
            "fill-[var(--node-fill)] stroke-[var(--node-border)]",
            "[filter:drop-shadow(0_0_4px_var(--node-glow))]",
            "group-hover:stroke-[var(--node-border-hover)] group-hover:[filter:drop-shadow(0_0_8px_var(--node-glow-hover))]",
            isSelected && "stroke-[var(--node-border-selected)] [filter:drop-shadow(0_0_12px_var(--node-glow-selected))]"
          )}
          style={{
            "--node-fill": colorPair.fill,
            "--node-border": `${colorPair.text}33`,
            "--node-border-hover": `${colorPair.text}80`,
            "--node-border-selected": colorPair.text,
            "--node-glow": `${colorPair.text}1f`,
            "--node-glow-hover": `${colorPair.text}4d`,
            "--node-glow-selected": `${colorPair.text}80`,
          } as React.CSSProperties}
          vectorEffect="non-scaling-stroke"
        />
        {/* Top cylinder lip */}
        <ellipse
          cx="50"
          cy="20"
          rx="46"
          ry="15"
          className={cn(
            "stroke-2 transition-all duration-300 ease-in-out",
            "fill-[var(--node-fill)] stroke-[var(--node-border)]",
            "group-hover:stroke-[var(--node-border-hover)]",
            isSelected && "stroke-[var(--node-border-selected)]"
          )}
          style={{
            "--node-fill": colorPair.fill,
            "--node-border": `${colorPair.text}33`,
            "--node-border-hover": `${colorPair.text}80`,
            "--node-border-selected": colorPair.text,
          } as React.CSSProperties}
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
          className={cn(
            "stroke-2 transition-all duration-300 ease-in-out",
            "fill-[var(--node-fill)] stroke-[var(--node-border)]",
            "[filter:drop-shadow(0_0_4px_var(--node-glow))]",
            "group-hover:stroke-[var(--node-border-hover)] group-hover:[filter:drop-shadow(0_0_8px_var(--node-glow-hover))]",
            isSelected && "stroke-[var(--node-border-selected)] [filter:drop-shadow(0_0_12px_var(--node-glow-selected))]"
          )}
          style={{
            "--node-fill": colorPair.fill,
            "--node-border": `${colorPair.text}33`,
            "--node-border-hover": `${colorPair.text}80`,
            "--node-border-selected": colorPair.text,
            "--node-glow": `${colorPair.text}1f`,
            "--node-glow-hover": `${colorPair.text}4d`,
            "--node-glow-selected": `${colorPair.text}80`,
          } as React.CSSProperties}
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

      <NodeToolbar
        isVisible={isSelected && !isEditing}
        position={Position.Top}
        className="nodrag nowheel flex items-center gap-1.5 p-1 bg-bg-elevated/95 backdrop-blur-md border border-border-default rounded-lg shadow-xl"
        offset={8}
      >
        {NODE_COLORS.map((color) => {
          const isActive = colorPair.fill.toLowerCase() === color.fill.toLowerCase()
          return (
            <button
              key={color.fill}
              type="button"
              className={cn(
                "w-5 h-5 rounded-full border transition-all duration-150 cursor-pointer focus:outline-none relative flex items-center justify-center",
                isActive
                  ? "border-accent-primary scale-110 shadow-[0_0_4px_var(--glow-color)]"
                  : "border-border-subtle hover:scale-105 hover:shadow-[0_0_6px_var(--glow-color)]"
              )}
              style={{
                backgroundColor: color.fill,
                "--glow-color": `${color.text}80`,
              } as React.CSSProperties}
              onClick={(e) => {
                e.stopPropagation()
                updateColor(color.fill)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              title={color.name}
              aria-label={color.name}
            >
              {isActive && (
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color.text }}
                />
              )}
            </button>
          )
        })}
        
        {/* Divider */}
        <div className="w-[1px] h-4 bg-border-default mx-0.5" />

        {/* Delete Button */}
        <button
          type="button"
          className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-state-error hover:bg-bg-subtle transition-all duration-150 cursor-pointer focus:outline-none"
          onClick={(e) => {
            e.stopPropagation()
            deleteElements({ nodes: [{ id }] })
          }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Delete Node"
          aria-label="Delete Node"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </NodeToolbar>

      {shapeElement}

      {/* Handles at all four sides for connections */}
      {/* Render both source and target handles at each position so any handle can connect to any handle collaboratively */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !w-2 !h-2 border border-border-default !rounded-full z-20"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !w-2 !h-2 border border-border-default !rounded-full z-20"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
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
        position={Position.Left}
        id="left"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !w-2 !h-2 border border-border-default !rounded-full z-20"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !w-2 !h-2 border border-border-default !rounded-full z-20"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !w-2 !h-2 border border-border-default !rounded-full z-20"
      />

      {/* Center Label Area */}
      <div
        className="w-full h-full flex items-center justify-center z-10 px-2"
        onDoubleClick={() => {
          if (!isEditing) setIsEditing(true)
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="nodrag nowheel w-full bg-transparent text-sm font-medium text-center border-0 outline-none resize-none focus:ring-0 p-0 text-current leading-normal"
            style={{
              height: "auto",
              minHeight: "1.5rem",
              maxHeight: "100%",
            }}
            value={data.label}
            onChange={(e) => updateLabel(e.target.value)}
            onInput={handleInput}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        ) : (
          <span
            className={cn(
              "text-sm font-medium text-center break-words select-none px-2 cursor-text transition-colors duration-150 w-full",
              !data.label && "text-text-muted/60 italic"
            )}
          >
            {data.label || "Double-click to edit"}
          </span>
        )}
      </div>
    </div>
  )
}

function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps<CanvasEdge>) {
  const { setEdges } = useReactFlow()
  const [isEditing, setIsEditing] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [labelValue, setLabelValue] = useState(data?.label || "")

  useEffect(() => {
    setLabelValue(data?.label || "")
  }, [data?.label])

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  const updateLabel = useCallback(
    (newLabel: string) => {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id === id) {
            return {
              ...e,
              data: {
                ...e.data,
                label: newLabel,
              },
            }
          }
          return e
        })
      )
    },
    [id, setEdges]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  const isEdgeActive = selected || hovered

  return (
    <>
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group cursor-pointer"
      >
        {/* Thick invisible path to make selection and hovering very easy */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={15}
          className="stroke-transparent pointer-events-stroke"
        />

        {/* Visible thin edge line */}
        <path
          d={edgePath}
          fill="none"
          stroke={selected ? "var(--accent-primary)" : "var(--text-muted)"}
          strokeWidth={selected ? 2.5 : 2}
          markerEnd={markerEnd}
          className={cn(
            "transition-all duration-200 stroke-linecap-round",
            selected
              ? "stroke-[var(--accent-primary)] [filter:drop-shadow(0_0_4px_rgba(0,200,212,0.4))]"
              : hovered
              ? "stroke-[var(--text-secondary)] opacity-100"
              : "opacity-60"
          )}
          style={style}
        />
      </g>

      {/* Edge Label Rendering */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nowheel z-30"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation()
            if (!isEditing) setIsEditing(true)
          }}
        >
          {isEditing ? (
            <div className="relative inline-flex items-center min-w-[60px] bg-bg-elevated border border-accent-primary rounded-full px-2 py-0.5 shadow-lg">
              <span className="invisible whitespace-pre px-1.5 text-[10px] font-mono font-medium">
                {labelValue || "Type label..."}
              </span>
              <input
                type="text"
                value={labelValue}
                onChange={(e) => setLabelValue(e.target.value)}
                onBlur={() => {
                  setIsEditing(false)
                  updateLabel(labelValue)
                }}
                onKeyDown={handleKeyDown}
                className="absolute inset-0 w-full h-full bg-transparent border-0 outline-none text-center text-[10px] font-mono font-medium text-text-primary px-3 py-0.5 rounded-full focus:ring-0"
                autoFocus
              />
            </div>
          ) : (
            <>
              {data?.label ? (
                <div
                  className={cn(
                    "px-2 py-0.5 bg-bg-elevated border rounded-full text-[10px] font-mono tracking-wide font-medium select-none cursor-pointer transition-all duration-150 shadow-md",
                    selected
                      ? "border-accent-primary text-accent-primary shadow-accent-primary/10"
                      : hovered
                      ? "border-[var(--text-secondary)] text-text-primary"
                      : "border-border-default text-text-secondary"
                  )}
                >
                  {data.label}
                </div>
              ) : (
                isEdgeActive && (
                  <div
                    className="px-2 py-0.5 bg-bg-elevated/80 border border-dashed border-border-subtle rounded-full text-[9px] font-mono tracking-widest text-text-muted hover:text-accent-primary hover:border-accent-primary hover:bg-bg-elevated transition-all duration-150 select-none cursor-pointer opacity-70 hover:opacity-100"
                  >
                    + LABEL
                  </div>
                )
              )}
            </>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const edgeTypes = {
  canvasEdge: CanvasEdgeComponent,
}

const nodeTypes = {
  canvasNode: CanvasNodeComponent,
}

const defaultEdgeOptions = {
  type: "canvasEdge",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 15,
    height: 15,
    color: "#808090",
  },
}

function BaseCanvasInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: {
      initial: [],
    },
    edges: {
      initial: [],
    },
  })

  const reactFlowInstance = useReactFlow()
  const { screenToFlowPosition, addNodes, zoomIn, zoomOut, fitView, setNodes, setEdges } = reactFlowInstance
  const { undo, redo, canUndo, canRedo } = useHistory()
  const [, updateMyPresence] = useMyPresence()
  const room = useRoom()

  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const hasFittedRef = useRef(false)
  
  // Autosave hook
  useCanvasAutosave({
    projectId: room.id,
    nodes,
    edges,
  })

  // Initial load hook
  useEffect(() => {
    // Only load if the room is completely empty (no existing liveblocks state)
    if (nodes.length === 0 && edges.length === 0) {
      const loadSavedCanvas = async () => {
        try {
          const response = await fetch(`/api/projects/${room.id}/canvas`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.nodes && data.nodes.length > 0) {
              setNodes(data.nodes);
              setEdges(data.edges || []);
              setTimeout(() => {
                fitView({ padding: 0.2, duration: 400 });
              }, 100);
            }
          }
        } catch (error) {
          console.error("Failed to load saved canvas:", error);
        }
      };

      loadSavedCanvas();
    }
  }, [room.id, setNodes, setEdges, fitView]);

  // Initial collaborative fitView hook (only run once on mount if there are nodes in the room)
  useEffect(() => {
    if (nodes.length > 0 && !hasFittedRef.current) {
      hasFittedRef.current = true
      setTimeout(() => {
        fitView({ padding: 0.2 })
      }, 100)
    } else if (nodes.length === 0) {
      // If the room is empty initially, mark it as fitted so we don't fitView on first drop
      hasFittedRef.current = true
    }
  }, [nodes.length, fitView])

  useKeyboardShortcuts(reactFlowInstance, undo, redo)

  const activeNodes = useNodes<CanvasNode>()
  const activeEdges = useEdges<CanvasEdge>()

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Backspace" || event.key === "Delete") {
        const activeEl = document.activeElement as HTMLElement | null
        if (activeEl) {
          const tagName = activeEl.tagName.toLowerCase()
          if (
            tagName === "input" ||
            tagName === "textarea" ||
            activeEl.isContentEditable
          ) {
            return
          }
        }

        const selectedNodes = activeNodes.filter((n) => n.selected)
        const selectedEdges = activeEdges.filter((e) => e.selected)

        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          event.preventDefault()
          onDelete({ nodes: selectedNodes, edges: selectedEdges })
        }
      }
    },
    [activeNodes, activeEdges, onDelete]
  )

  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setIsTemplatesModalOpen(true)
    window.addEventListener("open-starter-templates", handleOpen)
    return () => window.removeEventListener("open-starter-templates", handleOpen)
  }, [])

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      // Close the modal immediately
      setIsTemplatesModalOpen(false)

      // Clear existing nodes and edges first
      setNodes([])
      setEdges([])

      // Set the new nodes and edges after a small tick
      setTimeout(() => {
        setNodes(template.nodes)
        setEdges(template.edges)

        // Fit view after nodes render
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 400 })
        }, 100)
      }, 50)
    },
    [setNodes, setEdges, fitView]
  )

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

    // Capture the click offset relative to the dragged toolbar button element
    const rect = event.currentTarget.getBoundingClientRect()
    const grabX = event.clientX - rect.left
    const grabY = event.clientY - rect.top

    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ shape, width, height, grabX, grabY })
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
    
    // Scale the grab offset from the button bounds to the drag preview bounds
    const buttonWidth = rect.width || 40
    const buttonHeight = rect.height || 40
    const previewOffsetX = (grabX / buttonWidth) * width
    const previewOffsetY = (grabY / buttonHeight) * height

    event.dataTransfer.setDragImage(dragEl, previewOffsetX, previewOffsetY)
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
        const { shape, width, height, grabX, grabY } = JSON.parse(rawData)

        if (!reactFlowWrapper.current) return
        const rect = reactFlowWrapper.current.getBoundingClientRect()

        // Cursor coordinates relative to the React Flow container
        const clientX = event.clientX
        const clientY = event.clientY
        const x = clientX - rect.left
        const y = clientY - rect.top

        // Get viewport properties to manually project coordinates and ensure 100% accurate alignment
        const { x: vx, y: vy, zoom } = reactFlowInstance.getViewport()
        const flowX = (x - vx) / zoom
        const flowY = (y - vy) / zoom

        // Calculate scaled grab offsets to subtract from flowX and flowY
        const buttonWidth = 40
        const buttonHeight = 40
        const previewOffsetX = (grabX / buttonWidth) * width
        const previewOffsetY = (grabY / buttonHeight) * height

        const adjustedPosition = {
          x: flowX - previewOffsetX,
          y: flowY - previewOffsetY,
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
    [reactFlowInstance, addNodes]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault()
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      updateMyPresence({ cursor: { x: Math.round(position.x), y: Math.round(position.y) } })
    },
    [screenToFlowPosition, updateMyPresence]
  )

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  return (
    <div 
      ref={reactFlowWrapper}
      className="w-full h-full relative"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
    >
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
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode={null}
        className="w-full h-full"
      >
        {/* Collaborative presence cursors */}
        <LiveCursors />

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

      {/* Floating Control Bar for Zoom and Undo/Redo */}
      <div className="absolute bottom-6 left-6 z-50 flex items-center gap-1.5 px-3 py-2 bg-bg-elevated/95 backdrop-blur-md border border-border-default rounded-full shadow-2xl pointer-events-auto">
        {/* Zoom Controls */}
        <button
          onClick={() => zoomOut({ duration: 200 })}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:text-accent-primary hover:bg-bg-surface hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          <ZoomOut className="h-4 w-4 stroke-[1.5]" />
        </button>
        <button
          onClick={() => fitView({ duration: 200 })}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:text-accent-primary hover:bg-bg-surface hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          title="Fit View"
          aria-label="Fit View"
        >
          <Maximize className="h-4 w-4 stroke-[1.5]" />
        </button>
        <button
          onClick={() => zoomIn({ duration: 200 })}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:text-accent-primary hover:bg-bg-surface hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          <ZoomIn className="h-4 w-4 stroke-[1.5]" />
        </button>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-border-subtle mx-1" />

        {/* History Controls */}
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:text-accent-primary hover:bg-bg-surface hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo className="h-4 w-4 stroke-[1.5]" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:text-accent-primary hover:bg-bg-surface hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          <Redo className="h-4 w-4 stroke-[1.5]" />
        </button>
      </div>

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

      {/* Starter Templates Dialog Modal */}
      <StarterTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onImport={handleImportTemplate}
      />
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

