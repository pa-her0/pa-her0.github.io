"use client"

import { useId, useState } from "react"
import { Backpack, Check, RotateCw, Undo2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { BrickThumbnail } from "@/components/ui/brick-thumbnail"
import { BRICK_DEFINITIONS, BRICK_KIT, type BrickKind, type QuarterTurn } from "@/data/brick-kit"

type BrickBackpackProps = {
  kind: BrickKind
  turn: QuarterTurn
  disabled: boolean
  onSelect: (kind: BrickKind) => void
  onRotate: () => void
  onUndo: () => void
}

export function BrickBackpack({ kind, turn, disabled, onSelect, onRotate, onUndo }: BrickBackpackProps) {
  const [open, setOpen] = useState(false)
  const headingId = useId()
  return (
    <div className="gradient-menu brick-backpack">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="glass" size="glass" disabled={disabled} aria-label="打开积木背包">
            <span className="gradient-menu__surface" aria-hidden="true" />
            <span className="gradient-menu__icon" aria-hidden="true"><Backpack strokeWidth={1.7} /></span>
            <span className="gradient-menu__label" aria-hidden="true">Blocks</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent variant="backpack" align="start" sideOffset={12} collisionPadding={16} aria-labelledby={headingId}>
          <div className="brick-backpack__header">
            <h2 id={headingId}>积木背包</h2>
            <Button variant="ghost" size="icon" aria-label="关闭积木背包" onClick={() => setOpen(false)}><X aria-hidden="true" /></Button>
          </div>
          <ScrollArea className="brick-backpack__scroll" aria-label="积木种类">
            <ToggleGroup type="single" variant="brick" size="brick" className="brick-backpack__grid" value={kind} aria-label="选择积木形状" onValueChange={(value) => {
              if (BRICK_KIT.some((brick) => brick.id === value)) onSelect(value as BrickKind)
            }}>
              {BRICK_KIT.map((brick) => (
                <ToggleGroupItem key={brick.id} value={brick.id} aria-label={`${brick.name}，${brick.size}`}>
                  <BrickThumbnail kind={brick.id} />
                  <span className="brick-backpack__piece-name">{brick.name}</span>
                  <span className="brick-backpack__piece-dimensions">{brick.size}</span>
                  <Check className="brick-backpack__check" aria-hidden="true" />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </ScrollArea>
          <div className="brick-backpack__footer">
            <span>{BRICK_DEFINITIONS[kind].name}</span>
            <div className="brick-backpack__tools">
              <Button variant="ghost" size="sm" onClick={onRotate} aria-label={`旋转积木 90 度，当前 ${turn * 90} 度`} title="旋转 90°（R）"><RotateCw aria-hidden="true" /><span>{turn * 90}°</span></Button>
              <Button variant="ghost" size="icon" onClick={onUndo} aria-label="撤销上一步" title="撤销（Ctrl + Z）"><Undo2 aria-hidden="true" /></Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
