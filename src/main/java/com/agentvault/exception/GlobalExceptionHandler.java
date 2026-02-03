package com.agentvault.exception;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

@ControllerAdvice
public class GlobalExceptionHandler {

  public record ErrorResponse(int status, String message, String path, LocalDateTime timestamp) {}

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidationExceptions(
      MethodArgumentNotValidException ex, WebRequest request) {
    String message =
        ex.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.joining(", "));
    ErrorResponse error =
        new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            message,
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now(ZoneId.of("UTC")));
    return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(org.springframework.security.authentication.BadCredentialsException.class)
  public ResponseEntity<ErrorResponse> handleBadCredentialsException(
      org.springframework.security.authentication.BadCredentialsException ex, WebRequest request) {
    ErrorResponse error =
        new ErrorResponse(
            HttpStatus.UNAUTHORIZED.value(),
            ex.getMessage(),
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now(ZoneId.of("UTC")));
    return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex, WebRequest request) {
    ErrorResponse error =
        new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            ex.getMessage(),
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now(ZoneId.of("UTC")));
    return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
