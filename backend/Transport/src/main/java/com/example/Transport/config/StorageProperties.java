package com.example.Transport.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "storage")
public class StorageProperties {
    private String type = "cloudinary"; // fixed
    private CloudinaryProps cloudinary = new CloudinaryProps();

    @Data
    public static class CloudinaryProps {
        private String cloudName;
        private String apiKey;
        private String apiSecret;
        /** e.g., "vehicles/" — we'll store as vehicles/{vehicleId}/... */
        private String folderPrefix = "vehicles/";
        /**
         * Optional custom delivery base. Usually leave blank and use the secure_url returned by Cloudinary.
         * You could set something like: https://res.cloudinary.com/<cloud>/image/upload
         */
        private String deliveryBaseUrl;
    }
}
