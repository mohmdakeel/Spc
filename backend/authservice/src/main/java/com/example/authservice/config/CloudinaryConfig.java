package com.example.authservice.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

  @Bean
  @ConfigurationProperties(prefix = "cloudinary")
  public CloudinaryProps cloudinaryProps() {
    return new CloudinaryProps();
  }

  @Bean
  public Cloudinary cloudinary(CloudinaryProps props) {
    return new Cloudinary(ObjectUtils.asMap(
        "cloud_name", props.getCloudName(),
        "api_key",    props.getApiKey(),
        "api_secret", props.getApiSecret()
    ));
  }

  @Getter
  public static class CloudinaryProps {
    private String cloudName;
    private String apiKey;
    private String apiSecret;
    public void setCloudName(String v){ this.cloudName = v; }
    public void setApiKey(String v){ this.apiKey = v; }
    public void setApiSecret(String v){ this.apiSecret = v; }
  }
}
