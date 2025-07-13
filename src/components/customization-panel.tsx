'use client';
import { useEffect, useState } from "react";

function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

export default function CustomizationPanel() {
  const [primaryColor, setPrimaryColor] = useState("#64B5F6");
  const [backgroundColor, setBackgroundColor] = useState("#F5F5F5");
  const [accentColor, setAccentColor] = useState("#FFEB3B");

  useEffect(() => {
    const primaryHsl = hexToHsl(primaryColor);
    if(primaryHsl) document.documentElement.style.setProperty('--primary', primaryHsl);
    if(primaryHsl) document.documentElement.style.setProperty('--ring', primaryHsl);
  }, [primaryColor]);

  useEffect(() => {
    const backgroundHsl = hexToHsl(backgroundColor);
    if(backgroundHsl) {
        document.documentElement.style.setProperty('--background', backgroundHsl);
        document.documentElement.style.setProperty('--card', backgroundHsl === '0 0% 100%' ? '0 0% 100%' : backgroundHsl);
    }
  }, [backgroundColor]);
  
  useEffect(() => {
    const accentHsl = hexToHsl(accentColor);
    if(accentHsl) document.documentElement.style.setProperty('--accent', accentHsl);
  }, [accentColor]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Change the look and feel of your schedule. These changes are temporary and may not affect all elements.</p>
      <div className="space-y-3">
        <div className="space-y-1">
            <label htmlFor="primaryColor" className="text-sm font-medium">Primary</label>
            <div className="flex items-center gap-2">
                <input id="primaryColor" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-8 h-8 p-0 bg-transparent border-none cursor-pointer" />
                <span className="text-sm text-muted-foreground">{primaryColor.toUpperCase()}</span>
            </div>
        </div>
        <div className="space-y-1">
            <label htmlFor="backgroundColor" className="text-sm font-medium">Background</label>
            <div className="flex items-center gap-2">
                <input id="backgroundColor" type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-8 h-8 p-0 bg-transparent border-none cursor-pointer" />
                <span className="text-sm text-muted-foreground">{backgroundColor.toUpperCase()}</span>
            </div>
        </div>
        <div className="space-y-1">
            <label htmlFor="accentColor" className="text-sm font-medium">Accent</label>
            <div className="flex items-center gap-2">
                <input id="accentColor" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-8 h-8 p-0 bg-transparent border-none cursor-pointer" />
                <span className="text-sm text-muted-foreground">{accentColor.toUpperCase()}</span>
            </div>
        </div>
      </div>
    </div>
  );
};
