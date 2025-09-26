package com.example.Authservice1.util;

import com.example.Authservice1.model.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.util.IOUtils;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

public class ExcelUtil {
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private static final LinkedHashMap<String, Function<User,String>> USER_COLS = new LinkedHashMap<>() {{
        put("id",        u -> String.valueOf(u.getId()));
        put("username",  User::getUsername);
        put("email",     User::getEmail);
        put("roles",     u -> u.getRoles().stream().map(Role::getName).collect(Collectors.joining(", ")));
        put("directPermissions", u -> u.getDirectPermissions().stream().map(Permission::getCode).collect(Collectors.joining(", ")));
        put("active",    u -> String.valueOf(u.isActive()));
        put("createdAt", u -> u.getCreatedAt()!=null ? DT.format(u.getCreatedAt()) : "");
        put("fullName",  User::getFullName);
        put("department",User::getDepartment);
        put("designation",User::getDesignation);
        put("contactNo", User::getContactNo);
        put("company",   User::getCompany);
        put("remarks",   User::getRemarks);
    }};
    private static final List<String> USER_DEFAULTS = List.of("id","username","email","roles","directPermissions","active","createdAt");

    private static final LinkedHashMap<String, Function<Registration,String>> REG_COLS = new LinkedHashMap<>() {{
        put("id",        r -> String.valueOf(r.getId()));
        put("epfNo",     Registration::getEpfNo);
        put("fullName",  Registration::getFullName);
        put("nicNo",     Registration::getNicNo);
        put("district",  Registration::getDistrict);
        put("mobileNo",  Registration::getMobileNo);
        put("personalEmail", Registration::getPersonalEmail);
        put("workingStatus", Registration::getWorkingStatus);
        put("addedTime", r -> r.getAddedTime()!=null ? DT.format(r.getAddedTime()) : "");
        put("department", Registration::getDepartment);
        put("gender", Registration::getGender);
        put("cardStatus", Registration::getCardStatus);
    }};
    private static final List<String> REG_DEFAULTS = List.of("id","epfNo","fullName","nicNo","district","mobileNo","personalEmail","workingStatus","addedTime");

    public static byte[] usersToExcel(List<User> users, List<String> reqCols) {
        List<String> cols = resolve(reqCols, USER_COLS.keySet(), USER_DEFAULTS);
        return styledWorkbook("Users", cols, users, USER_COLS);
    }
    public static byte[] registrationsToExcel(List<Registration> regs, List<String> reqCols) {
        List<String> cols = resolve(reqCols, REG_COLS.keySet(), REG_DEFAULTS);
        return styledWorkbook("Employees (Registrations)", cols, regs, REG_COLS);
    }

    private static <T> byte[] styledWorkbook(String title, List<String> cols,
                                             List<T> list, Map<String, Function<T,String>> mapping) {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            XSSFColor headerBg = new XSSFColor(new java.awt.Color(33, 37, 41), null);
            XSSFColor zebraBg   = new XSSFColor(new java.awt.Color(247, 247, 247), null);

            Font titleFont  = wb.createFont(); titleFont.setBold(true); titleFont.setFontHeightInPoints((short)16);
            Font headerFont = wb.createFont(); headerFont.setBold(true); headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle titleStyle = wb.createCellStyle();
            titleStyle.setAlignment(HorizontalAlignment.LEFT);
            titleStyle.setVerticalAlignment(VerticalAlignment.BOTTOM);
            titleStyle.setFont(titleFont);

            CellStyle headerStyle = wb.createCellStyle();
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            ((org.apache.poi.xssf.usermodel.XSSFCellStyle) headerStyle).setFillForegroundColor(headerBg);
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setFont(headerFont);
            headerStyle.setWrapText(true);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            CellStyle bodyStyle = wb.createCellStyle();
            bodyStyle.setVerticalAlignment(VerticalAlignment.TOP);
            bodyStyle.setWrapText(false);
            bodyStyle.setBorderTop(BorderStyle.HAIR);
            bodyStyle.setBorderBottom(BorderStyle.HAIR);
            bodyStyle.setBorderLeft(BorderStyle.HAIR);
            bodyStyle.setBorderRight(BorderStyle.HAIR);

            CellStyle zebraStyle = wb.createCellStyle();
            zebraStyle.cloneStyleFrom(bodyStyle);
            ((org.apache.poi.xssf.usermodel.XSSFCellStyle) zebraStyle).setFillForegroundColor(zebraBg);
            zebraStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Sheet sheet = wb.createSheet("Report");

            int rowIdx = 0;
            int titleRowIdx = rowIdx++;
            Row titleRow = sheet.createRow(titleRowIdx);
            titleRow.setHeightInPoints(28f);

            try (InputStream is = ExcelUtil.class.getResourceAsStream("/logo.png")) {
                if (is != null) {
                    byte[] bytes = IOUtils.toByteArray(is);
                    int picIdx = wb.addPicture(bytes, Workbook.PICTURE_TYPE_PNG);
                    var helper = wb.getCreationHelper();
                    var drawing = sheet.createDrawingPatriarch();
                    var anchor = helper.createClientAnchor();
                    anchor.setCol1(0); anchor.setRow1(0);
                    anchor.setCol2(2); anchor.setRow2(2);
                    var pict = drawing.createPicture(anchor, picIdx);
                    pict.resize(1.0);
                }
            } catch (Exception ignored) {}

            Cell titleCell = titleRow.createCell(2);
            titleCell.setCellValue(title);
            titleCell.setCellStyle(titleStyle);
            int lastColForTitle = Math.max(2, cols.size()+1);
            sheet.addMergedRegion(new CellRangeAddress(titleRowIdx, titleRowIdx, 2, lastColForTitle));

            rowIdx++;

            int headerRowIdx = rowIdx++;
            Row header = sheet.createRow(headerRowIdx);
            header.setHeightInPoints(22f);
            for (int c=0; c<cols.size(); c++) {
                Cell cell = header.createCell(c);
                cell.setCellValue(headerize(cols.get(c)));
                cell.setCellStyle(headerStyle);
            }

            int dataStart = rowIdx;
            for (T t : list) {
                Row row = sheet.createRow(rowIdx++);
                boolean zebra = ((rowIdx - dataStart) % 2 == 0);
                CellStyle use = zebra ? zebraStyle : bodyStyle;

                for (int c=0; c<cols.size(); c++) {
                    String key = cols.get(c);
                    String val = mapping.get(key).apply(t);
                    Cell cell = row.createCell(c);
                    cell.setCellValue(val != null ? val : "");
                    cell.setCellStyle(use);
                }
            }

            int lastDataRow = Math.max(headerRowIdx, rowIdx-1);
            sheet.createFreezePane(0, headerRowIdx+1);
            if (cols.size() > 0) {
                sheet.setAutoFilter(new CellRangeAddress(headerRowIdx, lastDataRow, 0, cols.size()-1));
            }

            for (int c=0; c<cols.size(); c++) {
                sheet.autoSizeColumn(c);
                int width = sheet.getColumnWidth(c);
                int max = 12000;
                if (width > max) sheet.setColumnWidth(c, max);
            }

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Excel export failed", e);
        }
    }

    private static List<String> resolve(List<String> req, Set<String> allowed, List<String> defaults) {
        if (req == null || req.isEmpty()) return defaults;
        List<String> cleaned = req.stream().map(String::trim).filter(allowed::contains).toList();
        return cleaned.isEmpty() ? defaults : cleaned;
    }
    private static String headerize(String key) {
        String spaced = key.replaceAll("([a-z])([A-Z])", "$1 $2");
        return Character.toUpperCase(spaced.charAt(0)) + spaced.substring(1);
    }
}
