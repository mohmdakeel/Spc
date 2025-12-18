package com.example.Transport.service;

import com.example.Transport.entity.Vehicle;
import com.example.Transport.entity.VehicleImage;
import com.example.Transport.repository.VehicleImageRepository;
import com.example.Transport.repository.VehicleRepository;
import com.example.Transport.storage.StorageService;
import com.example.Transport.storage.StoredObject;
import com.example.Transport.util.HistoryRecorder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
@RequiredArgsConstructor
public class VehicleImageService {
    private static final Set<String> ALLOWED = Set.of("image/jpeg","image/png","image/webp","image/jpg");
    private static final int MAX_IMAGES = 5; // ✅ limit 5

    private final VehicleRepository vehicleRepo;
    private final VehicleImageRepository imageRepo;
    private final StorageService storage;
    private final HistoryRecorder history;

    @Transactional(readOnly = true)
    public List<VehicleImage> list(Long vehicleId) {
        Vehicle v = vehicle(vehicleId);
        return imageRepo.findByVehicleOrderBySortOrderAscIdAsc(v);
    }

    @Transactional
    public List<VehicleImage> upload(Long vehicleId, MultipartFile[] files, String actor) {
        Vehicle v = vehicle(vehicleId);

        long current = imageRepo.countByVehicle(v);
        if (files == null || files.length == 0) throw new IllegalArgumentException("No files uploaded");
        if (current + files.length > MAX_IMAGES)
            throw new IllegalArgumentException("Max " + MAX_IMAGES + " images per vehicle. Currently has " + current + ".");

        int baseOrder = (int) current;
        List<VehicleImage> saved = new ArrayList<>();

        for (int i = 0; i < files.length; i++) {
            MultipartFile f = files[i];
            validate(f);
            StoredObject so = storage.saveVehicleImage(vehicleId, f);
            VehicleImage vi = VehicleImage.builder()
                    .vehicle(v)
                    .storageKey(so.key())
                    .url(so.url())
                    .sortOrder(baseOrder + i)
                    .build();
            saved.add(imageRepo.save(vi));
        }

        history.record("Vehicle", String.valueOf(vehicleId), "ImagesUploaded", null,
                Map.of("added", saved.stream().map(VehicleImage::getUrl).toList()),
                actor);

        return imageRepo.findByVehicleOrderBySortOrderAscIdAsc(v);
    }

    @Transactional
    public void delete(Long vehicleId, Long imageId, String actor) {
        Vehicle v = vehicle(vehicleId);
        VehicleImage vi = imageRepo.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Image not found: " + imageId));
        if (!vi.getVehicle().getId().equals(v.getId()))
            throw new IllegalArgumentException("Image doesn't belong to vehicle");

        storage.delete(vi.getStorageKey());
        imageRepo.delete(vi);

        List<VehicleImage> all = imageRepo.findByVehicleOrderBySortOrderAscIdAsc(v);
        for (int i = 0; i < all.size(); i++) all.get(i).setSortOrder(i);

        history.record("Vehicle", String.valueOf(vehicleId), "ImageDeleted",
                Map.of("url", vi.getUrl()), null, actor);
    }

    private Vehicle vehicle(Long id) {
        return vehicleRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Vehicle not found: id=" + id));
    }

    private void validate(MultipartFile f) {
        if (f.isEmpty()) throw new IllegalArgumentException("Empty file not allowed");
        String ct = Optional.ofNullable(f.getContentType()).orElse("").toLowerCase();
        if (!ALLOWED.contains(ct)) throw new IllegalArgumentException("Only JPEG/PNG/WEBP allowed");
        if (f.getSize() > 8 * 1024 * 1024) throw new IllegalArgumentException("File too large (max 8MB)");
    }
}
