package com.github.crv113.ai_bookshelf.services;

import org.springframework.stereotype.Service;

import com.github.crv113.ai_bookshelf.dtos.CategoryCreateDTO;
import com.github.crv113.ai_bookshelf.dtos.CategoryResponseDTO;
import com.github.crv113.ai_bookshelf.entities.Category;
import com.github.crv113.ai_bookshelf.repositories.CategoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public CategoryResponseDTO create(CategoryCreateDTO categoryCreateDTO) {
        Category category = new Category();
        category.setName(categoryCreateDTO.getName());

        categoryRepository.save(category);

        return toResponseDTO(category);
    }

    private CategoryResponseDTO toResponseDTO(Category category) {
        return new CategoryResponseDTO(category.getId(), category.getName(), category.getCreatedAt());
    }
}
