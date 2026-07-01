package com.github.crv113.ai_bookshelf.services;

import com.github.crv113.ai_bookshelf.AiBookshelfApplication;
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

        if (categoryCreateDTO.getParentId() != null) {
            Category parentCategory = categoryRepository.findById(categoryCreateDTO.getParentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            category.setParent(parentCategory);
        }

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

        if (categoryCreateDTO.getParentId() != null) {
            Category parentCategory = categoryRepository.findById(categoryCreateDTO.getParentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            category.setParent(parentCategory);
        } else {
            category.setParent(null);
        }

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

        if (category.getChildren() != null && !category.getChildren().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete category with associated child categories.");
        }
        categoryRepository.delete(category);
    }

    private CategoryResponseDTO toResponseDTO(Category category) {
        UUID parentId = category.getParent() != null ? category.getParent().getId() : null;
        String parentName = category.getParent() != null ? category.getParent().getName() : null;
        return new CategoryResponseDTO(category.getId(), category.getName(), category.getCreatedAt(), parentId,
                parentName);
    }
}
