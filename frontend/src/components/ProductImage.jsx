import React, { useState, useEffect } from 'react';
import { Package, Laptop, Mouse, Headphones, Armchair, Printer, Coffee, FileText, Monitor, PenTool } from 'lucide-react';

export function resolveImageUrl(src) {
  if (!src || typeof src !== 'string') return '';
  if (src.startsWith('/uploads/')) {
    // Relative upload path - resolve to backend server URL
    return `http://localhost:5000${src}`;
  }
  return src;
}

export function getProductFallbackImage(name = '', category = '') {
  const n = (name || '').toLowerCase().trim();
  const c = (category || '').toLowerCase().trim();

  // 1. Specific Stationery Items
  if (n.includes('pencil')) {
    return 'https://images.unsplash.com/photo-1585336261026-8f5786372966?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('eraser') || n.includes('rubber')) {
    return 'https://images.unsplash.com/photo-1585336261026-8f5786372966?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('pen') || n.includes('ballpoint') || n.includes('marker') || n.includes('highlighter')) {
    return 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('notebook') || n.includes('journal') || n.includes('diary') || n.includes('pad')) {
    return 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('paper') || n.includes('a4') || n.includes('sheet') || n.includes('ream')) {
    return 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=80';
  }

  // 2. Peripherals & Electronics
  if (n.includes('keyboard') || (c.includes('peripheral') && n.includes('key'))) {
    return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('mouse') || (c.includes('peripheral') && n.includes('mou'))) {
    return 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('headset') || n.includes('headphone') || n.includes('earphone') || c.includes('audio')) {
    return 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('chair') || n.includes('desk') || c.includes('furniture')) {
    return 'https://images.unsplash.com/photo-1580481072645-022f9a6d8310?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('laptop') || n.includes('macbook') || c.includes('computer')) {
    return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('printer') || n.includes('ink') || n.includes('toner') || c.includes('print')) {
    return 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('coffee') || n.includes('bean') || c.includes('beverage')) {
    return 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('monitor') || n.includes('screen') || c.includes('display')) {
    return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80';
  }

  // 3. Generic Stationery Category
  if (c.includes('stationery')) {
    return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80';
  }

  return 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80';
}

export default function ProductImage({
  src,
  alt = 'Product',
  name = '',
  category = '',
  className = 'w-full h-48 object-cover',
  containerClassName = 'relative overflow-hidden bg-slate-100'
}) {
  const [hasError, setHasError] = useState(false);

  // If a valid src exists, use it directly (resolving relative /uploads/ URLs to server host)
  // ONLY if src is genuinely missing, use getProductFallbackImage(name, category)
  const resolvedSrc = src ? resolveImageUrl(src) : getProductFallbackImage(name, category);
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);

  useEffect(() => {
    const freshSrc = src ? resolveImageUrl(src) : getProductFallbackImage(name, category);
    setCurrentSrc(freshSrc);
    setHasError(false);
  }, [src, name, category]);

  const handleError = () => {
    const fallback = getProductFallbackImage(name, category);
    if (currentSrc !== fallback) {
      setCurrentSrc(fallback);
    } else {
      setHasError(true);
    }
  };

  const renderVectorFallback = () => {
    const n = (name || '').toLowerCase();
    const c = (category || '').toLowerCase();

    let IconComponent = Package;
    let bgColor = 'bg-blue-50 text-blue-600 border-blue-200';

    if (n.includes('pencil') || n.includes('pen') || c.includes('stationery')) {
      IconComponent = PenTool;
      bgColor = 'bg-indigo-50 text-indigo-600 border-indigo-200';
    } else if (n.includes('keyboard') || n.includes('mouse') || c.includes('peripheral')) {
      IconComponent = Laptop;
      bgColor = 'bg-blue-50 text-blue-600 border-blue-200';
    } else if (n.includes('headset') || c.includes('audio')) {
      IconComponent = Headphones;
      bgColor = 'bg-purple-50 text-purple-600 border-purple-200';
    } else if (n.includes('chair') || c.includes('furniture')) {
      IconComponent = Armchair;
      bgColor = 'bg-sky-50 text-sky-600 border-sky-200';
    } else if (n.includes('printer') || c.includes('print')) {
      IconComponent = Printer;
      bgColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
    } else if (n.includes('coffee')) {
      IconComponent = Coffee;
      bgColor = 'bg-amber-50 text-amber-600 border-amber-200';
    } else if (n.includes('notebook')) {
      IconComponent = FileText;
      bgColor = 'bg-purple-50 text-purple-600 border-purple-200';
    } else if (n.includes('monitor')) {
      IconComponent = Monitor;
      bgColor = 'bg-blue-50 text-blue-600 border-blue-200';
    }

    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-6 border ${bgColor} font-sans`}>
        <div className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-xs flex items-center justify-center shadow-xs mb-2">
          <IconComponent className="w-7 h-7" />
        </div>
        <span className="text-xs font-bold text-slate-800 text-center line-clamp-1">{name || 'Catalog Item'}</span>
        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{category || 'General'}</span>
      </div>
    );
  };

  return (
    <div className={containerClassName}>
      {hasError ? (
        renderVectorFallback()
      ) : (
        <img
          src={currentSrc}
          alt={alt || name}
          onError={handleError}
          className={className}
          loading="lazy"
        />
      )}
    </div>
  );
}
