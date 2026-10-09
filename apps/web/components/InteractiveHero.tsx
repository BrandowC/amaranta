'use client';

import { useRef, useState } from 'react';

interface InteractiveHeroProps {
  /** Which photo to show. Only "shop" has an image today; "clinic" is reserved for when the
   *  Scheduling/Clinical domains are built and gets its own local asset then. */
  variant?: 'shop' | 'clinic';
  /** Which side of its layout slot the hero sits on — purely a caller-side layout hint. */
  side?: 'left' | 'right';
  className?: string;
}

const MAX_TILT_DEG = 8;
const MAX_SHIFT_PX = 16;

const VARIANT_IMAGE: Record<'shop' | 'clinic', string> = {
  shop: '/hero-pet.jpg',
  clinic: '/hero-pet.jpg', // placeholder until the clinic page has its own photo
};

/**
 * A real photo (stored locally in public/, never hot-linked) that tilts and parallaxes toward
 * the cursor for a "3D" feel: a background color layer and a foreground accent shape move at
 * different rates than the photo itself, via CSS 3D transforms — no image library, no
 * external network dependency at runtime.
 */
export function InteractiveHero({ variant = 'shop', side = 'right', className = '' }: InteractiveHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, shiftX: 0, shiftY: 0 });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = (event.clientX - rect.left) / rect.width - 0.5; // -0.5 .. 0.5
    const offsetY = (event.clientY - rect.top) / rect.height - 0.5;

    setTilt({
      rotateY: offsetX * MAX_TILT_DEG,
      rotateX: -offsetY * MAX_TILT_DEG,
      shiftX: offsetX * MAX_SHIFT_PX,
      shiftY: offsetY * MAX_SHIFT_PX,
    });
  }

  function handleMouseLeave() {
    setTilt({ rotateX: 0, rotateY: 0, shiftX: 0, shiftY: 0 });
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-side={side}
      className={`relative aspect-square w-full select-none [perspective:1200px] ${className}`}
    >
      <div
        className="h-full w-full transition-transform duration-300 ease-out"
        style={{ transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)` }}
      >
        {/* Background layer — moves the least, feels farthest away */}
        <Layer depthPx={tilt.shiftX * 0.3} depthPy={tilt.shiftY * 0.3}>
          <BackgroundBlob />
        </Layer>

        {/* Midground layer — the real photo */}
        <Layer depthPx={tilt.shiftX * 0.7} depthPy={tilt.shiftY * 0.7}>
          <div className="absolute inset-[8%] overflow-hidden rounded-[40%] shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={VARIANT_IMAGE[variant]}
              alt={variant === 'shop' ? 'Mascota feliz' : 'Mascota en consulta'}
              className="h-full w-full object-cover"
            />
          </div>
        </Layer>

        {/* Foreground layer — moves the most, feels closest to the viewer */}
        <Layer depthPx={tilt.shiftX * 1.3} depthPy={tilt.shiftY * 1.3}>
          <ForegroundAccents variant={variant} />
        </Layer>
      </div>
    </div>
  );
}

function Layer({ depthPx, depthPy, children }: { depthPx: number; depthPy: number; children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-0 transition-transform duration-300 ease-out"
      style={{ transform: `translate3d(${depthPx}px, ${depthPy}px, 0)` }}
    >
      {children}
    </div>
  );
}

function BackgroundBlob() {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <circle cx="200" cy="200" r="180" fill="#f5e2c4" />
      <circle cx="150" cy="140" r="70" fill="#fbe0d8" opacity="0.7" />
      <circle cx="270" cy="270" r="60" fill="#dcebf5" opacity="0.6" />
    </svg>
  );
}

function ForegroundAccents({ variant }: { variant: 'shop' | 'clinic' }) {
  if (variant === 'clinic') {
    return (
      <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
        <g stroke="#5c93b8" strokeWidth="10" strokeLinecap="round">
          <line x1="90" y1="90" x2="90" y2="130" />
          <line x1="70" y1="110" x2="110" y2="110" />
        </g>
        <circle cx="330" cy="80" r="22" fill="none" stroke="#c41e2e" strokeWidth="8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      {/* Little paw print, foreground-left */}
      <g fill="#5c93b8">
        <circle cx="70" cy="320" r="16" />
        <circle cx="50" cy="300" r="8" />
        <circle cx="70" cy="292" r="8" />
        <circle cx="92" cy="300" r="8" />
      </g>
    </svg>
  );
}
