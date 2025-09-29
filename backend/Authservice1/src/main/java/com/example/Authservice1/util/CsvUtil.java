package com.example.Authservice1.util;

import com.example.Authservice1.model.Permission;
import com.example.Authservice1.model.Registration;
import com.example.Authservice1.model.Role;
import com.example.Authservice1.model.User;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

public class CsvUtil {
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    // Escape for CSV: wrap with quotes and double any embedded quotes
    private static String esc(String s) {
        if (s == null) return "\"\"";
        String v = s.replace("\"", "\"\"");
        return "\"" + v + "\"";
    }

    // ---------- USERS ----------
    private static final LinkedHashMap<String, Function<User,String>> USER_COLS = new LinkedHashMap<>() {{
        put("id",        u -> String.valueOf(u.getId()));
        put("username",  User::getUsername);
        put("email",     User::getEmail);
        put("active",    u -> String.valueOf(u.isActive()));
        put("roles",     u -> u.getRoles().stream().map(Role::getName).sorted().collect(Collectors.joining("|")));
        put("directPermissions", u -> u.getDirectPermissions().stream().map(Permission::getCode).sorted().collect(Collectors.joining("|")));
        put("createdAt", u -> u.getCreatedAt()!=null ? DT.format(u.getCreatedAt()) : "");
        put("fullName",  User::getFullName);
        put("department",User::getDepartment);
        put("designation",User::getDesignation);
        put("contactNo", User::getContactNo);
        put("company",   User::getCompany);
        put("remarks",   User::getRemarks);
    }};
    private static final List<String> USER_DEFAULTS =
            List.of("id","username","email","active","roles","directPermissions","createdAt");

    public static byte[] usersToCsv(List<User> users, List<String> requestedCols) {
        List<String> cols = resolveColumns(requestedCols, USER_COLS.keySet(), USER_DEFAULTS);
        String header = String.join(",", cols.stream().map(c -> esc(headerize(c))).toList());
        String body = users.stream().map(u ->
            cols.stream().map(c -> esc(USER_COLS.get(c).apply(u))).collect(Collectors.joining(","))
        ).collect(Collectors.joining("\n"));
        return (header + "\n" + body + (users.isEmpty() ? "" : "\n")).getBytes(StandardCharsets.UTF_8);
    }

    // ---------- REGISTRATIONS ----------
    private static final LinkedHashMap<String, Function<Registration,String>> REG_COLS = new LinkedHashMap<>() {{
        put("id",         r -> String.valueOf(r.getId()));
        put("epfNo",      Registration::getEpfNo);
        put("fullName",   Registration::getFullName);
        put("nameWithInitials", Registration::getNameWithInitials);
        put("surname",    Registration::getSurname);
        put("nicNo",      Registration::getNicNo);
        put("district",   Registration::getDistrict);
        put("mobileNo",   Registration::getMobileNo);
        put("personalEmail", Registration::getPersonalEmail);
        put("workingStatus", Registration::getWorkingStatus);
        put("department", Registration::getDepartment);
        put("addedTime",  r -> r.getAddedTime()!=null ? DT.format(r.getAddedTime()) : "");
        put("cardStatus", Registration::getCardStatus);
        put("gender",     Registration::getGender);
        put("dateOfBirth",r -> r.getDateOfBirth()!=null ? r.getDateOfBirth().toString() : "");
        put("imageUrl",   Registration::getImageUrl);
    }};
    private static final List<String> REG_DEFAULTS =
            List.of("id","epfNo","fullName","nicNo","district","mobileNo","personalEmail","workingStatus","addedTime");

    public static byte[] registrationsToCsv(List<Registration> regs, List<String> requestedCols) {
        List<String> cols = resolveColumns(requestedCols, REG_COLS.keySet(), REG_DEFAULTS);
        String header = String.join(",", cols.stream().map(c -> esc(headerize(c))).toList());
        String body = regs.stream().map(r ->
            cols.stream().map(c -> esc(REG_COLS.get(c).apply(r))).collect(Collectors.joining(","))
        ).collect(Collectors.joining("\n"));
        return (header + "\n" + body + (regs.isEmpty() ? "" : "\n")).getBytes(StandardCharsets.UTF_8);
    }

    // -------- Helpers --------
    private static List<String> resolveColumns(List<String> requested, Set<String> allowed, List<String> defaults) {
        if (requested == null || requested.isEmpty()) return defaults;
        List<String> cleaned = requested.stream().map(String::trim).filter(allowed::contains).toList();
        return cleaned.isEmpty() ? defaults : cleaned;
    }

    private static String headerize(String key) {
        String spaced = key.replaceAll("([a-z])([A-Z])", "$1 $2");
        return Character.toUpperCase(spaced.charAt(0)) + spaced.substring(1);
    }
}
