package com.example.Transport.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    StoredObject saveVehicleImage(Long vehicleId, MultipartFile file);
    void delete(String key);
}
