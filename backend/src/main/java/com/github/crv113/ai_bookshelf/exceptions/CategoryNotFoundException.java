package com.github.crv113.ai_bookshelf.exceptions;

import java.util.UUID;

import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class CategoryNotFoundException extends RuntimeException {
    public CategoryNotFoundException(UUID id) {
        super("Category with ID " + id + " not found.");
    }
}
