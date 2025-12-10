package com.example.authservice.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    // Use the HTTP status from the thrown ResponseStatusException
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleRSE(ResponseStatusException ex) {
        String msg = ex.getReason() == null ? "Error" : ex.getReason();
        return ResponseEntity
                .status(ex.getStatusCode())   // 403, 404, etc., from the exception
                .body(Map.of("message", msg));
    }

    // Fallback: make IllegalState an explicit 400 instead of 500
    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleIllegalState(IllegalStateException ex) {
        return Map.of("message", ex.getMessage());
    }
}
