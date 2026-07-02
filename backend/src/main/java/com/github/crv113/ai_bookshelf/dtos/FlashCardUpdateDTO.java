package com.github.crv113.ai_bookshelf.dtos;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@NoArgsConstructor
public class FlashCardUpdateDTO {
    @NotBlank
    private String title;
    @NotBlank
    private String summary;
    @NotNull
    private UUID categoryId;
}
