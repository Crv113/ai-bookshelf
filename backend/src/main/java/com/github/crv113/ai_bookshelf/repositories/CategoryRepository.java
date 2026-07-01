package com.github.crv113.ai_bookshelf.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.crv113.ai_bookshelf.entities.Category;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

}
