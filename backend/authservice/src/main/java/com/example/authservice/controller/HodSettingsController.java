package com.example.authservice.controller;

import com.example.authservice.dto.HodSettingsResponse;
import com.example.authservice.dto.UpdateHodSettingsRequest;
import com.example.authservice.dto.ApiResponse;
import com.example.authservice.service.HodSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hod/settings")
@RequiredArgsConstructor
public class HodSettingsController {

  private final HodSettingsService service;

  @GetMapping
  @PreAuthorize("hasAuthority('ROLE_HOD')")
  public ApiResponse<HodSettingsResponse> mySettings(Authentication auth) {
    return ApiResponse.ok(service.getForUser(auth.getName()));
  }

  @PutMapping
  @PreAuthorize("hasAuthority('ROLE_HOD')")
  public ApiResponse<HodSettingsResponse> update(
      @RequestBody UpdateHodSettingsRequest request,
      Authentication auth
  ) {
    return ApiResponse.ok(service.updateForUser(auth.getName(), request));
  }
}
