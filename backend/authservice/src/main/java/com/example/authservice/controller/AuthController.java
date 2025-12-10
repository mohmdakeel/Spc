package com.example.authservice.controller;

import com.example.authservice.dto.*;
import com.example.authservice.model.User;
import com.example.authservice.repository.RegistrationRepository;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.service.AuditService;
import com.example.authservice.service.JwtService;
import com.example.authservice.service.UserService;
import com.example.authservice.util.CookieUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.*;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthenticationManager authManager;
  private final JwtService jwt;
  private final UserRepository users;
  private final AuditService audit;
  private final RegistrationRepository regRepo;
  private final CookieUtils cookieUtils;
  private final PasswordEncoder encoder;
  private final UserService userService;

  // -----------------------------------------------------------------
  // PUBLIC: Health-check
  // -----------------------------------------------------------------
  @GetMapping("/ping")
  public ApiResponse<String> ping() {
    return ApiResponse.ok("authservice is alive");
  }

  // -----------------------------------------------------------------
  // LOGIN → JWT in HttpOnly cookie
  // -----------------------------------------------------------------
  @PostMapping("/login")
  public ResponseEntity<ApiResponse<Void>> login(@RequestBody LoginRequest req, HttpServletResponse res) {
    String identifier = Optional.ofNullable(req.getUsername()).orElse("").trim();
    String loginId = identifier;
    if (identifier.contains("@")) {
      loginId = users.findByEmailIgnoreCase(identifier)
          .map(User::getUsername)
          .orElse(identifier);
    }

    Authentication auth = authManager.authenticate(
        new UsernamePasswordAuthenticationToken(loginId, req.getPassword())
    );
    SecurityContextHolder.getContext().setAuthentication(auth);

    String token = jwt.create(loginId);
    res.addHeader(HttpHeaders.SET_COOKIE, cookieUtils.buildJwtCookie(token).toString());

    audit.log(loginId, "LOGIN", "Auth", "-", "{}");
    return ResponseEntity.ok(ApiResponse.ok(null));
  }

  // -----------------------------------------------------------------
  // LOGOUT → clear cookie
  // -----------------------------------------------------------------
  @PostMapping("/logout")
  public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse res, Authentication a) {
    res.addHeader(HttpHeaders.SET_COOKIE, cookieUtils.clearJwtCookie().toString());
    if (a != null) {
      audit.log(a.getName(), "LOGOUT", "Auth", "-", "{}");
    }
    return ResponseEntity.ok(ApiResponse.ok(null));
  }

  // -----------------------------------------------------------------
  // ME → current user profile
  // -----------------------------------------------------------------
  @GetMapping("/me")
  public ResponseEntity<ApiResponse<Map<String, Object>>> me(Authentication a) {
    if (a == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(ApiResponse.fail("Not authenticated"));
    }

    var u = users.findByUsername(a.getName()).orElseThrow();

    String imageUrl = "";
    if (u.getEpfNo() != null) {
      var reg = regRepo.findByEpfNo(u.getEpfNo()).orElse(null);
      if (reg != null && reg.getImageUrl() != null) imageUrl = reg.getImageUrl();
    }

    var roles = users.findAuthorities(u.getId());
    var perms = userService.effectivePermissionCodes(u.getId());

    Map<String, Object> data = Map.of(
        "id", u.getId(),
        "epfNo", Optional.ofNullable(u.getEpfNo()).orElse(""),
        "username", Optional.ofNullable(u.getUsername()).orElse(""),
        "email", Optional.ofNullable(u.getEmail()).orElse(""),
        "fullName", Optional.ofNullable(u.getFullName()).orElse(""),
        "department", Optional.ofNullable(u.getDepartment()).orElse(""),
        "imageUrl", imageUrl,
        "roles", roles != null ? roles : List.of(),
        "permissions", perms != null ? perms : List.of()
    );

    return ResponseEntity.ok(ApiResponse.ok(data));
  }

  // -----------------------------------------------------------------
  // CHANGE PASSWORD (user knows old one)
  // -----------------------------------------------------------------
  @PostMapping("/change-password")
  public ResponseEntity<ApiResponse<Void>> changePassword(
      @RequestBody ChangePasswordRequest req,
      Authentication a
  ) {
    if (a == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(ApiResponse.fail("Not authenticated"));
    }

    var u = users.findByUsername(a.getName()).orElseThrow();

    if (!encoder.matches(req.getOldPassword(), u.getPassword())) {
      return ResponseEntity.badRequest()
          .body(ApiResponse.fail("Old password is incorrect"));
    }

    u.setPassword(encoder.encode(req.getNewPassword()));
    users.save(u);

    audit.log(a.getName(), "CHANGE_PASSWORD", "User", u.getId().toString(), "{}");
    return ResponseEntity.ok(ApiResponse.ok(null));
  }

  // -----------------------------------------------------------------
  // UPDATE MY PROFILE IMAGE
  // -----------------------------------------------------------------
  @PostMapping("/me/image")
  public ResponseEntity<ApiResponse<Void>> updateMyImage(
      @RequestBody Map<String, String> body,
      Authentication a
  ) {
    if (a == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(ApiResponse.fail("Not authenticated"));
    }

    String imageUrl = body.get("imageUrl");
    if (imageUrl == null || imageUrl.isBlank()) {
      return ResponseEntity.badRequest()
          .body(ApiResponse.fail("imageUrl is required"));
    }

    var u = users.findByUsername(a.getName()).orElseThrow();

    if (u.getEpfNo() != null && !u.getEpfNo().isBlank()) {
      regRepo.findByEpfNo(u.getEpfNo()).ifPresent(reg -> {
        reg.setImageUrl(imageUrl);
        regRepo.save(reg);
      });
    }

    audit.log(a.getName(), "UPDATE_IMAGE", "User", u.getId().toString(),
        "{\"imageUrl\":\"" + imageUrl + "\"}");
    return ResponseEntity.ok(ApiResponse.ok(null));
  }
}
