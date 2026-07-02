package com.github.crv113.ai_bookshelf.dtos;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class FlashCardCreateDTO {

    @NotBlank
    private String title;
    @NotBlank
    private String summary;

    @NotBlank
    private String content;

    @NotNull
    private UUID categoryId;

}
