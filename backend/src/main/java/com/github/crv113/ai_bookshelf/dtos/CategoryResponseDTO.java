package com.github.crv113.ai_bookshelf.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class CategoryResponseDTO {

    private UUID id;
    private String name;
    private LocalDateTime createdAt;
}
