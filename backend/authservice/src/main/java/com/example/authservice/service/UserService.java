package com.example.authservice.service;

import com.example.authservice.dto.AuthRequest;
import com.example.authservice.dto.AuthResponse;
import com.example.authservice.dto.RegisterRequest;
import com.example.authservice.model.Registration;
import com.example.authservice.model.User;
import com.example.authservice.repository.RegistrationRepository;
import com.example.authservice.repository.UserRepository;
// ✅ FIXED: correct package is singular "util"
import com.example.authservice.utils.JwtUtil;

import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

    public String register(RegisterRequest req) {
        if (userRepository.findByUsername(req.getUsername()).isPresent()) return "Username already taken";
        if (userRepository.findByEmail(req.getEmail()).isPresent()) return "Email already registered";

        // ✅ relies on repository having findByEpfNo
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

        userRepository.save(user);
        return "User registered successfully";
    }

    public AuthResponse login(AuthRequest req) {
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        // ✅ JwtUtil has generateToken(String username)
        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponse(token);
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public String deleteById(Long id) {
        if (!userRepository.existsById(id)) return "User not found";
        userRepository.deleteById(id);
        return "User deleted successfully";
    }
}
