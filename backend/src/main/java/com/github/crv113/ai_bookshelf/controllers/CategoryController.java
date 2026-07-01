package com.github.crv113.ai_bookshelf.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.crv113.ai_bookshelf.dtos.CategoryCreateDTO;
import com.github.crv113.ai_bookshelf.dtos.CategoryResponseDTO;
import com.github.crv113.ai_bookshelf.services.CategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping()
    public ResponseEntity<CategoryResponseDTO> create(@Valid @RequestBody CategoryCreateDTO categoryCreateDTO) {

        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(categoryCreateDTO));
    }
}
