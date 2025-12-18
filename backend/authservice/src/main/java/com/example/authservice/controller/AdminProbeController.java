// src/main/java/com/example/authservice/controller/AdminProbeController.java
package com.example.authservice.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminProbeController {
  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/probe")
  public Map<String, Object> probe(){ return Map.of("ok", true, "role", "ADMIN"); }
}
