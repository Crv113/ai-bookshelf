package com.github.crv113.ai_bookshelf.exceptions;

import java.util.stream.Collectors;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.github.crv113.ai_bookshelf.dtos.ErrorResponseDTO;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponseDTO> handlResponseStatusException(ResponseStatusException exception) {

        return ResponseEntity.status(exception.getStatusCode())
                .body(new ErrorResponseDTO(exception.getStatusCode().value(), exception.getMessage()));
    }

    @Override
    public ResponseEntity<Object> handleExceptionInternal(Exception ex,
            Object body,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        return ResponseEntity.status(status).body(new ErrorResponseDTO(status.value(), ex.getMessage()));
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {

        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage()).collect(Collectors.joining(", "));

        return ResponseEntity.status(status)
                .body(new ErrorResponseDTO(status.value(), errorMessage));

    }
}
