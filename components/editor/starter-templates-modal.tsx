"use client"

import React from "react"
import { Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { type CanvasTemplate, CANVAS_TEMPLATES } from "./starter-templates"

interface StarterTemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (template: CanvasTemplate) => void
}

interface TemplatePreviewProps {
  template: CanvasTemplate
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const nodes = template.nodes
  if (nodes.length === 0) return null

  // Find bounding box of nodes
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  nodes.forEach((n) => {
    const x = n.position.x
    const y = n.position.y
    const w = n.width ?? 100
    const h = n.height ?? 60

    if (x < minX) minX = x
    if (x + w > maxX) maxX = x + w
    if (y < minY) minY = y
    if (y + h > maxY) maxY = y + h
  })

  const boundsW = maxX - minX || 1
  const boundsH = maxY - minY || 1

  // Scale positions to percentage coordinates to be responsive
  const padX = 10
  const padY = 18
  const rangeX = 100 - padX * 2
  const rangeY = 100 - padY * 2

  const nodeCenters: Record<string, { x: number; y: number }> = {}
  
  const scaledNodes = template.nodes.map((node) => {
    const w = node.width ?? 100
    const h = node.height ?? 60

    const pctX = padX + ((node.position.x - minX) / boundsW) * rangeX
    const pctY = padY + ((node.position.y - minY) / boundsH) * rangeY
    const pctW = (w / boundsW) * rangeX
    const pctH = (h / boundsH) * rangeY

    nodeCenters[node.id] = {
      x: pctX + pctW / 2,
      y: pctY + pctH / 2,
    }

    return {
      ...node,
      pctX,
      pctY,
      pctW,
      pctH,
    }
  })

  const getHandlePos = (
    nodeId: string,
    handleId: string | null | undefined,
    isSource: boolean
  ) => {
    const node = scaledNodes.find((n) => n.id === nodeId)
    if (!node) return { x: 0, y: 0 }

    const hId = handleId || (isSource ? "right" : "left")

    if (hId === "left") {
      return { x: node.pctX, y: node.pctY + node.pctH / 2 }
    }
    if (hId === "right") {
      return { x: node.pctX + node.pctW, y: node.pctY + node.pctH / 2 }
    }
    if (hId === "top") {
      return { x: node.pctX + node.pctW / 2, y: node.pctY }
    }
    if (hId === "bottom") {
      return { x: node.pctX + node.pctW / 2, y: node.pctY + node.pctH }
    }

    return { x: node.pctX + node.pctW / 2, y: node.pctY + node.pctH / 2 }
  }

  return (
    <div className="relative w-full h-44 bg-[#0a0a0c] border border-border-default/45 rounded-xl overflow-hidden select-none mb-5 flex items-center justify-center shadow-inner shadow-black/40">
      {/* Draw edges first */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {template.edges.map((edge) => {
          const from = getHandlePos(edge.source, edge.sourceHandle, true)
          const to = getHandlePos(edge.target, edge.targetHandle, false)
          if (!from || !to) return null
          return (
            <path
              key={edge.id}
              d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.16)"
              strokeWidth={1.5}
            />
          )
        })}
      </svg>

      {/* Draw nodes */}
      {scaledNodes.map((node) => {
        const color = node.data.color || "#1F1F1F"
        const shape = node.data.shape || "rectangle"

        let borderRadiusClass = "rounded"
        if (shape === "circle" || shape === "pill") {
          borderRadiusClass = "rounded-full"
        } else if (shape === "rectangle") {
          borderRadiusClass = "rounded-md"
        }

        return (
          <div
            key={node.id}
            style={{
              position: "absolute",
              left: `${node.pctX}%`,
              top: `${node.pctY}%`,
              width: `${node.pctW}%`,
              height: `${node.pctH}%`,
              backgroundColor: color,
              borderColor: color,
              opacity: 0.3,
            }}
            className={`border border-opacity-60 ${borderRadiusClass}`}
          />
        )
      })}
    </div>
  )
}

export function StarterTemplatesModal({
  isOpen,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl sm:max-w-6xl w-[95vw] bg-bg-surface border-border-default shadow-2xl rounded-2xl p-6 md:p-8">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold text-text-primary">
            Import Template
          </DialogTitle>
          <DialogDescription className="text-sm text-text-secondary flex items-center gap-1.5 flex-wrap">
            Choose a starter template to pre-populate your canvas. Any existing nodes will be replaced — use{" "}
            <kbd className="px-1.5 py-0.5 text-[10px] font-sans font-semibold text-text-primary bg-bg-elevated border border-border-default rounded-md select-none">
              ⌘Z
            </kbd>{" "}
            to undo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 max-h-[70vh] md:max-h-none overflow-y-auto md:overflow-visible pr-1">
          {CANVAS_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="flex flex-col bg-bg-elevated/40 border border-border-default/50 hover:border-border-default hover:bg-bg-elevated/60 rounded-2xl p-5 transition-all duration-200"
            >
              <TemplatePreview template={template} />

              <h4 className="text-base font-semibold text-text-primary mb-2">
                {template.name}
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed flex-1 mb-5">
                {template.description}
              </p>

              <Button
                variant="outline"
                size="default"
                className="w-full text-xs font-semibold hover:bg-accent-primary hover:text-black hover:border-accent-primary transition-all duration-150 rounded-xl gap-2 flex items-center justify-center py-2 h-9"
                onClick={() => onImport(template)}
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                Import
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default StarterTemplatesModal
