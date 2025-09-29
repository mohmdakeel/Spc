// 'use client';

// import React, { useEffect, useState } from 'react';
// import { X, ChevronLeft, ChevronRight } from 'lucide-react';
// import { toast } from 'react-toastify';
// import type { EntityId, VehicleImage } from '../services/types';
// import { listVehicleImages } from '../services/VehicleService';

// export default function VehicleImagesViewer({ vehicleId }: { vehicleId: EntityId }) {
//   const [images, setImages] = useState<VehicleImage[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [lightIdx, setLightIdx] = useState<number | null>(null);

//   async function load() {
//     setLoading(true);
//     try {
//       const list = await listVehicleImages(vehicleId);
//       setImages([...list].sort((a, b) => a.sortOrder - b.sortOrder));
//     } catch (e) {
//       toast.error(e instanceof Error ? e.message : 'Failed to load images');
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => { load(); }, [vehicleId]);

//   const openLightbox = (idx: number) => setLightIdx(idx);
//   const closeLightbox = () => setLightIdx(null);
//   const prev = (e: React.MouseEvent) => { e.stopPropagation(); if (lightIdx == null) return; setLightIdx((lightIdx + images.length - 1) % images.length); };
//   const next = (e: React.MouseEvent) => { e.stopPropagation(); if (lightIdx == null) return; setLightIdx((lightIdx + 1) % images.length); };

//   if (loading) return <div className="text-sm text-gray-500 py-2">Loading images…</div>;
//   if (images.length === 0) return <div className="text-sm text-gray-500 py-2">No images</div>;

//   return (
//     <>
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//         {images.map((img, idx) => (
//           <button
//             key={String(img.id)}
//             type="button"
//             onClick={() => openLightbox(idx)}
//             className="group relative rounded-lg overflow-hidden border border-orange-200 bg-white"
//             title="View"
//           >
//             <div className="aspect-[4/3] bg-orange-50">
//               <img
//                 src={img.url}
//                 alt=""
//                 loading="lazy"
//                 className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
//               />
//             </div>
//           </button>
//         ))}
//       </div>

//       {lightIdx != null && images[lightIdx] && (
//         <div
//           role="dialog"
//           aria-modal="true"
//           className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-4"
//           onClick={closeLightbox}
//         >
//           <button
//             type="button"
//             onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
//             className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
//             aria-label="Close"
//             title="Close"
//           >
//             <X size={22} />
//           </button>

//           <button
//             type="button"
//             onClick={prev}
//             className="absolute left-2 md:left-6 p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
//             aria-label="Prev"
//             title="Previous"
//           >
//             <ChevronLeft size={26} />
//           </button>

//           <div className="max-w-[92vw] max-h-[85vh]">
//             <img
//               src={images[lightIdx].url}
//               alt=""
//               className="max-w-[92vw] max-h-[85vh] object-contain"
//             />
//             <div className="mt-2 text-center text-white text-xs">
//               {lightIdx + 1} / {images.length}
//             </div>
//           </div>

//           <button
//             type="button"
//             onClick={next}
//             className="absolute right-2 md:right-6 p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
//             aria-label="Next"
//             title="Next"
//           >
//             <ChevronRight size={26} />
//           </button>
//         </div>
//       )}
//     </>
//   );
// }
