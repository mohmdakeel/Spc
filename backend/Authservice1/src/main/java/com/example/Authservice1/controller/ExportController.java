package com.example.Authservice1.controller;

import com.example.Authservice1.service.UserService;
import com.example.Authservice1.service.RegistrationService;
import com.example.Authservice1.util.CsvUtil;
import com.example.Authservice1.util.PdfUtil;
import com.example.Authservice1.util.ExcelUtil;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/export")
public class ExportController {
    private final UserService userService;
    private final RegistrationService regService;

    public ExportController(UserService userService, RegistrationService regService) {
        this.userService = userService; this.regService = regService;
    }

    private static String fn(String base) {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmm"));
        return base + "_" + ts;
    }
    private static ContentDisposition cd(String filename) {
        String enc = URLEncoder.encode(filename, StandardCharsets.UTF_8);
        return ContentDisposition.attachment().filename(enc, StandardCharsets.UTF_8).build();
    }
    private static List<String> parseColumns(String columns) {
        if (columns == null || columns.isBlank()) return List.of();
        return Arrays.stream(columns.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    // USERS CSV/PDF/XLSX
    @GetMapping(value="/users.csv", produces = "text/csv")
    @PreAuthorize("hasAuthority('PERM_USER_READ') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportUsersCsv(
            @RequestParam(required=false) String q,
            @RequestParam(required=false) String from,
            @RequestParam(required=false) String to,
            @RequestParam(required=false) String role,
            @RequestParam(required=false, name="columns") String columns) {

        var list = userService.listForExport(q, from, to, role);
        var cols = parseColumns(columns);
        byte[] csv = CsvUtil.usersToCsv(list, cols);
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        h.setContentDisposition(cd(fn("users") + ".csv"));
        return new ResponseEntity<>(csv, h, HttpStatus.OK);
    }

    @GetMapping(value="/users.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAuthority('PERM_USER_READ') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportUsersPdf(
            @RequestParam(required=false) String q,
            @RequestParam(required=false) String from,
            @RequestParam(required=false) String to,
            @RequestParam(required=false) String role,
            @RequestParam(required=false, name="columns") String columns) {

        var list = userService.listForExport(q, from, to, role);
        var cols = parseColumns(columns);
        byte[] pdf = PdfUtil.usersToPdf(list, "Users Report", cols);
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_PDF);
        h.setContentDisposition(cd(fn("users") + ".pdf"));
        return new ResponseEntity<>(pdf, h, HttpStatus.OK);
    }

    @GetMapping(value="/users.xlsx", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    @PreAuthorize("hasAuthority('PERM_USER_READ') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportUsersXlsx(
            @RequestParam(required=false) String q,
            @RequestParam(required=false) String from,
            @RequestParam(required=false) String to,
            @RequestParam(required=false) String role,
            @RequestParam(required=false, name="columns") String columns) {

        var list = userService.listForExport(q, from, to, role);
        var cols = parseColumns(columns);
        byte[] xlsx = ExcelUtil.usersToExcel(list, cols);
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        h.setContentDisposition(cd(fn("users") + ".xlsx"));
        return new ResponseEntity<>(xlsx, h, HttpStatus.OK);
    }

    // REG CSV/PDF/XLSX
    @GetMapping(value="/registrations.csv", produces = "text/csv")
    @PreAuthorize("hasAuthority('PERM_USER_READ') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportRegistrationsCsv(
            @RequestParam(required=false) String q,
            @RequestParam(required=false) String from,
            @RequestParam(required=false) String to,
            @RequestParam(required=false) String department,
            @RequestParam(required=false, name="columns") String columns) {

        var list = regService.listForExport(q, from, to, department);
        var cols = parseColumns(columns);
        byte[] csv = CsvUtil.registrationsToCsv(list, cols);
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        h.setContentDisposition(cd(fn("employees") + ".csv"));
        return new ResponseEntity<>(csv, h, HttpStatus.OK);
    }

    @GetMapping(value="/registrations.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAuthority('PERM_USER_READ') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportRegistrationsPdf(
            @RequestParam(required=false) String q,
            @RequestParam(required=false) String from,
            @RequestParam(required=false) String to,
            @RequestParam(required=false) String department,
            @RequestParam(required=false, name="columns") String columns) {

        var list = regService.listForExport(q, from, to, department);
        var cols = parseColumns(columns);
        byte[] pdf = PdfUtil.registrationsToPdf(list, "Employees (Registrations) Report", cols);
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_PDF);
        h.setContentDisposition(cd(fn("employees") + ".pdf"));
        return new ResponseEntity<>(pdf, h, HttpStatus.OK);
    }

    @GetMapping(value="/registrations.xlsx", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    @PreAuthorize("hasAuthority('PERM_USER_READ') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportRegistrationsXlsx(
            @RequestParam(required=false) String q,
            @RequestParam(required=false) String from,
            @RequestParam(required=false) String to,
            @RequestParam(required=false) String department,
            @RequestParam(required=false, name="columns") String columns) {

        var list = regService.listForExport(q, from, to, department);
        var cols = parseColumns(columns);
        byte[] xlsx = ExcelUtil.registrationsToExcel(list, cols);
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        h.setContentDisposition(cd(fn("employees") + ".xlsx"));
        return new ResponseEntity<>(xlsx, h, HttpStatus.OK);
    }
}
