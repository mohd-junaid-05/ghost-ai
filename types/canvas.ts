import type { Node, Edge } from "@xyflow/react"

export interface NodeData extends Record<string, unknown> {
  label: string
  color?: string
  shape?: string
}

export interface EdgeData extends Record<string, unknown> {
  label?: string
}

export type CanvasNode = Node<NodeData>
export type CanvasEdge = Edge<EdgeData>

// Lowercase aliases as specified in feature-spec
export type canvasNode = CanvasNode
export type canvasEdge = CanvasEdge

// 8 defined color pairs for nodes
export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED", name: "Neutral dark" },
  { fill: "#10233D", text: "#52A8FF", name: "Blue" },
  { fill: "#2E1938", text: "#BF7AF0", name: "Purple" },
  { fill: "#331B00", text: "#FF990A", name: "Orange" },
  { fill: "#3C1618", text: "#FF6166", name: "Red" },
  { fill: "#3A1726", text: "#F75F8F", name: "Pink" },
  { fill: "#0F2E18", text: "#62C073", name: "Green" },
  { fill: "#062822", text: "#0AC7B4", name: "Teal" },
] as const

export const DEFAULT_NODE_COLOR = NODE_COLORS[0]

// 6 supported shapes
export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const

export type NodeShape = (typeof NODE_SHAPES)[number]

