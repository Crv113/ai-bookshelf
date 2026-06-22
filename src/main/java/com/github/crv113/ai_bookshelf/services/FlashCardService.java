package com.github.crv113.ai_bookshelf.services;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.crv113.ai_bookshelf.dtos.FlashCardCreateDTO;
import com.github.crv113.ai_bookshelf.dtos.FlashCardResponseDTO;
import com.github.crv113.ai_bookshelf.entities.FlashCard;
import com.github.crv113.ai_bookshelf.repositories.FlashCardRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FlashCardService {
    private final FlashCardRepository flashCardRepository;

    public FlashCardResponseDTO create(FlashCardCreateDTO flashCardCreateDTO) {
        FlashCard flashCard = new FlashCard();
        flashCard.setTitle(flashCardCreateDTO.getTitle());
        flashCard.setSummary(flashCardCreateDTO.getSummary());
        flashCard.setContent(flashCardCreateDTO.getContent());

        flashCardRepository.save(flashCard);

        return toResponseDTO(flashCard);
    }

    public List<FlashCardResponseDTO> findAll() {
        return flashCardRepository.findAll().stream().map(this::toResponseDTO)
                .toList();
    }

    public FlashCardResponseDTO findById(UUID id) {
        FlashCard flashCard = flashCardRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return toResponseDTO(flashCard);
    }

    private FlashCardResponseDTO toResponseDTO(FlashCard flashCard) {
        return new FlashCardResponseDTO(flashCard.getId(), flashCard.getTitle(), flashCard.getCreatedAt(),
                flashCard.getSummary(), flashCard.getContent());
    }
}
