
// Social Icons as Base64 SVGs for Canvas
const ICONS = {
  instagram: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgeD0iMiIgeT0iMiIgcng9IjUiIHJ5PSI1Ii8+PHBhdGggZD0iTTE2IDExLjM3QTRGIDQgMCAxIDEgMTIuNjMgOGA0IDQgMCAwIDEgMTYgMTEuMzN6Ii8+PHBhdGggZD0iTTE3LjUgNi41aC4wMWExIDEgMCAwIDEgMCAyejEiLz48L3N2Zz4=',
  facebook: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xOCAyaC0zYTUgNSAwIDAgMC01IDV2M0g3djRoM3Y4aDR2LThoM2wxLTRoLTRWN2ExIDEgMCAwIDEgMS0xaDN6Ii8+PC9zdmc+',
  youtube: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yLjUgMTdhMyAzIDAgMCAxLTMtM1YxMGEzIDMgMCAwIDEgMy0zaDE5YTMgMyAwIDAgMSAzIDN2NGEzIDMgMCAwIDEtMyAzWiIvPjxwYXRoIGQ9Ik0xMCAxNWw1LTMtNS0zeiIvPjwvc3ZnPg=='
};

interface BrandingConfig {
  name?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  logo?: string;
  watermarkPosition?: string;
  detailsPosition?: string;
  logoOpacity?: number;
  logoSize?: number;
  brandOpacity?: number;
  brandSize?: number;
  // Loose typing to handle incoming legacy/unstructured data
  [key: string]: any;
}

export const downloadMediaWithBranding = async (
  mediaItem: { url: string; name: string; type: 'photo' | 'video' },
  rawBranding: BrandingConfig | null
) => {
  // If video, we can't watermark on client side easily without re-encoding
  if (mediaItem.type === 'video') {
    downloadDirectly(mediaItem.url, mediaItem.name);
    return;
  }

  // If no branding at all, download directly
  if (!rawBranding) {
    downloadDirectly(mediaItem.url, mediaItem.name);
    return;
  }

  try {
    // NORMALIZE BRANDING CONFIG
    // This ensures we catch fields whether they are at root or nested in 'details'
    const branding: BrandingConfig = {
        ...rawBranding,
        ...(rawBranding.details || {}), // Merge nested details to top level
        // Explicitly map potentially different field names from Add page
        name: rawBranding.name || rawBranding.details?.brandName || rawBranding.details?.name,
        logo: rawBranding.logo || rawBranding.details?.logo,
        logoOpacity: rawBranding.logoOpacity ?? rawBranding.details?.logoOpacity,
        logoSize: rawBranding.logoSize ?? rawBranding.details?.logoSize,
        brandOpacity: rawBranding.brandOpacity ?? rawBranding.details?.brandOpacity,
        brandSize: rawBranding.brandSize ?? rawBranding.details?.brandSize
    };

    // 1. Load Original Image
    const img = await loadImage(mediaItem.url);
    
    // 2. Setup Canvas
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas context not supported");

    // 3. Draw Image
    ctx.drawImage(img, 0, 0);

    // 4. Draw Details Background (Gradient) & Text info
    // Check for presence of ANY detail field
    if (branding.name || branding.website || branding.instagram || branding.facebook || branding.youtube) {
        await drawBrandingDetails(ctx, canvas.width, canvas.height, branding);
    }

    // 5. Draw Logo (Watermark)
    if (branding.logo) {
        await drawLogo(ctx, canvas.width, canvas.height, branding.logo, branding.watermarkPosition || 'top-right', branding.logoOpacity, branding.logoSize);
    }

    // 6. Export & Download
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    downloadDirectly(dataUrl, mediaItem.name);

  } catch (error) {
    console.error("Error applying branding:", error);
    // Fallback
    downloadDirectly(mediaItem.url, mediaItem.name);
  }
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    });
};

const drawLogo = async (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    logoUrl: string, 
    position: string,
    opacity: number = 90,
    size: number = 15
) => {
    try {
        const wm = await loadImage(logoUrl);
        
        // Configuration
        const wmWidth = width * (size / 100); 
        const scale = wmWidth / wm.naturalWidth;
        const wmHeight = wm.naturalHeight * scale;
        const padding = width * 0.03; // 3% padding

        let x = 0;
        let y = 0;

        // Horizontal
        if (position.includes('left')) x = padding;
        else if (position.includes('right')) x = width - wmWidth - padding;
        else x = (width - wmWidth) / 2;

        // Vertical
        if (position.includes('top')) y = padding;
        else if (position.includes('bottom')) y = height - wmHeight - padding;
        else y = (height - wmHeight) / 2;

        ctx.save();
        ctx.globalAlpha = opacity / 100;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 5;
        ctx.drawImage(wm, x, y, wmWidth, wmHeight);
        ctx.restore();
    } catch (e) {
        console.warn("Could not draw logo", e);
    }
};

const drawBrandingDetails = async (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    branding: BrandingConfig
) => {
    const position = branding.detailsPosition || 'bottom-left';
    const opacity = branding.brandOpacity ?? 100;
    const sizeMultiplier = (branding.brandSize ?? 100) / 100;
    
    // --- 1. Draw Gradient Background ---
    ctx.save();
    let gradient;
    const gradSize = height * 0.5; // Cover 50% of height for better readability

    if (position.startsWith('top')) {
        gradient = ctx.createLinearGradient(0, 0, 0, gradSize);
        gradient.addColorStop(0, `rgba(0,0,0,${0.9 * (opacity / 100)})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, gradSize);
    } else if (position.startsWith('bottom')) {
        gradient = ctx.createLinearGradient(0, height - gradSize, 0, height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${0.9 * (opacity / 100)})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - gradSize, width, gradSize);
    } else {
        // Center - Darker overlay
        ctx.fillStyle = `rgba(0,0,0,${0.4 * (opacity / 100)})`;
        ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();

    // --- 2. Calculate Layout ---
    const padding = width * 0.04; 
    
    // Font Sizes relative to image
    const titleSize = Math.max(24, width * 0.035) * sizeMultiplier;
    const subSize = Math.max(16, width * 0.02) * sizeMultiplier;
    const iconSize = Math.max(20, width * 0.025) * sizeMultiplier;
    const gap = titleSize * 0.4;

    // Check which elements exist
    const hasName = !!branding.name;
    const hasWebsite = !!branding.website && branding.website !== 'N/A';
    const socialCount = [branding.instagram, branding.facebook, branding.youtube].filter(Boolean).length;
    const hasSocials = socialCount > 0;

    // Calculate Block Height
    let blockHeight = 0;
    if (hasName) blockHeight += titleSize;
    if (hasWebsite) blockHeight += (hasName ? gap : 0) + subSize;
    if (hasSocials) blockHeight += (hasName || hasWebsite ? gap * 1.5 : 0) + iconSize;

    // Calculate Start Y based on block height and position
    // Using 'top' baseline for all text drawing to simplify logic
    let startY = 0;

    if (position.includes('top')) {
        startY = padding;
    } else if (position.includes('bottom')) {
        startY = height - padding - blockHeight;
    } else {
        startY = (height - blockHeight) / 2;
    }

    // Determine X alignment
    let textX = padding;
    let textAlign: CanvasTextAlign = 'left';

    if (position.includes('left')) {
        textAlign = 'left';
        textX = padding;
    } else if (position.includes('right')) {
        textAlign = 'right';
        textX = width - padding;
    } else {
        textAlign = 'center';
        textX = width / 2;
    }

    // --- Drawing ---
    ctx.save();
    ctx.globalAlpha = opacity / 100;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    let currentY = startY;

    // 3. Brand Name
    if (hasName && branding.name) {
        ctx.font = `bold ${titleSize}px sans-serif`;
        ctx.textAlign = textAlign;
        ctx.fillText(branding.name, textX, currentY);
        currentY += titleSize + gap;
    }

    // 4. Website
    if (hasWebsite && branding.website) {
        ctx.font = `500 ${subSize}px sans-serif`;
        ctx.textAlign = textAlign;
        ctx.fillText(branding.website, textX, currentY);
        currentY += subSize + (gap * 1.5);
    }

    // 5. Social Icons
    if (hasSocials) {
        const iconGap = iconSize * 0.8;
        const totalSocialWidth = (socialCount * iconSize) + ((socialCount - 1) * iconGap);
        
        let startIconX = textX;
        
        if (textAlign === 'center') {
            startIconX = textX - (totalSocialWidth / 2);
        } else if (textAlign === 'right') {
            startIconX = textX - totalSocialWidth; 
        }

        let currentIconX = startIconX;

        const drawIcon = async (type: 'instagram' | 'facebook' | 'youtube') => {
            try {
                const iconImg = await loadImage(ICONS[type]);
                ctx.save();
                // Reset shadow for icons to keep crisp
                ctx.shadowBlur = 0; 
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                // Add a small drop shadow via filter if supported, or just draw
                ctx.filter = 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))'; 
                ctx.drawImage(iconImg, currentIconX, currentY, iconSize, iconSize);
                ctx.restore();
                currentIconX += iconSize + iconGap;
            } catch (e) {
                // ignore
            }
        };

        if (branding.instagram) await drawIcon('instagram');
        if (branding.facebook) await drawIcon('facebook');
        if (branding.youtube) await drawIcon('youtube');
    }
    ctx.restore();
};

const downloadDirectly = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
