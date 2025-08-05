package com.example.authservice.config;

import com.cloudinary.Cloudinary;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(Map.of(
                "cloud_name", "dunvgtmpv",
                "api_key", "188371631963363",
                "api_secret", "ylelSOpgfqEdmuot5Zg0_cssoAg"
        ));
    }
}