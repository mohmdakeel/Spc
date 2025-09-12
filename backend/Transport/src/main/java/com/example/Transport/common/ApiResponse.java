package com.example.Transport.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {
    private boolean ok;
    private String message;
    private T data;

    /* ===== Factory Methods (primary) ===== */

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .ok(true)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .ok(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> fail(String message) {
        return ApiResponse.<T>builder()
                .ok(false)
                .message(message)
                .build();
    }

    /* ===== Backward-compat aliases (so existing controllers using ok/error keep working) ===== */

    public static <T> ApiResponse<T> ok(T data) {
        return success(data);
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return success(message, data);
    }

    public static <T> ApiResponse<T> error(String message) {
        return fail(message);
    }
}
