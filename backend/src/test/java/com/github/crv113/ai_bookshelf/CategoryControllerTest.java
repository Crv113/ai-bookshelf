package com.github.crv113.ai_bookshelf;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import com.github.crv113.ai_bookshelf.entities.Category;
import com.github.crv113.ai_bookshelf.entities.FlashCard;
import com.github.crv113.ai_bookshelf.repositories.CategoryRepository;
import com.github.crv113.ai_bookshelf.repositories.FlashCardRepository;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
public class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private FlashCardRepository flashCardRepository;

    @BeforeEach
    void setUp() {
        flashCardRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void findByIdShouldReturnCorrectFlashCardCount() throws Exception {
        Category category = new Category();
        category.setName("Bases de données");
        categoryRepository.save(category);

        FlashCard flashCard = new FlashCard();
        flashCard.setTitle("Index SQL");
        flashCard.setSummary("Les index en base de données");
        flashCard.setContent("Un index accélère les recherches [...]");
        flashCard.setCategory(category);
        flashCardRepository.save(flashCard);

        FlashCard flashCard2 = new FlashCard();
        flashCard2.setTitle("Normalisation");
        flashCard2.setSummary("Les formes normales");
        flashCard2.setContent("La normalisation d'une base de données [...]");
        flashCard2.setCategory(category);
        flashCardRepository.save(flashCard2);

        mockMvc.perform(get("/api/categories/" + category.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.flashCardCount").value(2));
    }

    @Test
    void findByIdShouldReturnZeroFlashCardCountWhenNoFlashCards() throws Exception {
        Category category = new Category();
        category.setName("Vide");
        categoryRepository.save(category);

        mockMvc.perform(get("/api/categories/" + category.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.flashCardCount").value(0));
    }

    @Test
    void findByIdShouldReturn404WhenCategoryDoesNotExist() throws Exception {
        mockMvc.perform(get("/api/categories/" + UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void findAllShouldReturnFlashCardCountForEachCategory() throws Exception {
        Category category1 = new Category();
        category1.setName("Algorithmique");
        categoryRepository.save(category1);

        Category category2 = new Category();
        category2.setName("Réseaux");
        categoryRepository.save(category2);

        FlashCard flashCard = new FlashCard();
        flashCard.setTitle("Tri rapide");
        flashCard.setSummary("Le tri quicksort");
        flashCard.setContent("Le quicksort utilise un pivot [...]");
        flashCard.setCategory(category1);
        flashCardRepository.save(flashCard);

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.name == 'Algorithmique')].flashCardCount").value(1))
                .andExpect(jsonPath("$[?(@.name == 'Réseaux')].flashCardCount").value(0));
    }

}
