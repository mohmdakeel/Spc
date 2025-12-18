package com.example.authservice.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UploadController {

  private final Cloudinary cloudinary;

  // any logged-in user can upload a picture
  @PreAuthorize("isAuthenticated()")
  @PostMapping(
    value = "/upload",
    consumes = MediaType.MULTIPART_FORM_DATA_VALUE
  )
  public Map<String, Object> upload(@RequestParam("file") MultipartFile file) throws IOException {

    var result = cloudinary.uploader().upload(
        file.getBytes(),
        ObjectUtils.asMap(
          "folder", "spc-auth-system",
          "resource_type", "image"
        )
    );

    String url = (String) result.get("secure_url");

    return Map.of(
      "url", url,
      "publicId", result.get("public_id")
    );
  }
}
