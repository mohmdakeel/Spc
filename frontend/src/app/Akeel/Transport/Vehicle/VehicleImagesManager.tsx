'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useCallback, useEffect, useState } from 'react';
import { Upload, Trash2, Images } from 'lucide-react';
import { toast } from 'react-toastify';
import type { EntityId, VehicleImage } from '../services/types';
import {
  listVehicleImages,
  uploadVehicleImages,
  deleteVehicleImage,
} from '../services/VehicleService';

const MAX_IMAGES = 3; // keep in sync with backend VehicleImageService

export default function VehicleImagesManager({ vehicleId }: { vehicleId: EntityId }) {
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listVehicleImages(vehicleId);
      setImages(list.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => { load(); }, [load]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    if (e.target.files.length > remaining) {
      toast.warn(`You can add only ${remaining} more image(s). Max ${MAX_IMAGES}.`);
      e.target.value = '';
      return;
    }
    setBusy(true);
    try {
      const res = await uploadVehicleImages(vehicleId, e.target.files);
      setImages(res.sort((a, b) => a.sortOrder - b.sortOrder));
      toast.success('Images uploaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function onDelete(id: EntityId) {
    if (!confirm('Delete this image?')) return;
    setBusy(true);
    try {
      await deleteVehicleImage(vehicleId, id);
      await load();
      toast.success('Deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-orange-800 font-semibold">
          <Images size={18} /> Images ({images.length}/{MAX_IMAGES})
        </div>
        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 cursor-pointer text-sm">
          <Upload size={16} />
          {busy ? 'Working…' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onUpload}
            className="hidden"
            disabled={busy || images.length >= MAX_IMAGES}
          />
        </label>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 py-3">Loading images…</div>
      ) : images.length === 0 ? (
        <div className="text-sm text-gray-500 py-3">No images yet</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={String(img.id)} className="border border-orange-200 rounded-lg bg-white overflow-hidden">
              <div className="bg-orange-50 w-full aspect-[4/3] grid place-items-center">
                {/* contain to avoid cropping inside manager */}
                <img src={img.url} alt="" className="max-w-full max-h-full object-contain" loading="lazy" />
              </div>
              <div className="flex justify-end px-2 py-1.5">
                <button
                  onClick={() => onDelete(img.id)}
                  className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 text-xs"
                  disabled={busy}
                  title="Delete"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-gray-500 mt-2">JPEG/PNG/WEBP • up to 8MB each.</p>
    </div>
  );
}
