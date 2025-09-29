package com.example.Transport.config;

import com.example.Transport.storage.CloudinaryStorageService;
import com.example.Transport.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.*;

@Configuration
@EnableConfigurationProperties(StorageProperties.class)
@RequiredArgsConstructor
public class StorageConfig {
    private final StorageProperties props;

    @Bean
    public StorageService storageService() {
        return new CloudinaryStorageService(props);
    }
}
