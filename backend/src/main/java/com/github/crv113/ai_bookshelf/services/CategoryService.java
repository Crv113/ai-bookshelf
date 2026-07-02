package com.github.crv113.ai_bookshelf.services;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.crv113.ai_bookshelf.dtos.CategoryCreateDTO;
import com.github.crv113.ai_bookshelf.dtos.CategoryResponseDTO;
import com.github.crv113.ai_bookshelf.entities.Category;
import com.github.crv113.ai_bookshelf.repositories.CategoryRepository;
import com.github.crv113.ai_bookshelf.repositories.FlashCardRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final FlashCardRepository flashCardRepository;

    public CategoryResponseDTO create(CategoryCreateDTO categoryCreateDTO) {
        Category category = new Category();
        category.setName(categoryCreateDTO.getName());

        categoryRepository.save(category);

        return toResponseDTO(category);
    }

    public CategoryResponseDTO findById(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return toResponseDTO(category);
    }

    public List<CategoryResponseDTO> findAll() {
        return categoryRepository.findAll().stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public CategoryResponseDTO update(UUID id, CategoryCreateDTO categoryCreateDTO) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        category.setName(categoryCreateDTO.getName());

        categoryRepository.save(category);

        return toResponseDTO(category);
    }

    public void delete(UUID id) {

        if (flashCardRepository.existsByCategoryId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete category with associated flashcards.");
        }

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        categoryRepository.delete(category);
    }

    private CategoryResponseDTO toResponseDTO(Category category) {
        return new CategoryResponseDTO(category.getId(), category.getName(), category.getCreatedAt());
    }
}
