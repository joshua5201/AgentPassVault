/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.exception;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@ControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
  private final Environment env;

  public GlobalExceptionHandler(Environment env) {
    this.env = env;
  }

  public record ErrorResponse(
      int status, String message, String path, LocalDateTime timestamp, String stackTrace) {}

  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ErrorResponse> handleTypeMismatchException(
      MethodArgumentTypeMismatchException ex, WebRequest request) {
    ErrorResponse error =
        new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Invalid parameter format",
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now(ZoneId.of("UTC")),
            null);
    return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
  }

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
            LocalDateTime.now(ZoneId.of("UTC")),
            null);
    return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(org.springframework.security.authentication.BadCredentialsException.class)
  public ResponseEntity<ErrorResponse> handleBadCredentialsException(
      org.springframework.security.authentication.BadCredentialsException ex, WebRequest request) {
    ErrorResponse error =
        new ErrorResponse(
            HttpStatus.UNAUTHORIZED.value(),
            "Invalid credentials",
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now(ZoneId.of("UTC")),
            null);
    return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
  }

  @ExceptionHandler(TwoFactorRequiredException.class)
  public ResponseEntity<ErrorResponse> handleTwoFactorRequiredException(
      TwoFactorRequiredException ex, WebRequest request) {
    ErrorResponse error =
        new ErrorResponse(
            HttpStatus.UNAUTHORIZED.value(),
            "TWO_FACTOR_REQUIRED",
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now(ZoneId.of("UTC")),
            null);
    return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
      IllegalArgumentException ex, WebRequest request) {
    ErrorResponse error =
        new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            ex.getMessage(),
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now(ZoneId.of("UTC")),
            null);
    return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
      ResourceNotFoundException ex, WebRequest request) {
    ErrorResponse error =
        new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now(ZoneId.of("UTC")),
            null);
    return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
  public ResponseEntity<ErrorResponse> handleAccessDeniedException(
      org.springframework.security.access.AccessDeniedException ex, WebRequest request) {
    ErrorResponse error =
        new ErrorResponse(
            HttpStatus.FORBIDDEN.value(),
            ex.getMessage(),
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now(ZoneId.of("UTC")),
            null);
    return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex, WebRequest request) {
    logger.error("Unhandled exception occurred", ex);

    String stackTrace = null;
    if (!Arrays.asList(env.getActiveProfiles()).contains("production")) {
      StringWriter sw = new StringWriter();
      PrintWriter pw = new PrintWriter(sw);
      ex.printStackTrace(pw);
      stackTrace = sw.toString();
    }

    ErrorResponse error =
        new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An unexpected error occurred: " + ex.getMessage(),
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now(ZoneId.of("UTC")),
            stackTrace);
    return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
