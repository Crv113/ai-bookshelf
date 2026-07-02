package com.github.crv113.ai_bookshelf.services;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.crv113.ai_bookshelf.dtos.FlashCardCreateDTO;
import com.github.crv113.ai_bookshelf.dtos.FlashCardResponseDTO;
import com.github.crv113.ai_bookshelf.dtos.FlashCardSummaryDTO;
import com.github.crv113.ai_bookshelf.dtos.FlashCardUpdateDTO;
import com.github.crv113.ai_bookshelf.entities.Category;
import com.github.crv113.ai_bookshelf.entities.FlashCard;
import com.github.crv113.ai_bookshelf.repositories.CategoryRepository;
import com.github.crv113.ai_bookshelf.repositories.FlashCardRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FlashCardService {
    private final FlashCardRepository flashCardRepository;
    private final CategoryRepository categoryRepository;

    public FlashCardResponseDTO create(FlashCardCreateDTO flashCardCreateDTO) {
        FlashCard flashCard = new FlashCard();
        flashCard.setTitle(flashCardCreateDTO.getTitle());
        flashCard.setSummary(flashCardCreateDTO.getSummary());
        flashCard.setContent(flashCardCreateDTO.getContent());

        Category category = categoryRepository.findById(flashCardCreateDTO.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        flashCard.setCategory(category);

        flashCardRepository.save(flashCard);

        return toResponseDTO(flashCard);
    }

    public List<FlashCardSummaryDTO> findAll() {
        return flashCardRepository.findAllSummaries();
    }

    public FlashCardResponseDTO findById(UUID id) {
        FlashCard flashCard = flashCardRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return toResponseDTO(flashCard);
    }

    public List<FlashCardSummaryDTO> findByCategoryId(UUID categoryId) {

        List<FlashCard> flashCards = flashCardRepository.findByCategoryId(categoryId);

        return flashCards.stream()
                .map(f -> new FlashCardSummaryDTO(f.getId(), f.getTitle(), f.getCreatedAt(), f.getSummary())).toList();
    }

    public void delete(UUID id) {
        FlashCard flashCard = flashCardRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        flashCardRepository.delete(flashCard);
    }

    public FlashCardResponseDTO update(FlashCardUpdateDTO flashCardUpdateDTO, UUID id) {
        FlashCard flashCard = flashCardRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        flashCard.setTitle(flashCardUpdateDTO.getTitle());
        flashCard.setSummary(flashCardUpdateDTO.getSummary());

        Category category = categoryRepository.findById(flashCardUpdateDTO.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        flashCard.setCategory(category);

        flashCardRepository.save(flashCard);

        return toResponseDTO(flashCard);
    }

    private FlashCardResponseDTO toResponseDTO(FlashCard flashCard) {
        Category category = flashCard.getCategory();

        return new FlashCardResponseDTO(flashCard.getId(), flashCard.getTitle(), flashCard.getCreatedAt(),
                flashCard.getSummary(), flashCard.getContent(), category.getId(), category.getName());
    }
}
