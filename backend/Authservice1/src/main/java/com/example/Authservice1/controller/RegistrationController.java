package com.example.Authservice1.controller;

import com.example.Authservice1.model.Registration;
import com.example.Authservice1.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {

    private final RegistrationService registrationService;
    public RegistrationController(RegistrationService registrationService) { this.registrationService = registrationService; }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_USER_READ') or hasRole('ADMIN')")
    public Page<Registration> getAll(
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="20") int size,
            @RequestParam(defaultValue="addedTime,desc") String sort,
            @RequestParam(required=false) String q
    ) {
        String[] s = sort.split(",");
        Sort by = Sort.by(Sort.Direction.fromString(s.length>1?s[1]:"desc"), s[0]);
        Pageable pageable = PageRequest.of(page, size, by);
        return registrationService.findAll(pageable, q);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_USER_READ') or hasRole('ADMIN')")
    public ResponseEntity<Registration> getRegistrationById(@PathVariable Long id) {
        return ResponseEntity.ok(registrationService.getRegistrationById(id));
    }

    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("hasAuthority('PERM_USER_WRITE') or hasRole('ADMIN')")
    public ResponseEntity<Registration> create(
            @RequestPart("registration") @Valid Registration registration,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile) throws IOException {
        return ResponseEntity.ok(registrationService.createRegistration(registration, imageFile));
    }

    @PutMapping(value="/{id}", consumes = {"multipart/form-data"})
    @PreAuthorize("hasAuthority('PERM_USER_WRITE') or hasRole('ADMIN')")
    public ResponseEntity<Registration> update(
            @PathVariable Long id,
            @RequestPart("registration") @Valid Registration registrationDetails,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile) throws IOException {
        return ResponseEntity.ok(registrationService.updateRegistration(id, registrationDetails, imageFile));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_USER_DELETE') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        String deletedBy = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()!=null
                ? org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName()
                : "system";
        registrationService.deleteRegistration(id, deletedBy);
        return ResponseEntity.noContent().build();
    }
}
