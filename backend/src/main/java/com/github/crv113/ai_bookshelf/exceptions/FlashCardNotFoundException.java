package com.github.crv113.ai_bookshelf.exceptions;

import java.util.UUID;

import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class FlashCardNotFoundException extends Exception {
    public FlashCardNotFoundException(UUID id) {
        super("FlashCard with ID " + id + " not found.");
    }
}
