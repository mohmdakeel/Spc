package com.example.Authservice1.controller;

import com.example.Authservice1.dto.CreateUserRequest;
import com.example.Authservice1.dto.UpdateUserRequest;
import com.example.Authservice1.model.User;
import com.example.Authservice1.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/users")
public class UserController {
    private final UserService users;
    public UserController(UserService users) { this.users = users; }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_USER_READ') or hasRole('ADMIN')")
    public Page<User> all(@RequestParam(defaultValue="0") int page,
                          @RequestParam(defaultValue="20") int size,
                          @RequestParam(defaultValue="username,asc") String sort,
                          @RequestParam(required = false) String q) {
        String[] s = sort.split(",");
        Sort by = Sort.by(Sort.Direction.fromString(s.length>1?s[1]:"asc"), s[0]);
        Pageable pageable = PageRequest.of(page, size, by);
        return users.page(pageable, q);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_USER_WRITE') or hasRole('ADMIN')")
    public ResponseEntity<User> create(@Valid @RequestBody CreateUserRequest req) {
        return ResponseEntity.ok(users.createEmployee(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_USER_WRITE') or hasRole('ADMIN')")
    public User update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest req) {
        return users.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_USER_DELETE') or hasRole('ADMIN')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        return ResponseEntity.ok(users.softDelete(id));
    }
}
