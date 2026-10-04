import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShapeItem, ShapeType, BorderStyle, ShapeTextStyle } from '../types/shapes';
import { cn } from '../lib/utils';

export interface ShapesLayerProps {
  shapes: ShapeItem[];
  onChange?: (shapes: ShapeItem[]) => void;
  onShapesChange?: (shapes: ShapeItem[]) => void;
  selectedIds: string[];
  onSelect?: (ids: string[]) => void;
  onSelectIds?: (ids: string[]) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  containerWidth?: number;
  containerHeight?: number;
  readOnly?: boolean;
  disabled?: boolean;
}

type DragMode = 'move' | 'resize' | 'rotate' | null;
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const ShapesLayer: React.FC<ShapesLayerProps> = ({
  shapes,
  onChange,
  onShapesChange,
  selectedIds,
  onSelect,
  onSelectIds,
  containerRef,
  readOnly = false,
  disabled = false,
}) => {
  const isLocked = readOnly || disabled;
  const internalRef = useRef<HTMLDivElement | null>(null);
  const effectiveContainerRef = containerRef || internalRef;

  const handleShapesChange = useCallback((newShapes: ShapeItem[]) => {
    if (typeof onShapesChange === 'function') onShapesChange(newShapes);
    else if (typeof onChange === 'function') onChange(newShapes);
  }, [onShapesChange, onChange]);

  const handleSelectionChange = useCallback((ids: string[]) => {
    if (typeof onSelectIds === 'function') onSelectIds(ids);
    else if (typeof onSelect === 'function') onSelect(ids);
  }, [onSelectIds, onSelect]);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialShapes, setInitialShapes] = useState<ShapeItem[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus text input when entering editing mode
  useEffect(() => {
    if (editingTextId && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [editingTextId]);

  // Global keydown handler for shapes (Delete, Esc, Arrow keys)
  useEffect(() => {
    if (isLocked) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in an input or textarea, ignore
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (selectedIds.length > 0) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          handleShapesChange(shapes.filter(s => !selectedIds.includes(s.id)));
          handleSelectionChange([]);
        } else if (e.key === 'Escape') {
          handleSelectionChange([]);
          setEditingTextId(null);
        } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 2;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

          handleShapesChange(shapes.map(s => {
            if (selectedIds.includes(s.id)) {
              return { ...s, x: s.x + dx, y: s.y + dy };
            }
            return s;
          }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shapes, selectedIds, handleShapesChange, handleSelectionChange, isLocked]);

  // Get pointer coordinates relative to the container
  const getContainerCoords = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!effectiveContainerRef.current) return { x: 0, y: 0 };
    const rect = effectiveContainerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, [effectiveContainerRef]);

  // Handle shape selection and start move
  const handleShapePointerDown = (e: React.PointerEvent, shape: ShapeItem) => {
    if (isLocked) return;
    e.stopPropagation();

    // Multi-selection with shift key
    let newSelected: string[];
    if (e.shiftKey) {
      if (selectedIds.includes(shape.id)) {
        newSelected = selectedIds.filter(id => id !== shape.id);
      } else {
        newSelected = [...selectedIds, shape.id];
      }
    } else {
      if (!selectedIds.includes(shape.id)) {
        newSelected = [shape.id];
      } else {
        newSelected = selectedIds;
      }
    }
    handleSelectionChange(newSelected);

    // Group selection support: if shape belongs to a group, select all in group
    if (shape.groupId && !e.shiftKey) {
      const groupMembers = shapes.filter(s => s.groupId === shape.groupId).map(s => s.id);
      handleSelectionChange(groupMembers);
    }

    const coords = getContainerCoords(e);
    setDragMode('move');
    setDragStart(coords);
    setInitialShapes(JSON.parse(JSON.stringify(shapes)));
  };

  // Handle resize handle pointer down
  const handleResizePointerDown = (e: React.PointerEvent, handle: ResizeHandle) => {
    if (readOnly || selectedIds.length === 0) return;
    e.stopPropagation();
    const coords = getContainerCoords(e);
    setDragMode('resize');
    setActiveHandle(handle);
    setDragStart(coords);
    setInitialShapes(JSON.parse(JSON.stringify(shapes)));
  };

  // Handle rotate handle pointer down
  const handleRotatePointerDown = (e: React.PointerEvent) => {
    if (readOnly || selectedIds.length === 0) return;
    e.stopPropagation();
    const coords = getContainerCoords(e);
    setDragMode('rotate');
    setDragStart(coords);
    setInitialShapes(JSON.parse(JSON.stringify(shapes)));
  };

  // Dragging / Resizing / Rotating pointer move
  useEffect(() => {
    if (!dragMode || !dragStart || initialShapes.length === 0) return;

    const handlePointerMove = (e: PointerEvent) => {
      const coords = getContainerCoords(e);
      const dx = coords.x - dragStart.x;
      const dy = coords.y - dragStart.y;

      if (dragMode === 'move') {
        const updated = shapes.map(s => {
          if (selectedIds.includes(s.id)) {
            const init = initialShapes.find(is => is.id === s.id);
            if (init) {
              return {
                ...s,
                x: Math.max(0, init.x + dx),
                y: Math.max(0, init.y + dy)
              };
            }
          }
          return s;
        });
        handleShapesChange(updated);
      } else if (dragMode === 'resize' && activeHandle && selectedIds.length === 1) {
        const shapeId = selectedIds[0];
        const init = initialShapes.find(is => is.id === shapeId);
        if (!init) return;

        let newX = init.x;
        let newY = init.y;
        let newW = init.width;
        let newH = init.height;

        const minSize = 20;

        // Calculate resize based on handle
        if (activeHandle.includes('e')) {
          newW = Math.max(minSize, init.width + dx);
        }
        if (activeHandle.includes('s')) {
          newH = Math.max(minSize, init.height + dy);
        }
        if (activeHandle.includes('w')) {
          const possibleW = init.width - dx;
          if (possibleW >= minSize) {
            newW = possibleW;
            newX = init.x + dx;
          }
        }
        if (activeHandle.includes('n')) {
          const possibleH = init.height - dy;
          if (possibleH >= minSize) {
            newH = possibleH;
            newY = init.y + dy;
          }
        }

        const updated = shapes.map(s => {
          if (s.id === shapeId) {
            return {
              ...s,
              x: newX,
              y: newY,
              width: newW,
              height: newH
            };
          }
          return s;
        });
        handleShapesChange(updated);
      } else if (dragMode === 'rotate' && selectedIds.length === 1) {
        const shapeId = selectedIds[0];
        const init = initialShapes.find(is => is.id === shapeId);
        if (!init) return;

        const centerX = init.x + init.width / 2;
        const centerY = init.y + init.height / 2;

        const rad = Math.atan2(coords.y - centerY, coords.x - centerX);
        let deg = Math.round((rad * 180) / Math.PI) + 90; // +90 because handle is at top
        if (deg < 0) deg += 360;
        if (deg >= 360) deg -= 360;

        // Snap to 45 deg intervals if shift key is held
        if (e.shiftKey) {
          deg = Math.round(deg / 45) * 45;
        }

        const updated = shapes.map(s => {
          if (s.id === shapeId) {
            return { ...s, rotation: deg };
          }
          return s;
        });
        handleShapesChange(updated);
      }
    };

    const handlePointerUp = () => {
      setDragMode(null);
      setActiveHandle(null);
      setDragStart(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragMode, dragStart, initialShapes, activeHandle, selectedIds, shapes, handleShapesChange, getContainerCoords]);

  // Render SVG Path/Geometry for each shape type
  const renderShapeContent = (shape: ShapeItem) => {
    const { width: w, height: h, fill, stroke, strokeWidth, strokeStyle, opacity } = shape;
    
    // Stroke dasharray configuration
    let dashArray: string | undefined = undefined;
    if (strokeStyle === 'dashed') dashArray = '6,6';
    else if (strokeStyle === 'dotted') dashArray = '2,4';

    const commonSvgProps = {
      fill,
      stroke,
      strokeWidth,
      strokeDasharray: dashArray,
      strokeLinejoin: 'round' as const,
      strokeLinecap: 'round' as const,
    };

    switch (shape.type) {
      case 'rectangle':
        return <rect x={strokeWidth / 2} y={strokeWidth / 2} width={Math.max(0, w - strokeWidth)} height={Math.max(0, h - strokeWidth)} {...commonSvgProps} />;

      case 'rounded-rectangle':
        return <rect x={strokeWidth / 2} y={strokeWidth / 2} width={Math.max(0, w - strokeWidth)} height={Math.max(0, h - strokeWidth)} rx={14} ry={14} {...commonSvgProps} />;

      case 'circle':
      case 'ellipse':
        return <ellipse cx={w / 2} cy={h / 2} rx={Math.max(0, (w - strokeWidth) / 2)} ry={Math.max(0, (h - strokeWidth) / 2)} {...commonSvgProps} />;

      case 'triangle':
        const triPoints = `${w / 2},${strokeWidth} ${w - strokeWidth},${h - strokeWidth} ${strokeWidth},${h - strokeWidth}`;
        return <polygon points={triPoints} {...commonSvgProps} />;

      case 'diamond':
        const diamondPoints = `${w / 2},${strokeWidth} ${w - strokeWidth},${h / 2} ${w / 2},${h - strokeWidth} ${strokeWidth},${h / 2}`;
        return <polygon points={diamondPoints} {...commonSvgProps} />;

      case 'star': {
        const cx = w / 2;
        const cy = h / 2;
        const spikes = 5;
        const outerRadius = Math.min(w, h) / 2 - strokeWidth;
        const innerRadius = outerRadius / 2.2;
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;
        let points = '';
        for (let i = 0; i < spikes; i++) {
          const x1 = cx + Math.cos(rot) * outerRadius;
          const y1 = cy + Math.sin(rot) * outerRadius;
          points += `${x1},${y1} `;
          rot += step;
          const x2 = cx + Math.cos(rot) * innerRadius;
          const y2 = cy + Math.sin(rot) * innerRadius;
          points += `${x2},${y2} `;
          rot += step;
        }
        return <polygon points={points.trim()} {...commonSvgProps} />;
      }

      case 'hexagon': {
        const p1 = `${w * 0.25},${strokeWidth}`;
        const p2 = `${w * 0.75},${strokeWidth}`;
        const p3 = `${w - strokeWidth},${h * 0.5}`;
        const p4 = `${w * 0.75},${h - strokeWidth}`;
        const p5 = `${w * 0.25},${h - strokeWidth}`;
        const p6 = `${strokeWidth},${h * 0.5}`;
        return <polygon points={`${p1} ${p2} ${p3} ${p4} ${p5} ${p6}`} {...commonSvgProps} />;
      }

      case 'pentagon': {
        const p1 = `${w * 0.5},${strokeWidth}`;
        const p2 = `${w - strokeWidth},${h * 0.38}`;
        const p3 = `${w * 0.81},${h - strokeWidth}`;
        const p4 = `${w * 0.19},${h - strokeWidth}`;
        const p5 = `${strokeWidth},${h * 0.38}`;
        return <polygon points={`${p1} ${p2} ${p3} ${p4} ${p5}`} {...commonSvgProps} />;
      }

      case 'arrow': {
        // Right facing block arrow
        const headW = w * 0.4;
        const shaftH = h * 0.4;
        const shaftTop = (h - shaftH) / 2;
        const shaftBottom = shaftTop + shaftH;
        const path = `M ${strokeWidth},${shaftTop} L ${w - headW},${shaftTop} L ${w - headW},${strokeWidth} L ${w - strokeWidth},${h / 2} L ${w - headW},${h - strokeWidth} L ${w - headW},${shaftBottom} L ${strokeWidth},${shaftBottom} Z`;
        return <path d={path} {...commonSvgProps} />;
      }

      case 'arrow-left': {
        // Left facing block arrow
        const headW = w * 0.4;
        const shaftH = h * 0.4;
        const shaftTop = (h - shaftH) / 2;
        const shaftBottom = shaftTop + shaftH;
        const path = `M ${w - strokeWidth},${shaftTop} L ${headW},${shaftTop} L ${headW},${strokeWidth} L ${strokeWidth},${h / 2} L ${headW},${h - strokeWidth} L ${headW},${shaftBottom} L ${w - strokeWidth},${shaftBottom} Z`;
        return <path d={path} {...commonSvgProps} />;
      }

      case 'double-arrow': {
        const headW = Math.min(w * 0.3, 30);
        const shaftH = h * 0.4;
        const shaftTop = (h - shaftH) / 2;
        const shaftBottom = shaftTop + shaftH;
        const path = `M ${headW},${shaftTop} L ${w - headW},${shaftTop} L ${w - headW},${strokeWidth} L ${w - strokeWidth},${h / 2} L ${w - headW},${h - strokeWidth} L ${w - headW},${shaftBottom} L ${headW},${shaftBottom} L ${headW},${h - strokeWidth} L ${strokeWidth},${h / 2} L ${headW},${strokeWidth} Z`;
        return <path d={path} {...commonSvgProps} />;
      }

      case 'line': {
        return <line x1={strokeWidth} y1={h / 2} x2={w - strokeWidth} y2={h / 2} {...commonSvgProps} strokeWidth={Math.max(strokeWidth, 3)} />;
      }

      case 'callout': {
        // Rectangular callout with tail at bottom-left
        const tailH = Math.min(h * 0.25, 25);
        const bodyH = h - tailH;
        const r = 8;
        const path = `
          M ${r},0 
          L ${w - r},0 
          A ${r} ${r} 0 0 1 ${w} ${r} 
          L ${w} ${bodyH - r} 
          A ${r} ${r} 0 0 1 ${w - r} ${bodyH} 
          L ${w * 0.4} ${bodyH} 
          L ${w * 0.2} ${h} 
          L ${w * 0.25} ${bodyH} 
          L ${r} ${bodyH} 
          A ${r} ${r} 0 0 1 0 ${bodyH - r} 
          L 0 ${r} 
          A ${r} ${r} 0 0 1 ${r} 0 
          Z
        `;
        return <path d={path} {...commonSvgProps} />;
      }

      case 'speech-bubble': {
        // Oval speech bubble with tail
        const tailH = Math.min(h * 0.25, 25);
        const bodyH = h - tailH;
        const path = `
          M ${w * 0.5} 0
          C ${w * 0.8} 0, ${w} ${bodyH * 0.2}, ${w} ${bodyH * 0.5}
          C ${w} ${bodyH * 0.8}, ${w * 0.8} ${bodyH}, ${w * 0.5} ${bodyH}
          C ${w * 0.4} ${bodyH}, ${w * 0.3} ${bodyH * 0.95}, ${w * 0.2} ${bodyH}
          L ${w * 0.1} ${h}
          L ${w * 0.18} ${bodyH * 0.85}
          C ${w * 0.08} ${bodyH * 0.75}, 0 ${bodyH * 0.65}, 0 ${bodyH * 0.5}
          C 0 ${bodyH * 0.2}, ${w * 0.2} 0, ${w * 0.5} 0
          Z
        `;
        return <path d={path} {...commonSvgProps} />;
      }

      default:
        return <rect width={w} height={h} {...commonSvgProps} />;
    }
  };

  // Update text of a shape
  const handleTextChange = (shapeId: string, newText: string) => {
    handleShapesChange(shapes.map(s => {
      if (s.id === shapeId) {
        return { ...s, text: newText };
      }
      return s;
    }));
  };

  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none z-20 overflow-visible"
      onClick={(e) => {
        // Deselect if clicking on empty area
        if (e.target === e.currentTarget && !readOnly) {
          handleSelectionChange([]);
          setEditingTextId(null);
        }
      }}
    >
      {shapes.map((shape) => {
        const isSelected = selectedIds.includes(shape.id);
        const isEditingThisText = editingTextId === shape.id;
        const zIndex = shape.zIndex || 1;

        return (
          <div
            key={shape.id}
            id={`shape-${shape.id}`}
            style={{
              position: 'absolute',
              left: `${shape.x}px`,
              top: `${shape.y}px`,
              width: `${shape.width}px`,
              height: `${shape.height}px`,
              transform: `rotate(${shape.rotation}deg)`,
              transformOrigin: 'center center',
              zIndex: isSelected ? 100 : zIndex,
              opacity: shape.opacity ?? 1,
              pointerEvents: readOnly ? 'none' : 'auto',
            }}
            className={cn(
              "group cursor-move transition-shadow duration-75",
              isSelected && !readOnly && "ring-2 ring-primary-500/80 shadow-lg rounded-xs"
            )}
            onPointerDown={(e) => handleShapePointerDown(e, shape)}
            onDoubleClick={(e) => {
              if (readOnly) return;
              e.stopPropagation();
              setEditingTextId(shape.id);
            }}
          >
            {/* SVG Shape Graphic */}
            <svg
              width="100%"
              height="100%"
              className="overflow-visible block drop-shadow-2xs"
              style={{ overflow: 'visible' }}
            >
              {renderShapeContent(shape)}
            </svg>

            {/* Text Overlay inside Shape */}
            <div 
              className="absolute inset-0 flex items-center justify-center p-2 pointer-events-none"
              style={{
                textAlign: shape.textStyle?.align || 'center',
                fontFamily: shape.textStyle?.fontFamily || 'Cairo',
                fontSize: `${shape.textStyle?.fontSize || 14}px`,
                fontWeight: shape.textStyle?.bold ? 'bold' : 'normal',
                fontStyle: shape.textStyle?.italic ? 'italic' : 'normal',
                textDecoration: shape.textStyle?.underline ? 'underline' : 'none',
                color: shape.textStyle?.color || '#ffffff',
                textShadow: shape.fill === 'transparent' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {!isEditingThisText && (
                <span className="break-words max-w-full select-none leading-snug">
                  {shape.text || ''}
                </span>
              )}

              {isEditingThisText && (
                <textarea
                  ref={textInputRef}
                  value={shape.text || ''}
                  onChange={(e) => handleTextChange(shape.id, e.target.value)}
                  onBlur={() => setEditingTextId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' || (e.key === 'Enter' && e.ctrlKey)) {
                      setEditingTextId(null);
                    }
                  }}
                  className="w-full h-full bg-transparent resize-none border-none outline-none text-center pointer-events-auto leading-snug focus:ring-0"
                  style={{
                    fontFamily: shape.textStyle?.fontFamily || 'Cairo',
                    fontSize: `${shape.textStyle?.fontSize || 14}px`,
                    fontWeight: shape.textStyle?.bold ? 'bold' : 'normal',
                    color: shape.textStyle?.color || '#ffffff',
                  }}
                  placeholder="اكتب هنا..."
                />
              )}
            </div>

            {/* Selection Bounding Box, Rotate & Resize Handles */}
            {isSelected && !readOnly && (
              <>
                {/* Rotate Handle */}
                <div 
                  className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing group/rot"
                  onPointerDown={handleRotatePointerDown}
                  title="تدوير الشكل"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-primary-600 border-2 border-white shadow-md hover:scale-125 transition-transform" />
                  <div className="w-0.5 h-3.5 bg-primary-500" />
                </div>

                {/* 8 Resize Handles */}
                {/* NW */}
                <div 
                  className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-primary-600 rounded-full shadow-xs cursor-nwse-resize hover:scale-125 transition-transform" 
                  onPointerDown={(e) => handleResizePointerDown(e, 'nw')} 
                />
                {/* N */}
                <div 
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-primary-600 rounded-full shadow-xs cursor-ns-resize hover:scale-125 transition-transform" 
                  onPointerDown={(e) => handleResizePointerDown(e, 'n')} 
                />
                {/* NE */}
                <div 
                  className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-primary-600 rounded-full shadow-xs cursor-nesw-resize hover:scale-125 transition-transform" 
                  onPointerDown={(e) => handleResizePointerDown(e, 'ne')} 
                />
                {/* E */}
                <div 
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-primary-600 rounded-full shadow-xs cursor-ew-resize hover:scale-125 transition-transform" 
                  onPointerDown={(e) => handleResizePointerDown(e, 'e')} 
                />
                {/* SE */}
                <div 
                  className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-primary-600 rounded-full shadow-xs cursor-nwse-resize hover:scale-125 transition-transform" 
                  onPointerDown={(e) => handleResizePointerDown(e, 'se')} 
                />
                {/* S */}
                <div 
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-primary-600 rounded-full shadow-xs cursor-ns-resize hover:scale-125 transition-transform" 
                  onPointerDown={(e) => handleResizePointerDown(e, 's')} 
                />
                {/* SW */}
                <div 
                  className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-primary-600 rounded-full shadow-xs cursor-nesw-resize hover:scale-125 transition-transform" 
                  onPointerDown={(e) => handleResizePointerDown(e, 'sw')} 
                />
                {/* W */}
                <div 
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-primary-600 rounded-full shadow-xs cursor-ew-resize hover:scale-125 transition-transform" 
                  onPointerDown={(e) => handleResizePointerDown(e, 'w')} 
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ShapesLayer;
