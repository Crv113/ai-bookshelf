package com.github.crv113.ai_bookshelf;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.github.crv113.ai_bookshelf.entities.FlashCard;
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

    @BeforeEach
    void setUp() {
        flashCardRepository.deleteAll();
    }

    @Test
    void shouldCreateFlashCardAndReturnFlashCard() throws Exception {

        mockMvc.perform(
                post("/api/flashcards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                                "{\"title\":\"mon titre\", \"summary\":\"une flash\", \"content\":\"le content de la flashcard\"}"))
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
        FlashCard flashCard = new FlashCard();
        flashCard.setTitle("REST API");
        flashCard.setSummary("L'histoire de l'api REST");
        flashCard.setContent(
                "REST (REpresentational State Transfer), créé par Roy Fielding en 2000, contient 6 contraintes [...]");

        flashCardRepository.save(flashCard);

        FlashCard flashCard2 = new FlashCard();
        flashCard2.setTitle("Mémoire informatique");
        flashCard2.setSummary("Fonctionnement de la mémoire");
        flashCard2.setContent(
                "La mémoire d'un ordinateur est en réalité qu'un [...]");

        flashCardRepository.save(flashCard2);

        mockMvc.perform(get("/api/flashcards")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getShouldReturn404WhenIdNotFound() throws Exception {
        mockMvc.perform(get("/api/flashcards/" + UUID.randomUUID())).andExpect(status().isNotFound());
    }

}
