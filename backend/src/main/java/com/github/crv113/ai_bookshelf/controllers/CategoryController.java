package com.github.crv113.ai_bookshelf.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.crv113.ai_bookshelf.dtos.CategoryCreateDTO;
import com.github.crv113.ai_bookshelf.dtos.CategoryResponseDTO;
import com.github.crv113.ai_bookshelf.services.CategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping()
    public ResponseEntity<CategoryResponseDTO> create(@Valid @RequestBody CategoryCreateDTO categoryCreateDTO) {

        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(categoryCreateDTO));
    }

    @GetMapping()
    public List<CategoryResponseDTO> get() {
        return categoryService.findAll();
    }

    @GetMapping("/{id}")
    public CategoryResponseDTO getById(@PathVariable UUID id) {
        return categoryService.findById(id);
    }

    @PutMapping("/{id}")
    public CategoryResponseDTO update(@PathVariable UUID id, @Valid @RequestBody CategoryCreateDTO categoryCreateDTO) {
        return categoryService.update(id, categoryCreateDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
