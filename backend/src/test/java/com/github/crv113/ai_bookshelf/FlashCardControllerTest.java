package com.github.crv113.ai_bookshelf;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.github.crv113.ai_bookshelf.entities.Category;
import com.github.crv113.ai_bookshelf.entities.FlashCard;
import com.github.crv113.ai_bookshelf.repositories.CategoryRepository;
import com.github.crv113.ai_bookshelf.repositories.FlashCardRepository;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
public class FlashCardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FlashCardRepository flashCardRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @BeforeEach
    void setUp() {
        flashCardRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void shouldCreateFlashCardAndReturnFlashCard() throws Exception {
        Category category = new Category();
        category.setName("Général");
        categoryRepository.save(category);

        mockMvc.perform(
                post("/api/flashcards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                                "{\"title\":\"mon titre\", \"summary\":\"une flash\", \"content\":\"le content de la flashcard\", \"categoryId\":\""
                                        + category.getId() + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("mon titre"));
    }

    @Test
    void shouldReturn400WhenBodyIsEmpty() throws Exception {
        mockMvc.perform(post("/api/flashcards").contentType(MediaType.APPLICATION_JSON).content(""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnAllFlashCard() throws Exception {
        Category category = new Category();
        category.setName("Général");
        categoryRepository.save(category);

        FlashCard flashCard = new FlashCard();
        flashCard.setTitle("REST API");
        flashCard.setSummary("L'histoire de l'api REST");
        flashCard.setContent(
                "REST (REpresentational State Transfer), créé par Roy Fielding en 2000, contient 6 contraintes [...]");
        flashCard.setCategory(category);

        flashCardRepository.save(flashCard);

        FlashCard flashCard2 = new FlashCard();
        flashCard2.setTitle("Mémoire informatique");
        flashCard2.setSummary("Fonctionnement de la mémoire");
        flashCard2.setContent(
                "La mémoire d'un ordinateur est en réalité qu'un [...]");
        flashCard2.setCategory(category);

        flashCardRepository.save(flashCard2);

        mockMvc.perform(get("/api/flashcards")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getShouldReturn404WhenIdNotFound() throws Exception {
        mockMvc.perform(get("/api/flashcards/" + UUID.randomUUID())).andExpect(status().isNotFound());
    }

    @Test
    void getByCategoryIdShouldReturnFlashCardsWhenCategoryExists() throws Exception {
        Category category = new Category();
        category.setName("Réseaux");
        categoryRepository.save(category);

        FlashCard flashCard = new FlashCard();
        flashCard.setTitle("TCP/IP");
        flashCard.setSummary("Le modèle TCP/IP");
        flashCard.setContent("Le modèle TCP/IP en détail [...]");
        flashCard.setCategory(category);
        flashCardRepository.save(flashCard);

        mockMvc.perform(get("/api/flashcards/category/" + category.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("TCP/IP"));
    }

    @Test
    void getByCategoryIdShouldReturn404WhenCategoryDoesNotExist() throws Exception {
        mockMvc.perform(get("/api/flashcards/category/" + UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

}
