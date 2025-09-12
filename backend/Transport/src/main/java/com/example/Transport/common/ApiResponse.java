package com.example.Transport.common;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ApiResponse<T> {
    private boolean ok;
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder().ok(true).data(data).build();
    }
    public static <T> ApiResponse<T> fail(String msg) {
        return ApiResponse.<T>builder().ok(false).message(msg).build();
    }
}
