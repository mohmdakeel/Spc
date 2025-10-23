// // advice/GlobalExceptionHandler.java
// package com.example.authservice.advice;

// import com.example.authservice.dto.ApiResponse;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.MethodArgumentNotValidException;
// import org.springframework.web.bind.annotation.*;

// import java.util.NoSuchElementException;

// @RestControllerAdvice
// public class GlobalExceptionHandler {
//   @ExceptionHandler({MethodArgumentNotValidException.class, IllegalArgumentException.class, NoSuchElementException.class})
//   public ResponseEntity<ApiResponse> badReq(Exception e) {
//     return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
//   }
//   @ExceptionHandler(Exception.class)
//   public ResponseEntity<ApiResponse> oops(Exception e) {
//     return ResponseEntity.status(500).body(new ApiResponse(false, "Server error"));
//   }
// }
