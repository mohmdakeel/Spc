package com.example.Transport.dto.validation;



import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = ValidUsageRequestValidator.class)
@Target({ ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidUsageRequest {
    String message() default "Invalid usage request";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
