'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'react-toastify';
import type { EntityId, VehicleImage } from '../services/types';
import { listVehicleImages } from '../services/VehicleService';

/**
 * Shows images WITHOUT cropping:
 * - Hero image uses object-contain and max-h relative to viewport.
 * - Thumbnails below.
 * - Click to open fullscreen lightbox with prev/next + arrow keys.
 */
export default function VehicleImagesHero({ vehicleId }: { vehicleId: EntityId }) {
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const list = await listVehicleImages(vehicleId);
        if (!mounted) return;
        setImages([...list].sort((a, b) => a.sortOrder - b.sortOrder));
        setIdx(0);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load images');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [vehicleId]);

  const prev = useCallback(
    () => setIdx((i) => (images.length ? (i - 1 + images.length) % images.length : 0)),
    [images.length]
  );
  const next = useCallback(
    () => setIdx((i) => (images.length ? (i + 1) % images.length : 0)),
    [images.length]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, images.length, next, prev]);

  if (loading) return <div className="text-sm text-gray-500">Loading images…</div>;
  if (images.length === 0) return <div className="text-sm text-gray-500">No images</div>;

  return (
    <>
      {/* HERO (no cropping) */}
      <div className="relative rounded-xl border border-orange-200 bg-neutral-100 p-2 md:p-3">
        <div
          className="relative w-full flex items-center justify-center cursor-zoom-in"
          onClick={() => setOpen(true)}
          title="Click to view full screen"
        >
          {/* The key part: object-contain + max-h only */}
          <img
            src={images[idx].url}
            alt={`Vehicle image ${idx + 1}`}
            className="block max-w-full h-auto w-auto max-h-[58vh] md:max-h-[62vh] object-contain"
            loading="eager"
          />
        </div>

        {/* Prev / Next controls (outside the img area; no overlay on bottom) */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 bg-white/90 hover:bg-white shadow"
          aria-label="Previous"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 bg-white/90 hover:bg-white shadow"
          aria-label="Next"
        >
          <ChevronRight size={18} />
        </button>

        <div className="absolute right-3 bottom-3 text-[11px] px-2 py-0.5 rounded bg-black/60 text-white">
          {idx + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
        {images.map((img, i) => (
          <button
            type="button"
            key={String(img.id)}
            onClick={() => setIdx(i)}
            className={`shrink-0 border rounded-lg overflow-hidden ${
              i === idx ? 'border-orange-500 ring-2 ring-orange-200' : 'border-orange-200'
            }`}
            title={`Image ${i + 1}`}
          >
            <img src={img.url} alt="" className="w-16 h-12 object-cover" loading="lazy" />
          </button>
        ))}
      </div>

      {/* Fullscreen Lightbox (always full picture, no crop) */}
      {open && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center p-4">
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white"
            onClick={() => setOpen(false)}
            aria-label="Close"
            title="Close"
          >
            <X size={20} />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white"
            onClick={prev}
            aria-label="Previous"
            title="Previous"
          >
            <ChevronLeft />
          </button>

          <div className="max-w-[96vw] max-h-[88vh] grid place-items-center">
            <img
              src={images[idx].url}
              alt={`Vehicle image ${idx + 1}`}
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          </div>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white"
            onClick={next}
            aria-label="Next"
            title="Next"
          >
            <ChevronRight />
          </button>

          <div className="mt-3 text-xs text-white/80">
            {idx + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
