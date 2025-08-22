package com.example.authservice.service;

import com.example.authservice.dto.AuthRequest;
import com.example.authservice.dto.AuthResponse;
import com.example.authservice.dto.RegisterRequest;
import com.example.authservice.model.Registration;
import com.example.authservice.model.User;
import com.example.authservice.repository.RegistrationRepository;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.utils.JwtUtil;

import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository,
                       RegistrationRepository registrationRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.registrationRepository = registrationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /** Get logged-in username from Spring Security context */
    private String getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "system";
    }

    /** Register new user */
    public String register(RegisterRequest req) {
        if (userRepository.findByUsername(req.getUsername()).isPresent()) return "Username already taken";
        if (userRepository.findByEmail(req.getEmail()).isPresent()) return "Email already registered";

        Registration reg = registrationRepository.findByEpfNo(req.getEpfNo())
                .orElseThrow(() -> new RuntimeException("EPF No not found: " + req.getEpfNo()));

        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setEpfNo(req.getEpfNo());
        user.setFullName(reg.getFullName());
        user.setDepartment(req.getDepartment());
        user.setDesignation(req.getDesignation());
        user.setContactNo(req.getContactNo());
        user.setCompany(req.getCompany());
        user.setCopyFromPrivileges(req.getCopyFromPrivileges());
        user.setRemarks(req.getRemarks());
        user.setRole(req.getRole());
        user.setActive(true);

        // Audit fields for creation
        user.setAddedDateTime(LocalDateTime.now());
        user.setAddedBy(getCurrentUser());

        userRepository.save(user);
        return "User registered successfully";
    }

    /** Login user */
    public AuthResponse login(AuthRequest req) {
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponse(token);
    }

    /** Get all users */
    public List<User> getAll() {
        return userRepository.findAll();
    }

    /** Update user */
    public User updateUser(Long id, RegisterRequest req) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        existing.setEmail(req.getEmail());
        existing.setUsername(req.getUsername());
        existing.setDepartment(req.getDepartment());
        existing.setDesignation(req.getDesignation());
        existing.setContactNo(req.getContactNo());
        existing.setCompany(req.getCompany());
        existing.setCopyFromPrivileges(req.getCopyFromPrivileges());
        existing.setRemarks(req.getRemarks());
        existing.setRole(req.getRole());

        // Audit fields for modification
        existing.setModifiedDateTime(LocalDateTime.now());
        existing.setModifiedBy(getCurrentUser());

        return userRepository.save(existing);
    }

    /** Soft delete user */
    public String deleteUser(Long id) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        existing.setActive(false); // optional: mark as inactive
        existing.setDeletedDateTime(LocalDateTime.now());
        existing.setDeletedBy(getCurrentUser());

        userRepository.save(existing);
        return "User deleted successfully";
    }
}
