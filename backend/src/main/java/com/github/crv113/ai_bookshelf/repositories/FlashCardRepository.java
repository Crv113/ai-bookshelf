package com.github.crv113.ai_bookshelf.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.github.crv113.ai_bookshelf.dtos.FlashCardSummaryDTO;
import com.github.crv113.ai_bookshelf.entities.FlashCard;

public interface FlashCardRepository extends JpaRepository<FlashCard, UUID> {

    @Query("SELECT new com.github.crv113.ai_bookshelf.dtos.FlashCardSummaryDTO(f.id, f.title, f.createdAt,f.summary) FROM FlashCard f")
    public List<FlashCardSummaryDTO> findAllSummaries();

    public boolean existsByCategoryId(UUID categoryId);

    public List<FlashCard> findByCategoryId(UUID categoryId);
}
