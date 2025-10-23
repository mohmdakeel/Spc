// src/main/java/com/example/authservice/dto/ApiResponse.java
package com.example.authservice.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ApiResponse<T> {
  private boolean ok;
  private String message;
  private T data;

  public static <T> ApiResponse<T> ok(T data) { return new ApiResponse<>(true, null, data); }
  public static <T> ApiResponse<T> fail(String msg) { return new ApiResponse<>(false, msg, null); }
}