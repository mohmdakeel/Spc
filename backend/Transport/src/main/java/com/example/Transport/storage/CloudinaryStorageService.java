package com.example.Transport.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.Transport.config.StorageProperties;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public class CloudinaryStorageService implements StorageService {

    private final StorageProperties.CloudinaryProps props;
    private final Cloudinary cloudinary;

    public CloudinaryStorageService(StorageProperties storageProps) {
        this.props = storageProps.getCloudinary();
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", props.getCloudName(),
                "api_key",    props.getApiKey(),
                "api_secret", props.getApiSecret()
        ));
    }

    @Override
    public StoredObject saveVehicleImage(Long vehicleId, MultipartFile file) {
        try {
            String folder = (props.getFolderPrefix() == null ? "" : props.getFolderPrefix())
                    + vehicleId + "/";

            Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "image",
                            // Optional: eager transformations to guarantee optimized derivatives
                            // "eager", Arrays.asList(
                            //     new Transformation().quality("auto").fetchFormat("auto").width(1200).crop("limit")
                            // )
                            "use_filename", true,
                            "unique_filename", true,
                            "overwrite", false
                    )
            );

            String publicId = (String) uploadResult.get("public_id");      // e.g., vehicles/1234567890/abcxyz
            String secureUrl = (String) uploadResult.get("secure_url");    // https URL with CDN

            // If you want to force transformed delivery, you can build URLs like:
            // String transformed = cloudinary.url().secure(true)
            //         .transformation(new Transformation().quality("auto").fetchFormat("auto").width(1200).crop("limit"))
            //         .generate(publicId);

            return new StoredObject("cloudinary:" + publicId, secureUrl);
        } catch (Exception e) {
            throw new RuntimeException("Cloudinary upload failed: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String key) {
        if (key == null || !key.startsWith("cloudinary:")) return;
        String publicId = key.substring("cloudinary:".length());
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception ignored) {}
    }
}
