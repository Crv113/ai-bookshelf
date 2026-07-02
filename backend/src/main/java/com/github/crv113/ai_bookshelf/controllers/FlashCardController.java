package com.github.crv113.ai_bookshelf.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.crv113.ai_bookshelf.dtos.FlashCardCreateDTO;
import com.github.crv113.ai_bookshelf.dtos.FlashCardResponseDTO;
import com.github.crv113.ai_bookshelf.dtos.FlashCardSummaryDTO;
import com.github.crv113.ai_bookshelf.dtos.FlashCardUpdateDTO;
import com.github.crv113.ai_bookshelf.services.FlashCardService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

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
    public List<FlashCardSummaryDTO> get() {
        return flashCardService.findAll();
    }

    @GetMapping("/{id}")
    public FlashCardResponseDTO getById(@PathVariable UUID id) {
        return flashCardService.findById(id);
    }

    @GetMapping("/category/{categoryId}")
    public List<FlashCardSummaryDTO> getByCategoryId(@PathVariable UUID categoryId) {
        return flashCardService.findByCategoryId(categoryId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        flashCardService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public FlashCardResponseDTO update(@PathVariable UUID id,
            @Valid @RequestBody FlashCardUpdateDTO flashCardUpdateDTO) {
        return flashCardService.update(flashCardUpdateDTO, id);
    }

}
