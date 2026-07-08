package com.github.crv113.ai_bookshelf.services;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.crv113.ai_bookshelf.dtos.CategoryCreateDTO;
import com.github.crv113.ai_bookshelf.dtos.CategoryResponseDTO;
import com.github.crv113.ai_bookshelf.entities.Category;
import com.github.crv113.ai_bookshelf.exceptions.CategoryNotFoundException;
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

    public CategoryResponseDTO findById(UUID id) throws CategoryNotFoundException {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException(id));

        return toResponseDTO(category);
    }

    public List<CategoryResponseDTO> findAll() {
        return categoryRepository.findAll().stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public CategoryResponseDTO update(UUID id, CategoryCreateDTO categoryCreateDTO) throws CategoryNotFoundException {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException(id));

        category.setName(categoryCreateDTO.getName());

        categoryRepository.save(category);

        return toResponseDTO(category);
    }

    public void delete(UUID id) throws CategoryNotFoundException {

        if (flashCardRepository.existsByCategoryId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete category with associated flashcards.");
        }

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException(id));

        categoryRepository.delete(category);
    }

    // N+1 accepté au vu du nombre limité de catégories et de flashcards par
    // catégorie
    private CategoryResponseDTO toResponseDTO(Category category) {
        long flashCardCount = flashCardRepository.countByCategoryId(category.getId());
        return new CategoryResponseDTO(category.getId(), category.getName(), category.getCreatedAt(), flashCardCount);
    }
}
