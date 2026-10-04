import { ShapeItem, ShapeType } from '../types/shapes';

export type CoverPlacement = 'first_page' | 'last_page' | 'both_pages';
export type ShapeStyleTheme = 'royal_gold' | 'modern_indigo' | 'emerald_luxury' | 'geometric_minimal' | 'crimson_classic';

export interface CoverGenerationOptions {
  title: string;
  subtitle?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  synopsis?: string;
  imageUrl?: string;
  placement: CoverPlacement;
  theme?: ShapeStyleTheme;
  includeInteractiveShapes?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
}

const THEME_COLORS: Record<ShapeStyleTheme, {
  primary: string;
  secondary: string;
  accent: string;
  bgLight: string;
  border: string;
  text: string;
}> = {
  royal_gold: {
    primary: '#d97706',
    secondary: '#b45309',
    accent: '#f59e0b',
    bgLight: '#fffbeb',
    border: '#f59e0b',
    text: '#78350f'
  },
  modern_indigo: {
    primary: '#4f46e5',
    secondary: '#3730a3',
    accent: '#818cf8',
    bgLight: '#eef2ff',
    border: '#6366f1',
    text: '#1e1b4b'
  },
  emerald_luxury: {
    primary: '#059669',
    secondary: '#047857',
    accent: '#34d399',
    bgLight: '#ecfdf5',
    border: '#10b981',
    text: '#064e3b'
  },
  geometric_minimal: {
    primary: '#0f172a',
    secondary: '#334155',
    accent: '#64748b',
    bgLight: '#f8fafc',
    border: '#94a3b8',
    text: '#0f172a'
  },
  crimson_classic: {
    primary: '#e11d48',
    secondary: '#9f1239',
    accent: '#fb7185',
    bgLight: '#fff1f2',
    border: '#f43f5e',
    text: '#881337'
  }
};

/**
 * Generates Front Cover HTML
 */
export function generateFrontCoverHtml(options: {
  title: string;
  subtitle?: string;
  author?: string;
  imageUrl?: string;
  theme?: ShapeStyleTheme;
}): string {
  const theme = THEME_COLORS[options.theme || 'modern_indigo'];
  const title = options.title.trim() || 'عنوان الكتاب';
  const subtitle = options.subtitle?.trim() || 'إصدار علمي وثقافي مميز';
  const author = options.author?.trim() || 'تأليف: نخبة من الكتاب';

  const imageMarkup = options.imageUrl
    ? `
      <div style="margin: 25px auto; max-width: 480px; text-align: center; position: relative;">
        <div style="padding: 10px; background: white; border: 3px solid ${theme.border}; border-radius: 16px; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.18); display: inline-block;">
          <img src="${options.imageUrl}" alt="${title}" style="width: 100%; max-height: 440px; object-fit: cover; border-radius: 12px; display: block;" />
        </div>
      </div>
    `
    : `
      <div style="margin: 30px auto; width: 280px; height: 280px; border-radius: 50%; background: radial-gradient(circle, ${theme.bgLight} 0%, rgba(255,255,255,0.8) 70%, ${theme.border} 100%); border: 4px double ${theme.primary}; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.12);">
        <div style="font-size: 72px;">📖</div>
      </div>
    `;

  return `
    <div class="book-front-cover" style="direction: rtl; font-family: 'Cairo', sans-serif; text-align: center; padding: 60px 30px 40px; border: 4px double ${theme.primary}; border-radius: 20px; background: linear-gradient(180deg, #ffffff 0%, ${theme.bgLight} 100%); margin: 20px auto; max-width: 680px; box-shadow: 0 15px 40px -10px rgba(0,0,0,0.15); position: relative; overflow: hidden;">
      
      <!-- Top Decorative Ribbon / Banner Shape -->
      <div style="display: inline-block; background: ${theme.primary}; color: white; padding: 8px 32px; border-radius: 30px; font-size: 13px; font-weight: 700; letter-spacing: 1px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); border: 2px solid ${theme.accent};">
        ★ إصدار خاص ومعتمد ★
      </div>

      <!-- Main Book Title -->
      <h1 style="font-size: 42px; font-weight: 900; color: ${theme.text}; margin: 0 0 12px; line-height: 1.3; text-shadow: 0 2px 4px rgba(0,0,0,0.06);">
        ${title}
      </h1>

      <!-- Subtitle / Tagline -->
      <p style="font-size: 18px; color: ${theme.secondary}; font-weight: 600; margin: 0 auto 20px; max-width: 520px; line-height: 1.6;">
        ${subtitle}
      </p>

      <!-- Decorative Divider with Diamond and Stars -->
      <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin: 15px auto 25px; max-width: 320px;">
        <div style="flex: 1; height: 2px; background: linear-gradient(90deg, transparent, ${theme.border});"></div>
        <span style="color: ${theme.accent}; font-size: 16px;">✦ ❖ ✦</span>
        <div style="flex: 1; height: 2px; background: linear-gradient(90deg, ${theme.border}, transparent);"></div>
      </div>

      <!-- Cover Image Centerpiece -->
      ${imageMarkup}

      <!-- Author and Publisher Details -->
      <div style="margin-top: 35px; padding-top: 20px; border-top: 2px dashed ${theme.border}; display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 15px;">
        <div style="font-size: 16px; font-weight: 700; color: ${theme.text};">
          ✍️ ${author}
        </div>
        <div style="font-size: 13px; font-weight: 600; color: ${theme.secondary}; background: white; padding: 6px 18px; border-radius: 20px; border: 1px solid ${theme.border};">
          دار النشر والإنتاج المعرفي
        </div>
      </div>
    </div>
  `;
}

/**
 * Generates Back Cover HTML
 */
export function generateBackCoverHtml(options: {
  title: string;
  synopsis?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  theme?: ShapeStyleTheme;
}): string {
  const theme = THEME_COLORS[options.theme || 'modern_indigo'];
  const title = options.title.trim() || 'عن هذا الكتاب';
  const synopsis = options.synopsis?.trim() || `يقدم هذا المؤلف رحلة معرفية وشيقة في أعماق الموضوع، متناولاً أهم الأفكار والتطبيقات العملية والتحليلات الرصينة التي تفتح آفاقاً جديدة أمام القارئ والباحث. يتميز بأسلوب سردي مبسط وجذاب، مدعوماً بنماذج توضيحية وفريدة تجعله مرجعاً قيماً لا غنى عنه.`;
  const author = options.author?.trim() || 'المؤلف';
  const isbn = options.isbn?.trim() || '978-9948-12-345-6';

  return `
    <div class="book-back-cover" style="direction: rtl; font-family: 'Cairo', sans-serif; padding: 50px 35px 35px; border: 4px double ${theme.primary}; border-radius: 20px; background: linear-gradient(180deg, ${theme.bgLight} 0%, #ffffff 100%); margin: 25px auto; max-width: 680px; box-shadow: 0 15px 40px -10px rgba(0,0,0,0.15); position: relative;">
      
      <!-- Back Cover Top Header -->
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 12px; font-weight: 800; color: ${theme.primary}; letter-spacing: 2px; text-transform: uppercase;">الغلاف الخلفي وملخص الإصدار</span>
        <h2 style="font-size: 28px; font-weight: 900; color: ${theme.text}; margin: 8px 0 0;">${title}</h2>
      </div>

      <!-- Synopsis Frame Shape -->
      <div style="background: white; border: 2px solid ${theme.border}; border-radius: 16px; padding: 25px 22px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); position: relative;">
        <div style="position: absolute; top: -14px; right: 25px; background: ${theme.primary}; color: white; padding: 2px 14px; border-radius: 12px; font-size: 12px; font-weight: 700;">
          نبذة عن العمل
        </div>
        <p style="font-size: 15px; color: #334155; line-height: 1.8; margin: 0; text-align: justify;">
          ${synopsis}
        </p>
      </div>

      <!-- Praise / Testimonial Box Shape -->
      <div style="background: ${theme.bgLight}; border-right: 4px solid ${theme.primary}; padding: 15px 20px; border-radius: 0 12px 12px 0; margin-bottom: 30px;">
        <p style="font-size: 14px; font-style: italic; color: ${theme.secondary}; margin: 0; line-height: 1.6;">
          «إصدار متميز يجمع بين عمق الرؤية وجمال الطرح؛ يقدم إضافة نوعية ومفيدة لكل شغوف بالمعرفة.»
        </p>
        <div style="font-size: 12px; font-weight: 700; color: ${theme.text}; margin-top: 8px; text-align: left;">
          — مجلة القارئ والمثقف العربي
        </div>
      </div>

      <!-- Bottom Barcode & Publisher Seal Frame -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; padding-top: 20px; border-top: 2px dashed ${theme.border};">
        
        <!-- Publisher Badge -->
        <div>
          <div style="font-size: 14px; font-weight: 800; color: ${theme.text};">دار النشر الرقمي</div>
          <div style="font-size: 12px; color: ${theme.secondary};">جميع الحقوق محفوظة للمؤلف © ${new Date().getFullYear()}</div>
        </div>

        <!-- Simulated Barcode Shape Box -->
        <div style="background: white; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 8px 16px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
          <div style="font-family: monospace; font-size: 24px; letter-spacing: 3px; color: #1e293b; line-height: 1; user-select: none;">
            ||| | |||| | || | ||| ||
          </div>
          <div style="font-size: 10px; font-family: monospace; color: #64748b; margin-top: 4px;">
            ISBN: ${isbn}
          </div>
        </div>

      </div>

    </div>
  `;
}

/**
 * Generates Interactive ShapeItem objects to place directly on the Canvas (ShapesLayer)
 */
export function generateCoverShapes(options: {
  title: string;
  placement: CoverPlacement;
  theme?: ShapeStyleTheme;
  canvasWidth?: number;
  canvasHeight?: number;
  existingShapesCount?: number;
}): ShapeItem[] {
  const theme = THEME_COLORS[options.theme || 'modern_indigo'];
  const startZ = (options.existingShapesCount || 0) + 10;
  const shapes: ShapeItem[] = [];

  const width = options.canvasWidth || 816;
  const centerX = width / 2;

  // Front Cover Shapes
  if (options.placement === 'first_page' || options.placement === 'both_pages') {
    // 1. Top Ribbon Shape
    shapes.push({
      id: `shape-front-ribbon-${Date.now()}-1`,
      type: 'rounded-rectangle',
      x: Math.max(20, centerX - 160),
      y: 35,
      width: 320,
      height: 42,
      rotation: 0,
      fill: theme.primary,
      stroke: theme.accent,
      strokeWidth: 2,
      strokeStyle: 'solid',
      opacity: 0.95,
      zIndex: startZ + 1,
      text: '★ طبعة مميزة وموثقة ★',
      textStyle: {
        fontSize: 13,
        fontFamily: 'Cairo',
        color: '#ffffff',
        bold: true,
        italic: false,
        underline: false,
        align: 'center'
      },
      pageIndex: 0
    });

    // 2. Star Seal / Badge on Top-Right Corner
    shapes.push({
      id: `shape-front-star-${Date.now()}-2`,
      type: 'star',
      x: Math.min(width - 140, centerX + 180),
      y: 85,
      width: 90,
      height: 90,
      rotation: 12,
      fill: theme.accent,
      stroke: theme.primary,
      strokeWidth: 2,
      strokeStyle: 'solid',
      opacity: 0.95,
      zIndex: startZ + 2,
      text: 'مميز',
      textStyle: {
        fontSize: 14,
        fontFamily: 'Cairo',
        color: '#ffffff',
        bold: true,
        italic: false,
        underline: false,
        align: 'center'
      },
      pageIndex: 0
    });

    // 3. Hexagon Quality Mark on Bottom Left
    shapes.push({
      id: `shape-front-hex-${Date.now()}-3`,
      type: 'hexagon',
      x: 45,
      y: 680,
      width: 100,
      height: 85,
      rotation: 0,
      fill: theme.bgLight,
      stroke: theme.primary,
      strokeWidth: 2,
      strokeStyle: 'solid',
      opacity: 0.9,
      zIndex: startZ + 3,
      text: 'جودة 100%',
      textStyle: {
        fontSize: 12,
        fontFamily: 'Cairo',
        color: theme.primary,
        bold: true,
        italic: false,
        underline: false,
        align: 'center'
      },
      pageIndex: 0
    });

    // 4. Accent Diamond
    shapes.push({
      id: `shape-front-diamond-${Date.now()}-4`,
      type: 'diamond',
      x: centerX - 25,
      y: 200,
      width: 50,
      height: 50,
      rotation: 0,
      fill: 'transparent',
      stroke: theme.accent,
      strokeWidth: 2,
      strokeStyle: 'solid',
      opacity: 0.8,
      zIndex: startZ + 4,
      pageIndex: 0
    });
  }

  // Back Cover Shapes
  if (options.placement === 'last_page' || options.placement === 'both_pages') {
    const backCoverOffsetY = options.placement === 'both_pages' ? 1200 : 40;

    // Back Cover Speech Bubble / Review Quote Callout
    shapes.push({
      id: `shape-back-callout-${Date.now()}-5`,
      type: 'speech-bubble',
      x: Math.max(30, centerX - 170),
      y: backCoverOffsetY + 160,
      width: 340,
      height: 90,
      rotation: 0,
      fill: theme.bgLight,
      stroke: theme.primary,
      strokeWidth: 2,
      strokeStyle: 'solid',
      opacity: 0.92,
      zIndex: startZ + 5,
      text: '«كتاب استثنائي يثري المكتبة العربية»',
      textStyle: {
        fontSize: 13,
        fontFamily: 'Cairo',
        color: theme.text,
        bold: true,
        italic: true,
        underline: false,
        align: 'center'
      }
    });

    // Back Cover Barcode Rectangle Box
    shapes.push({
      id: `shape-back-barcode-${Date.now()}-6`,
      type: 'rounded-rectangle',
      x: Math.min(width - 220, centerX + 60),
      y: backCoverOffsetY + 620,
      width: 170,
      height: 70,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#94a3b8',
      strokeWidth: 1.5,
      strokeStyle: 'solid',
      opacity: 0.95,
      zIndex: startZ + 6,
      text: 'ISBN 978-0-1234',
      textStyle: {
        fontSize: 11,
        fontFamily: 'Cairo',
        color: '#1e293b',
        bold: true,
        italic: false,
        underline: false,
        align: 'center'
      }
    });
  }

  return shapes;
}
