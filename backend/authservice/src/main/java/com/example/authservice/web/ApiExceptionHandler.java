package com.example.authservice.web;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    @ResponseStatus // use the status from the exception
    public Map<String, String> handleRSE(ResponseStatusException ex) {
        return Map.of("message", ex.getReason() == null ? "Forbidden" : ex.getReason());
    }

    // Fallback: make IllegalState an explicit 400 instead of 500
    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleIllegalState(IllegalStateException ex) {
        return Map.of("message", ex.getMessage());
    }
}
