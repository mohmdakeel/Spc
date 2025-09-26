package com.example.Authservice1.controller;

import com.example.Authservice1.dto.AuthRequest;
import com.example.Authservice1.dto.AuthResponse;
import com.example.Authservice1.dto.RegisterRequest;
import com.example.Authservice1.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final UserService users;
    public AuthController(UserService users) { this.users = users; }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest req) {
        return ResponseEntity.ok(users.login(req));
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest req) {
        String res = users.register(req, java.util.Optional.of("USER"));
        return ResponseEntity.ok(res);
    }
}
