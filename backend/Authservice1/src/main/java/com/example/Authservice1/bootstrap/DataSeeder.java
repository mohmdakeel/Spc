package com.example.Authservice1.bootstrap;

import com.example.Authservice1.model.Permission;
import com.example.Authservice1.model.Role;
import com.example.Authservice1.model.User;
import com.example.Authservice1.repository.PermissionRepository;
import com.example.Authservice1.repository.RoleRepository;
import com.example.Authservice1.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final RoleRepository roles;
    private final PermissionRepository perms;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository users, RoleRepository roles,
                      PermissionRepository perms, PasswordEncoder encoder) {
        this.users = users; this.roles = roles; this.perms = perms; this.encoder = encoder;
    }

    @Override public void run(String... args) {
        Permission pUserRead  = perms.findByCode("USER_READ").orElseGet(() -> perms.save(new Permission(null,"USER_READ","Read users")));
        Permission pUserWrite = perms.findByCode("USER_WRITE").orElseGet(() -> perms.save(new Permission(null,"USER_WRITE","Create/update users")));
        Permission pUserDelete= perms.findByCode("USER_DELETE").orElseGet(() -> perms.save(new Permission(null,"USER_DELETE","Delete users")));
        Permission pRoleAdmin = perms.findByCode("ROLE_ADMIN").orElseGet(() -> perms.save(new Permission(null,"ROLE_ADMIN","Manage roles & permissions")));

        Role admin = roles.findByName("ADMIN").orElseGet(() -> {
            Role r = new Role();
            r.setName("ADMIN");
            r.setDescription("System administrator");
            r.setPermissions(Set.of(pUserRead, pUserWrite, pUserDelete, pRoleAdmin));
            return roles.save(r);
        });

        createRoleIfMissing("TRANSPORT_ADMIN", "Transport Admin");
        createRoleIfMissing("FINANCE_HOD", "Finance Head of Dept");
        createRoleIfMissing("FINANCE_STAFF", "Finance Staff");
        createRoleIfMissing("HRD_CHAIRMAN", "HRD Chairman");
        createRoleIfMissing("GENERAL_MANAGER", "GM");
        createRoleIfMissing("VEHICLE_INCHARGE", "Vehicle Incharge");
        createRoleIfMissing("GATE_SECURITY", "Gate Security");

        users.findByUsername("admin").orElseGet(() -> {
            User u = new User();
            u.setUsername("admin");
            u.setEmail("admin@local");
            u.setPassword(encoder.encode("admin123"));
            u.setActive(true);
            u.setRoles(Set.of(admin));
            return users.save(u);
        });
    }

    private void createRoleIfMissing(String name, String desc) {
        roles.findByName(name).orElseGet(() -> {
            Role r = new Role();
            r.setName(name);
            r.setDescription(desc);
            return roles.save(r);
        });
    }
}
