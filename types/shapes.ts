export type ShapeType = 
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'star'
  | 'arrow'
  | 'arrow-left'
  | 'line'
  | 'double-arrow'
  | 'callout'
  | 'speech-bubble'
  | 'diamond'
  | 'hexagon'
  | 'pentagon';

export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'double';

export type TextWrapMode = 'in-front' | 'behind' | 'in-line' | 'square';

export interface ShapeTextStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'center' | 'left' | 'right';
}

export interface ShapeItem {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  fill: string; // color hex, rgba, transparent
  stroke: string; // border color
  strokeWidth: number; // border thickness
  strokeStyle: BorderStyle;
  opacity: number; // 0 to 1
  zIndex: number;
  groupId?: string | null;
  text?: string;
  textStyle?: ShapeTextStyle;
  textWrap?: TextWrapMode;
  pageIndex?: number; // 0-based page index if multi-page
}

export interface JoedMetadata {
  format: 'JOED';
  version: string; // '1.0'
  title: string;
  createdAt: string;
  updatedAt: string;
  language: string;
  direction: 'rtl' | 'ltr';
  generator: string;
}

export interface JoedDocument {
  format: 'JOED';
  version: '1.0';
  metadata: JoedMetadata;
  pageLayout: {
    margins: 'normal' | 'narrow' | 'wide';
    orientation: 'portrait' | 'landscape';
    pageSize?: 'A4' | 'Letter';
  };
  content: string; // HTML content of the document
  shapes: ShapeItem[];
  assets?: Record<string, string>; // base64 images or embedded assets
  settings?: {
    fontFamily?: string;
    fontSize?: number;
    theme?: 'light' | 'dark';
    showRuler?: boolean;
    showGrid?: boolean;
  };
}
