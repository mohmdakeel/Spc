package com.example.authservice.controller;

import com.example.authservice.model.Registration;
import com.example.authservice.service.RegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/auth/registrations")
@CrossOrigin(origins = "*")
public class RegistrationController {

    @Autowired
    private RegistrationService registrationService;

    @GetMapping
    public List<Registration> getAllRegistrations() {
        return registrationService.getAllRegistrations();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Registration> getRegistrationById(@PathVariable Long id) {
        Registration registration = registrationService.getRegistrationById(id);
        return ResponseEntity.ok(registration);
    }

    @PostMapping
    public ResponseEntity<Registration> createRegistration(
            @RequestBody Registration registration,
            @RequestHeader(value = "X-User-Name", required = false) String addedBy) throws IOException {

        // Optionally set addedBy manually if not handled by auditor (usually not needed)
        return ResponseEntity.ok(registrationService.createRegistration(registration, null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Registration> updateRegistration(
            @PathVariable Long id,
            @ModelAttribute Registration registrationDetails,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) {

        try {
            Registration updated = registrationService.updateRegistration(id, registrationDetails, imageFile);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRegistration(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Name", required = false) String deletedBy) {

        // Fallback to Spring Security context
        if (deletedBy == null || deletedBy.isBlank()) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                deletedBy = auth.getName();
            } else {
                deletedBy = "system";
            }
        }

        registrationService.deleteRegistration(id, deletedBy);
        return ResponseEntity.noContent().build();
    }
}