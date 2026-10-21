/**
 * ImageKit.io Media Configuration and Manifest
 * 
 * Direct CDN integration providing:
 * - Ultra-fast global CDN delivery (AWS CloudFront / Cloudflare backbone)
 * - On-the-fly next-gen format conversion (WebP / AVIF)
 * - Automatic responsive thumbnail and low-latency viewport scaling
 * - Zero Sanity storage / bandwidth consumption
 */

export const IMAGEKIT_ENDPOINT = 'https://ik.imagekit.io/adhy2312';

/**
 * Generate an optimized ImageKit URL with custom real-time transformations.
 * @param {string} path - Relative path (e.g. 'photo/1' or 'design/1') or full ImageKit URL
 * @param {Object} options - Transformation options
 * @returns {string} Fully qualified CDN URL with transformations
 */
export const getImageKitUrl = (path, options = {}) => {
  if (!path) return '';
  if (path.startsWith('http') && !path.includes('ik.imagekit.io')) {
    return path; // External fallback
  }

  // Strip endpoint if full ImageKit URL was provided
  let cleanPath = path.replace(IMAGEKIT_ENDPOINT, '');
  // Remove leading slash
  if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);

  // If path already contains transformation params, remove them to re-apply cleanly
  cleanPath = cleanPath.replace(/^tr:[^/]+\//, '');

  const trs = [];
  if (options.width) trs.push(`w-${options.width}`);
  if (options.height) trs.push(`h-${options.height}`);
  if (options.quality) trs.push(`q-${options.quality}`);
  if (options.crop) trs.push(`c-${options.crop}`);
  if (options.focus) trs.push(`fo-${options.focus}`);
  if (options.blur) trs.push(`bl-${options.blur}`);
  if (options.format) trs.push(`f-${options.format}`);
  else trs.push('f-auto'); // Default next-gen format negotiation (WebP/AVIF)

  const trString = trs.length > 0 ? `tr:${trs.join(',')}` : 'tr:f-auto';
  return `${IMAGEKIT_ENDPOINT}/${trString}/${cleanPath}`;
};

/**
 * Fast thumbnail generator for the viewfinder preview filmstrip
 */
export const getImageKitThumb = (path, width = 200, height = 150) => {
  return getImageKitUrl(path, {
    width,
    height,
    crop: 'maintain_ratio',
    focus: 'auto',
    quality: 75,
    format: 'auto'
  });
};

/**
 * High-resolution master viewport generator for the active lens frame
 */
export const getImageKitMaster = (path, width = 1600, quality = 92) => {
  return getImageKitUrl(path, {
    width,
    quality,
    format: 'auto'
  });
};

/**
 * ─────────────────────────────────────────────────────────────
 * PHOTOGRAPHY MANIFEST (1 to 17 in 'photo' folder)
 * ─────────────────────────────────────────────────────────────
 */
export const IMAGEKIT_PHOTOS = [
  {
    path: 'photo/1',
    title: 'Ethereal Silhouette',
    category: 'Portraits',
    specs: { camera: 'Canon EOS R', lens: '85mm f/1.4L USM', shutter: '1/320s', aperture: 'f/1.4', iso: 'ISO 100', ev: '+0.3' }
  },
  {
    path: 'photo/2',
    title: 'Urban Geometry',
    category: 'Street Photography',
    specs: { camera: 'Leica M11', lens: '35mm Summicron-M', shutter: '1/1000s', aperture: 'f/2.8', iso: 'ISO 200', ev: '0.0' }
  },
  {
    path: 'photo/3',
    title: 'Nocturnal Velocity',
    category: 'Long Exposure',
    specs: { camera: 'Canon EOS R', lens: '24-70mm f/2.8L', shutter: '4.0s', aperture: 'f/8.0', iso: 'ISO 100', ev: '-0.7' }
  },
  {
    path: 'photo/4',
    title: 'Senate Stage Presence',
    category: 'Event Photography',
    specs: { camera: 'Canon EOS R', lens: '50mm f/1.2L', shutter: '1/500s', aperture: 'f/1.8', iso: 'ISO 400', ev: '+0.3' }
  },
  {
    path: 'photo/5',
    title: 'Apex Momentum',
    category: 'Automotive & Speed',
    specs: { camera: 'Canon EOS R', lens: '70-200mm f/2.8L', shutter: '1/1600s', aperture: 'f/2.8', iso: 'ISO 250', ev: '-0.3' }
  },
  {
    path: 'photo/6',
    title: 'Golden Hour Radiance',
    category: 'Nature Photography',
    specs: { camera: 'Leica M11', lens: '50mm Noctilux', shutter: '1/750s', aperture: 'f/1.4', iso: 'ISO 100', ev: '+0.7' }
  },
  {
    path: 'photo/7',
    title: 'Brutalist Monolith',
    category: 'Street Photography',
    specs: { camera: 'Leica M11', lens: '28mm Elmarit-M', shutter: '1/640s', aperture: 'f/4.0', iso: 'ISO 160', ev: '0.0' }
  },
  {
    path: 'photo/8',
    title: 'Candid Resonance',
    category: 'Event Photography',
    specs: { camera: 'Canon EOS R', lens: '35mm f/1.4L', shutter: '1/400s', aperture: 'f/2.0', iso: 'ISO 500', ev: '+0.0' }
  },
  {
    path: 'photo/9',
    title: 'Verdant Solitude',
    category: 'Nature Photography',
    specs: { camera: 'Canon EOS R', lens: '100mm f/2.8L Macro', shutter: '1/250s', aperture: 'f/3.2', iso: 'ISO 200', ev: '+0.3' }
  },
  {
    path: 'photo/10',
    title: 'High-Contrast Monochrom',
    category: 'Portraits',
    specs: { camera: 'Leica M11 Monochrom', lens: '50mm Summilux', shutter: '1/500s', aperture: 'f/1.4', iso: 'ISO 160', ev: '0.0' }
  },
  {
    path: 'photo/11',
    title: 'Neon Midnight Transit',
    category: 'Street Photography',
    specs: { camera: 'Leica M11', lens: '35mm Summicron-M', shutter: '1/125s', aperture: 'f/2.0', iso: 'ISO 1600', ev: '-0.3' }
  },
  {
    path: 'photo/12',
    title: 'Festival Euphoria',
    category: 'Event Photography',
    specs: { camera: 'Canon EOS R', lens: '24-70mm f/2.8L', shutter: '1/320s', aperture: 'f/2.8', iso: 'ISO 800', ev: '+0.0' }
  },
  {
    path: 'photo/13',
    title: 'Atmospheric Horizon',
    category: 'Nature Photography',
    specs: { camera: 'Canon EOS R', lens: '16-35mm f/2.8L', shutter: '1/800s', aperture: 'f/5.6', iso: 'ISO 100', ev: '+0.0' }
  },
  {
    path: 'photo/14',
    title: 'Light Painting Flow',
    category: 'Long Exposure',
    specs: { camera: 'Canon EOS R', lens: '35mm f/1.4L', shutter: '2.5s', aperture: 'f/5.6', iso: 'ISO 100', ev: '-0.7' }
  },
  {
    path: 'photo/15',
    title: 'The Portraitist',
    category: 'Portraits',
    specs: { camera: 'Canon EOS R', lens: '85mm f/1.4L', shutter: '1/640s', aperture: 'f/1.8', iso: 'ISO 200', ev: '+0.3' }
  },
  {
    path: 'photo/16',
    title: 'High Octane Shutter',
    category: 'Automotive & Speed',
    specs: { camera: 'Canon EOS R', lens: '70-200mm f/2.8L', shutter: '1/2000s', aperture: 'f/2.8', iso: 'ISO 400', ev: '0.0' }
  },
  {
    path: 'photo/17',
    title: 'Cinematic Decisive Moment',
    category: 'Street Photography',
    specs: { camera: 'Leica M11', lens: '50mm Summicron', shutter: '1/400s', aperture: 'f/2.0', iso: 'ISO 200', ev: '+0.0' }
  }
];

/**
 * ─────────────────────────────────────────────────────────────
 * DESIGN ARTBOARDS MANIFEST (1 to 12 in 'design' folder)
 * ─────────────────────────────────────────────────────────────
 */
export const IMAGEKIT_DESIGNS = [
  {
    path: 'design/1',
    title: 'FinTech Mobile Banking OS',
    subtitle: 'Next-gen biometric payments & portfolio wealth tracking',
    category: 'Mobile UI/UX',
    designSpecs: {
      tool: 'Figma',
      artboard: '393 × 852px (iOS Retina)',
      colors: ['#0A0E1A', '#2563EB', '#38BDF8', '#10B981', '#F8FAFC'],
      typography: 'Space Grotesk & Inter',
      type: 'Digital Product Design'
    }
  },
  {
    path: 'design/2',
    title: 'Senate Media Festival Identity',
    subtitle: 'Official visual branding, banners, and typography hierarchy',
    category: 'Brand Identity',
    designSpecs: {
      tool: 'Figma & Illustrator',
      artboard: '1080 × 1350px (Visual Key)',
      colors: ['#1A1A24', '#F4D03F', '#E11D48', '#8B5CF6', '#FFFFFF'],
      typography: 'Playfair Display & DM Sans',
      type: 'Identity & Editorial'
    }
  },
  {
    path: 'design/3',
    title: 'IoT Telemetry & Hardware Console',
    subtitle: 'Real-time microcontroller monitoring and sensor diagnostics dashboard',
    category: 'Web App UI',
    designSpecs: {
      tool: 'Figma',
      artboard: '1920 × 1080px (Desktop)',
      colors: ['#0B0F19', '#06B6D4', '#3B82F6', '#64748B', '#0F172A'],
      typography: 'Fira Code & Space Grotesk',
      type: 'Industrial Dashboard'
    }
  },
  {
    path: 'design/4',
    title: 'MBCET Senate Key Visuals',
    subtitle: 'High-contrast brutalist posters and social media announcements',
    category: 'Poster & Print',
    designSpecs: {
      tool: 'Photoshop & Figma',
      artboard: '3508 × 4960px (A3 Print)',
      colors: ['#121212', '#FF4655', '#FFC700', '#00F0FF', '#EEEEEE'],
      typography: 'Clash Display & Space Mono',
      type: 'Print & Key Visuals'
    }
  },
  {
    path: 'design/5',
    title: 'SaaS Analytics & Cloud Telemetry',
    subtitle: 'Comprehensive design system token library and component architecture',
    category: 'Design System',
    designSpecs: {
      tool: 'Figma Tokens',
      artboard: '1440 × 900px (Desktop)',
      colors: ['#0F172A', '#6366F1', '#EC4899', '#14B8A6', '#F1F5F9'],
      typography: 'Inter & JetBrains Mono',
      type: 'Design System & Tokens'
    }
  },
  {
    path: 'design/6',
    title: 'Minimalist Commerce Experience',
    subtitle: 'Frictionless checkout flow with micro-interactions and tactile feedback',
    category: 'Mobile UI/UX',
    designSpecs: {
      tool: 'Figma & Framer',
      artboard: '390 × 844px (Mobile)',
      colors: ['#FFFFFF', '#111111', '#B8860B', '#E5E5E5', '#666666'],
      typography: 'Cabinet Grotesk & DM Sans',
      type: 'E-Commerce Experience'
    }
  },
  {
    path: 'design/7',
    title: 'Cyberpunk Key Visual System',
    subtitle: 'High-energy festival visuals, glow shaders, and typographic rhythm',
    category: 'Social Media Design',
    designSpecs: {
      tool: 'Photoshop & Figma',
      artboard: '1080 × 1080px (Square Feed)',
      colors: ['#050505', '#00FFFF', '#FF0055', '#FFE600', '#FFFFFF'],
      typography: 'Syne & Fira Code',
      type: 'Creative Campaign'
    }
  },
  {
    path: 'design/8',
    title: 'Smart AgriTech Controller',
    subtitle: 'ESP32 sensor telemetry, automated irrigation, and soil moisture analytics',
    category: 'Mobile UI/UX',
    designSpecs: {
      tool: 'Figma',
      artboard: '393 × 852px (iOS)',
      colors: ['#062817', '#10B981', '#34D399', '#FCD34D', '#F9FAFB'],
      typography: 'Plus Jakarta Sans',
      type: 'Agritech Telemetry'
    }
  },
  {
    path: 'design/9',
    title: 'Odoo ERP Custom Module Interface',
    subtitle: 'Enterprise inventory BOM automation and production cycle tracking',
    category: 'Enterprise UI',
    designSpecs: {
      tool: 'Figma',
      artboard: '1920 × 1080px',
      colors: ['#1E1B4B', '#7C3AED', '#A78BFA', '#059669', '#F3F4F6'],
      typography: 'Space Grotesk & Roboto',
      type: 'Enterprise Workflow UI'
    }
  },
  {
    path: 'design/10',
    title: 'Student Senate Campaign Suite',
    subtitle: 'Unified promotional identity across digital displays and print media',
    category: 'Branding & Direction',
    designSpecs: {
      tool: 'Figma & Lightroom',
      artboard: '1920 × 1080px (Story/Banner)',
      colors: ['#0F172A', '#E11D48', '#FB923C', '#38BDF8', '#FFFFFF'],
      typography: 'Oswald & Montserrat',
      type: 'Campaign Direction'
    }
  },
  {
    path: 'design/11',
    title: 'Analog Synth Tactile Console',
    subtitle: 'Skeuomorphic digital knobs, waveform oscilloscopes, and MIDI controls',
    category: 'Experimental UI',
    designSpecs: {
      tool: 'Figma',
      artboard: '1280 × 800px (Tablet Landscape)',
      colors: ['#18181B', '#E11D48', '#22C55E', '#EAB308', '#27272A'],
      typography: 'Fira Code & Inter',
      type: 'Audio Software UI'
    }
  },
  {
    path: 'design/12',
    title: 'Autonomous Design Tokens & Guidelines',
    subtitle: 'Comprehensive brand standards, typography grid, and atomic component library',
    category: 'Design System',
    designSpecs: {
      tool: 'Figma Auto-Layout',
      artboard: 'Atomic Component Spec',
      colors: ['#0F172A', '#3B82F6', '#8B5CF6', '#10B981', '#F8FAFC'],
      typography: 'Space Grotesk & Inter',
      type: 'Atomic Design System'
    }
  }
];

/**
 * ─────────────────────────────────────────────────────────────
 * AUTO-DISCOVERY ENGINE FOR NEW IMAGEKIT UPLOADS
 * ─────────────────────────────────────────────────────────────
 * Automatically checks ImageKit for photos beyond #17 and designs beyond #12.
 * Whenever you upload 'photo/18', 'photo/19' or 'design/13' to ImageKit,
 * this engine detects them on page load using micro-probes (<300B)
 * and dynamically surfaces them on the website with ZERO code changes.
 */

export const probeImageExists = (url) => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    const img = new Image();
    let settled = false;
    img.onload = () => {
      if (!settled) {
        settled = true;
        resolve(true);
      }
    };
    img.onerror = () => {
      if (!settled) {
        settled = true;
        resolve(false);
      }
    };
    img.src = url;
    setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(false);
      }
    }, 3500);
  });
};

const STORAGE_KEY_PHOTOS = 'adhy_dynamic_ik_photos';
const STORAGE_KEY_DESIGNS = 'adhy_dynamic_ik_designs';

export const getCachedDynamicMedia = () => {
  if (typeof window === 'undefined') return { extraPhotos: [], extraDesigns: [] };
  try {
    const extraPhotos = JSON.parse(localStorage.getItem(STORAGE_KEY_PHOTOS) || '[]');
    const extraDesigns = JSON.parse(localStorage.getItem(STORAGE_KEY_DESIGNS) || '[]');
    return { extraPhotos, extraDesigns };
  } catch (e) {
    return { extraPhotos: [], extraDesigns: [] };
  }
};

export const autoDiscoverImageKitMedia = async (onUpdate) => {
  if (typeof window === 'undefined') return;

  const { extraPhotos: cachedPhotos, extraDesigns: cachedDesigns } = getCachedDynamicMedia();
  let currentExtraPhotos = [...cachedPhotos];
  let currentExtraDesigns = [...cachedDesigns];
  let hasNewItems = false;

  // 1. Probe for new photos starting after the highest known index
  let nextPhotoIndex = IMAGEKIT_PHOTOS.length + currentExtraPhotos.length + 1;
  while (nextPhotoIndex <= 100) {
    const probeUrl = getImageKitUrl(`photo/${nextPhotoIndex}`, { width: 20, quality: 10, format: 'auto' });
    const exists = await probeImageExists(probeUrl);
    if (!exists) break;

    const newPhoto = {
      path: `photo/${nextPhotoIndex}`,
      title: `Visual Frame #${nextPhotoIndex}`,
      category: 'Photography',
      specs: {
        camera: 'Canon EOS R',
        lens: '50mm f/1.8 STM',
        shutter: '1/500s',
        aperture: 'f/2.0',
        iso: 'ISO 200',
        ev: '+0.0'
      }
    };
    currentExtraPhotos.push(newPhoto);
    hasNewItems = true;
    nextPhotoIndex++;
  }

  // 2. Probe for new designs starting after the highest known index
  let nextDesignIndex = IMAGEKIT_DESIGNS.length + currentExtraDesigns.length + 1;
  while (nextDesignIndex <= 100) {
    const probeUrl = getImageKitUrl(`design/${nextDesignIndex}`, { width: 20, quality: 10, format: 'auto' });
    const exists = await probeImageExists(probeUrl);
    if (!exists) break;

    const newDesign = {
      path: `design/${nextDesignIndex}`,
      title: `Design Artboard #${nextDesignIndex}`,
      subtitle: 'Newly uploaded creative artboard',
      category: 'UI/UX Design',
      designSpecs: {
        tool: 'Figma',
        artboard: '1920 × 1080px (Retina)',
        colors: ['#0F172A', '#3B82F6', '#8B5CF6', '#10B981', '#F8FAFC'],
        typography: 'Space Grotesk & Inter',
        type: 'Digital Product Design'
      }
    };
    currentExtraDesigns.push(newDesign);
    hasNewItems = true;
    nextDesignIndex++;
  }

  if (hasNewItems) {
    try {
      localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(currentExtraPhotos));
      localStorage.setItem(STORAGE_KEY_DESIGNS, JSON.stringify(currentExtraDesigns));
    } catch (e) {}

    if (onUpdate) {
      onUpdate({
        extraPhotos: currentExtraPhotos,
        extraDesigns: currentExtraDesigns
      });
    }
  }
};

