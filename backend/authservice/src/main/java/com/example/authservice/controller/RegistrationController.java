package com.example.authservice.controller;

import com.example.authservice.dto.CreateRegistrationRequest;
import com.example.authservice.dto.UpdateRegistrationRequest;
import com.example.authservice.model.Registration;
import com.example.authservice.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
public class RegistrationController {
  private final RegistrationService service;

  @PreAuthorize("hasAuthority('CREATE')")
  @PostMapping
  public Registration create(@Valid @RequestBody CreateRegistrationRequest req) {
    return service.create(req);
  }

  @PreAuthorize("hasAuthority('READ')")
  @GetMapping
  public List<Registration> list() {
    return service.list();
  }

  @PreAuthorize("hasAuthority('READ')")
  @GetMapping("/{epfNo}")
  public Registration get(@PathVariable String epfNo) {
    return service.getByEpf(epfNo);
  }

  @PreAuthorize("hasAuthority('UPDATE')")
  @PutMapping("/{epfNo}")
  public Registration update(@PathVariable String epfNo, @Valid @RequestBody UpdateRegistrationRequest req) {
    return service.update(epfNo, req);
  }

  @PreAuthorize("hasAuthority('DELETE')")
  @DeleteMapping("/{epfNo}")
  public void softDelete(@PathVariable String epfNo) {
    service.softDelete(epfNo);
  }

  @PreAuthorize("hasAuthority('PRINT')")
  @GetMapping("/export")
  public List<Registration> export() {
    return service.list();
  }
}
