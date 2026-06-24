package com.github.crv113.ai_bookshelf.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FlashCardSummaryDTO {

    private UUID id;
    private String title;
    private LocalDateTime createdAt;
    private String summary;
}
