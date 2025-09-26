package com.example.Authservice1.common;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class ApiResponse<T> {
    private boolean ok;
    private String message;
    private T data;

    public static <T> ApiResponse<T> ok(T data) { return new ApiResponse<>(true, null, data); }
    public static <T> ApiResponse<T> fail(String msg, T data) { return new ApiResponse<>(false, msg, data); }
}
