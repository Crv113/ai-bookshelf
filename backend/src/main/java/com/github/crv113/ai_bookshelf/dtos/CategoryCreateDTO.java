package com.github.crv113.ai_bookshelf.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CategoryCreateDTO {

    @NotBlank
    private String name;
}
