// Image Processing Utility for Client-Side Branding and Downloads


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
    // Dynamic API fields not covered by the named properties above
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

// ============ Helper Functions ============

const loadImage = async (src: string): Promise<HTMLImageElement> => {
    if (!src) throw new Error("Image source is empty");

    // For Data URLs, just load directly
    if (src.startsWith('data:')) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error(`Failed to load data URL: ${e}`));
            img.src = src;
        });
    }

    try {
        // Attempt to load via fetch to be more explicit about CORS and bypass cache issues
        const response = await fetch(src, {
            mode: 'cors',
            credentials: 'omit' // Usually don't need credentials for public assets
        });

        if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(blobUrl);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(blobUrl);
                reject(new Error(`Failed to load image from blob URL created from ${src}`));
            };
            img.src = blobUrl;
        });
    } catch (e) {
        console.warn(`Fetch-based image load failed for ${src}, falling back to traditional loading:`, e);
        // Traditional fallback
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            // Add cache buster to bypass potentially tainted caches
            const cacheBuster = (src.includes('?') ? '&' : '?') + 't=' + Date.now();
            img.src = src + cacheBuster;
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Traditional image load failed for ${src}`));
        });
    }
};

const downloadBlob = async (url: string, name: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
    } catch (e) {
        console.error("Blob download failed, falling back to direct link", e);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const downloadDirectly = async (url: string, name: string) => {
    await downloadBlob(url, name);
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
        console.log(`Drawing logo: ${logoUrl} at ${position} with size ${size}% and opacity ${opacity}%`);
        const wm = await loadImage(logoUrl);

        // Ensure size is valid
        const validSize = (size && size > 0) ? size : 15;
        const wmWidth = width * (validSize / 100);

        // Ensure naturalWidth is valid to avoid NaN/Infinity
        if (!wm.naturalWidth || wm.naturalWidth === 0) {
            console.warn("Logo has 0 width, skipping", logoUrl);
            return;
        }

        const scale = wmWidth / wm.naturalWidth;
        const wmHeight = wm.naturalHeight * scale;
        const padding = width * 0.04; // Standardize padding to 4%

        let x = 0;
        let y = 0;

        if (position.includes('left')) x = padding;
        else if (position.includes('right')) x = width - wmWidth - padding;
        else x = (width - wmWidth) / 2;

        if (position.includes('top')) y = padding;
        else if (position.includes('bottom')) y = height - wmHeight - padding;
        else y = (height - wmHeight) / 2;

        ctx.save();
        ctx.globalAlpha = (opacity ?? 90) / 100;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 5;
        ctx.drawImage(wm, x, y, wmWidth, wmHeight);
        ctx.restore();
        console.log("Logo drawn successfully");
    } catch (e) {
        console.warn("Could not draw logo:", e);
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

    ctx.save();
    let gradient;
    const gradSize = height * 0.5;

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
        ctx.fillStyle = `rgba(0,0,0,${0.4 * (opacity / 100)})`;
        ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();

    const padding = width * 0.04;
    const titleSize = Math.max(24, width * 0.035) * sizeMultiplier;
    const subSize = Math.max(16, width * 0.02) * sizeMultiplier;
    const iconSize = Math.max(20, width * 0.025) * sizeMultiplier;
    const gap = titleSize * 0.4;

    const hasName = !!branding.name;
    const hasWebsite = !!branding.website && branding.website !== 'N/A';
    const socialCount = [branding.instagram, branding.facebook, branding.youtube].filter(Boolean).length;
    const hasSocials = socialCount > 0;

    let blockHeight = 0;
    if (hasName) blockHeight += titleSize;
    if (hasWebsite) blockHeight += (hasName ? gap : 0) + subSize;
    if (hasSocials) blockHeight += (hasName || hasWebsite ? gap * 1.5 : 0) + iconSize;

    let startY = 0;
    if (position.includes('top')) startY = padding;
    else if (position.includes('bottom')) startY = height - padding - blockHeight;
    else startY = (height - blockHeight) / 2;

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

    ctx.save();
    ctx.globalAlpha = opacity / 100;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    let currentY = startY;

    if (hasName && branding.name) {
        ctx.font = `bold ${titleSize}px sans-serif`;
        ctx.textAlign = textAlign;
        ctx.fillText(branding.name, textX, currentY);
        currentY += titleSize + gap;
    }

    if (hasWebsite && branding.website) {
        ctx.font = `500 ${subSize}px sans-serif`;
        ctx.textAlign = textAlign;
        ctx.fillText(branding.website, textX, currentY);
        currentY += subSize + (gap * 1.5);
    }

    if (hasSocials) {
        const iconGap = iconSize * 0.8;
        const totalSocialWidth = (socialCount * iconSize) + ((socialCount - 1) * iconGap);
        let startIconX = textX;

        if (textAlign === 'center') startIconX = textX - (totalSocialWidth / 2);
        else if (textAlign === 'right') startIconX = textX - totalSocialWidth;

        let currentIconX = startIconX;

        const drawIcon = async (type: 'instagram' | 'facebook' | 'youtube') => {
            try {
                const iconImg = await loadImage(ICONS[type]);
                ctx.save();
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.filter = 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))';
                ctx.drawImage(iconImg, currentIconX, currentY, iconSize, iconSize);
                ctx.restore();
                currentIconX += iconSize + iconGap;
            } catch (e) { }
        };

        if (branding.instagram) await drawIcon('instagram');
        if (branding.facebook) await drawIcon('facebook');
        if (branding.youtube) await drawIcon('youtube');
    }
    ctx.restore();
};

// ============ Main Export ============

export const downloadMediaWithBranding = async (
    mediaItem: { id: string; url: string; name: string; type: 'photo' | 'video' },
    rawBranding: BrandingConfig | null
) => {
    if (mediaItem.type === 'video') {
        downloadDirectly(mediaItem.url, mediaItem.name);
        return;
    }

    if (!rawBranding) {
        downloadDirectly(mediaItem.url, mediaItem.name);
        return;
    }

    try {
        const branding: BrandingConfig = {
            ...rawBranding,
            // Prioritize direct properties from new API structure
            name: rawBranding.name || rawBranding.brandName,
            logo: rawBranding.logo || rawBranding.logoUrl,
            logoOpacity: rawBranding.logoOpacity,
            logoSize: rawBranding.logoSize,
            brandOpacity: rawBranding.brandOpacity,
            brandSize: rawBranding.brandSize,
            watermarkPosition: rawBranding.watermarkPosition,
            detailsPosition: rawBranding.detailsPosition
        };

        console.log("Processing image with branding:", {
            media: mediaItem.name,
            hasLogo: !!branding.logo,
            logoUrl: branding.logo,
            position: branding.watermarkPosition
        });

        const img = await loadImage(mediaItem.url);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context not supported");

        ctx.drawImage(img, 0, 0);

        if (branding.name || branding.website || branding.instagram || branding.facebook || branding.youtube) {
            await drawBrandingDetails(ctx, canvas.width, canvas.height, branding);
        }

        if (branding.logo) {
            await drawLogo(ctx, canvas.width, canvas.height, branding.logo, branding.watermarkPosition || 'top-right', branding.logoOpacity, branding.logoSize);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        await downloadBlob(dataUrl, mediaItem.name);

    } catch (error) {
        console.error("Error applying branding:", error);
        downloadDirectly(mediaItem.url, mediaItem.name);
    }
};
