package com.example.Transport.dto.validation;

import com.example.Transport.dto.CreateUsageRequestDto;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class ValidUsageRequestValidator implements ConstraintValidator<ValidUsageRequest, CreateUsageRequestDto> {

    private static final DateTimeFormatter HM = DateTimeFormatter.ofPattern("HH:mm");

    @Override
    public boolean isValid(CreateUsageRequestDto dto, ConstraintValidatorContext ctx) {
        if (dto == null) return true;

        // If fields are missing, let field-level constraints handle
        if (dto.timeFrom == null || dto.timeTo == null) return true;

        try {
            LocalTime from = LocalTime.parse(dto.timeFrom, HM);
            LocalTime to   = LocalTime.parse(dto.timeTo,   HM);

            if (from.equals(to)) {
                ctx.disableDefaultConstraintViolation();
                ctx.buildConstraintViolationWithTemplate("timeFrom must differ from timeTo")
                   .addPropertyNode("timeTo")
                   .addConstraintViolation();
                return false;
            }
            return true; // same-day and overnight are allowed
        } catch (DateTimeParseException ex) {
            // Field-level @Pattern will already flag format issues; return true here.
            return true;
        }
    }
}
