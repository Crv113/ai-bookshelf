package com.github.crv113.ai_bookshelf.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.crv113.ai_bookshelf.dtos.FlashCardCreateDTO;
import com.github.crv113.ai_bookshelf.dtos.FlashCardResponseDTO;
import com.github.crv113.ai_bookshelf.services.FlashCardService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/flashcards")
public class FlashCardController {

    private final FlashCardService flashCardService;

    @PostMapping()
    public ResponseEntity<FlashCardResponseDTO> create(@Valid @RequestBody FlashCardCreateDTO flashCardCreateDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(flashCardService.create(flashCardCreateDTO));
    }

    @GetMapping()
    public List<FlashCardResponseDTO> get() {
        return flashCardService.findAll();
    }

}
