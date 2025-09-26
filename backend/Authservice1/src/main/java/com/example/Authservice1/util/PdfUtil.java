package com.example.Authservice1.util;

import com.example.Authservice1.model.Permission;
import com.example.Authservice1.model.Registration;
import com.example.Authservice1.model.Role;
import com.example.Authservice1.model.User;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * PDF export utilities using OpenPDF (com.github.librepdf:openpdf)
 */
public class PdfUtil {
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    // ---------- USERS ----------
    private static final Map<String, Function<User,String>> USER_COLS = new LinkedHashMap<>() {{
        put("id",        u -> String.valueOf(u.getId()));
        put("username",  User::getUsername);
        put("email",     User::getEmail);
        put("active",    u -> String.valueOf(u.isActive()));
        put("roles",     u -> u.getRoles().stream().map(Role::getName).sorted().collect(Collectors.joining(", ")));
        put("directPermissions", u -> u.getDirectPermissions().stream().map(Permission::getCode).sorted().collect(Collectors.joining(", ")));
        put("createdAt", u -> u.getCreatedAt()!=null ? DT.format(u.getCreatedAt()) : "");
        put("fullName",  User::getFullName);
        put("department",User::getDepartment);
        put("designation",User::getDesignation);
        put("contactNo", User::getContactNo);
        put("company",   User::getCompany);
        put("remarks",   User::getRemarks);
    }};
    private static final java.util.List<String> USER_DEFAULTS =
            java.util.List.of("id","username","email","active","roles","directPermissions","createdAt");

    public static byte[] usersToPdf(java.util.List<User> users, String title, java.util.List<String> requestedCols) {
        java.util.List<String> cols = resolveColumns(requestedCols, USER_COLS.keySet(), USER_DEFAULTS);
        float[] widths = calcWidths(cols);
        return tablePdf(
                title,
                cols.stream().map(PdfUtil::headerize).toList(),
                users.stream().map(u -> cols.stream().map(c -> safe(USER_COLS.get(c).apply(u))).toList()).toList(),
                widths
        );
    }

    // ---------- REGISTRATIONS ----------
    private static final Map<String, Function<Registration,String>> REG_COLS = new LinkedHashMap<>() {{
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
    private static final java.util.List<String> REG_DEFAULTS =
            java.util.List.of("id","epfNo","fullName","nicNo","district","mobileNo","personalEmail","workingStatus","addedTime");

    public static byte[] registrationsToPdf(java.util.List<Registration> regs, String title, java.util.List<String> requestedCols) {
        java.util.List<String> cols = resolveColumns(requestedCols, REG_COLS.keySet(), REG_DEFAULTS);
        float[] widths = calcWidths(cols);
        return tablePdf(
                title,
                cols.stream().map(PdfUtil::headerize).toList(),
                regs.stream().map(r -> cols.stream().map(c -> safe(REG_COLS.get(c).apply(r))).toList()).toList(),
                widths
        );
    }

    // ---------- Core table writer ----------
    private static byte[] tablePdf(String title, java.util.List<String> headers, java.util.List<java.util.List<String>> rows, float[] widths) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
        try {
            PdfWriter.getInstance(doc, out);
            doc.addTitle(title);
            doc.open();

            Font h1 = new Font(Font.HELVETICA, 16, Font.BOLD, Color.BLACK);
            Font th = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
            Font td = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.BLACK);

            Paragraph p = new Paragraph(title, h1);
            p.setSpacingAfter(10f);
            doc.add(p);

            PdfPTable table = new PdfPTable(widths);
            table.setWidthPercentage(100);

            for (String c : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(c, th));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBackgroundColor(new Color(33, 37, 41));
                cell.setPadding(5f);
                table.addCell(cell);
            }
            table.setHeaderRows(1);

            for (java.util.List<String> row : rows) {
                for (String v : row) {
                    PdfPCell cell = new PdfPCell(new Phrase(safe(v), td));
                    cell.setPadding(5f);
                    table.addCell(cell);
                }
            }

            doc.add(table);
        } catch (Exception ignored) {
        } finally {
            doc.close();
        }
        return out.toByteArray();
    }

    // ---------- Helpers ----------
    private static java.util.List<String> resolveColumns(java.util.List<String> requested, Set<String> allowed, java.util.List<String> defaults) {
        if (requested == null || requested.isEmpty()) return defaults;
        java.util.List<String> cleaned = requested.stream().map(String::trim).filter(allowed::contains).toList();
        return cleaned.isEmpty() ? defaults : cleaned;
    }
    private static String safe(String s) { return s == null ? "" : s; }

    private static String headerize(String key) {
        String spaced = key.replaceAll("([a-z])([A-Z])", "$1 $2");
        return Character.toUpperCase(spaced.charAt(0)) + spaced.substring(1);
    }

    private static float[] calcWidths(java.util.List<String> cols) {
        float[] w = new float[cols.size()];
        for (int i = 0; i < cols.size(); i++) {
            String c = cols.get(i).toLowerCase();
            if (c.contains("id")) w[i] = 8f;
            else if (c.contains("email") || c.contains("roles") || c.contains("direct")
                    || c.contains("full") || c.contains("permissions")) w[i] = 26f;
            else if (c.contains("username") || c.contains("epf") || c.contains("department")
                    || c.contains("district")) w[i] = 18f;
            else if (c.contains("added") || c.contains("created")) w[i] = 16f;
            else w[i] = 14f;
        }
        return w;
    }
}
