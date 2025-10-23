// src/main/java/com/example/authservice/controller/AuthController.java
package com.example.authservice.controller;

import com.example.authservice.config.AppProps;
import com.example.authservice.dto.ChangePasswordRequest;
import com.example.authservice.dto.LoginRequest;
import com.example.authservice.model.User;
import com.example.authservice.repository.RegistrationRepository;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.service.AuditService;
import com.example.authservice.service.JwtService;
import com.example.authservice.service.UserService; // ⬅ add
import com.example.authservice.util.CookieUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
  private final AuthenticationManager authManager;
  private final JwtService jwt;
  private final AppProps props;
  private final UserRepository users;
  private final AuditService audit;
  private final RegistrationRepository regRepo;
  private final CookieUtils cookieUtils;
  private final PasswordEncoder encoder;
  private final UserService userService; // ⬅ add

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpServletResponse res) {
    var auth = authManager.authenticate(new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
    SecurityContextHolder.getContext().setAuthentication(auth);
    var token = jwt.create(req.getUsername());
    res.addHeader(HttpHeaders.SET_COOKIE, cookieUtils.buildJwtCookie(token).toString());
    audit.log(req.getUsername(), "LOGIN", "Auth", "-", "{}");
    return ResponseEntity.ok(Map.of("ok", true));
  }

  @PostMapping("/logout")
  public ResponseEntity<?> logout(HttpServletResponse res, Authentication a) {
    res.addHeader(HttpHeaders.SET_COOKIE, cookieUtils.clearJwtCookie().toString());
    if (a != null) audit.log(a.getName(), "LOGOUT", "Auth", "-", "{}");
    return ResponseEntity.ok(Map.of("ok", true));
  }

  @GetMapping("/me")
  public ResponseEntity<?> me(Authentication a) {
    if (a == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));
    var u = users.findByUsername(a.getName()).orElseThrow();

    String imageUrl = null;
    if (u.getEpfNo() != null) {
      var reg = regRepo.findByEpfNo(u.getEpfNo()).orElse(null);
      if (reg != null) imageUrl = reg.getImageUrl();
    }

    var roles       = users.findAuthorities(u.getId());                     // role codes
    var permissions = userService.effectivePermissionCodes(u.getId());      // ⬅ effective perms

    return ResponseEntity.ok(Map.of(
      "id", u.getId(),
      "epfNo", Objects.requireNonNullElse(u.getEpfNo(), ""),
      "username", Objects.requireNonNullElse(u.getUsername(), ""),
      "email", Objects.requireNonNullElse(u.getEmail(), ""),
      "fullName", Objects.requireNonNullElse(u.getFullName(), ""),
      "department", Objects.requireNonNullElse(u.getDepartment(), ""),
      "imageUrl", Objects.requireNonNullElse(imageUrl, ""),
      "roles", roles == null ? List.of() : roles,
      "permissions", permissions == null ? List.of() : permissions
    ));
  }

  @PostMapping("/change-password")
  public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest req, Authentication a) {
    if (a == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));
    var u = users.findByUsername(a.getName()).orElseThrow();
    if (!encoder.matches(req.getOldPassword(), u.getPassword())) {
      return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "Invalid old password"));
    }
    u.setPassword(encoder.encode(req.getNewPassword()));
    users.save(u);
    audit.log(a.getName(), "CHANGE_PASSWORD", "User", u.getId().toString(), "{}");
    return ResponseEntity.ok(Map.of("ok", true));
  }
}
