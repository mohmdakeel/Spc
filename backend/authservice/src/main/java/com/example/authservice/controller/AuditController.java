// src/main/java/com/example/authservice/controller/AuditController.java
package com.example.authservice.controller;

import com.example.authservice.model.AuditLog;
import com.example.authservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/audit") @RequiredArgsConstructor
public class AuditController {
  private final UserService userService;

  @GetMapping("/me")
  public List<AuditLog> myHistory(){ return userService.myHistory(); }
}