package com.github.crv113.ai_bookshelf;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

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
                                "{\"title\":\"mon titre\", \"summary\":\"une flash\", \"content\":\"le content de la flashcard\", \"model\":\"Claude Opus 5.5\", \"estimatedTime\":12, \"categoryId\":\""
                                        + category.getId() + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("mon titre"))
                .andExpect(jsonPath("$.model").value("Claude Opus 5.5"))
                .andExpect(jsonPath("$.estimatedTime").value(12));
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
        mockMvc.perform(get("/api/flashcards/" + UUID.randomUUID()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").exists());
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

    @Test
    void updateShouldReplaceAllFieldsAndKeepIdAndCreatedAt() throws Exception {
        Category category = saveCategory("Général");
        FlashCard flashCard = saveCard(category);
        LocalDateTime createdAtBefore = flashCardRepository.findById(flashCard.getId()).orElseThrow().getCreatedAt();

        mockMvc.perform(put("/api/flashcards/" + flashCard.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateBody("nouveau titre", "nouveau résumé", "# Nouveau contenu", "Claude Opus 5.5", 25,
                        category.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(flashCard.getId().toString()))
                .andExpect(jsonPath("$.title").value("nouveau titre"))
                .andExpect(jsonPath("$.summary").value("nouveau résumé"))
                .andExpect(jsonPath("$.content").value("# Nouveau contenu"))
                .andExpect(jsonPath("$.model").value("Claude Opus 5.5"))
                .andExpect(jsonPath("$.estimatedTime").value(25))
                .andExpect(jsonPath("$.categoryId").value(category.getId().toString()));

        FlashCard updated = flashCardRepository.findById(flashCard.getId()).orElseThrow();
        assertThat(updated.getTitle()).isEqualTo("nouveau titre");
        assertThat(updated.getSummary()).isEqualTo("nouveau résumé");
        assertThat(updated.getContent()).isEqualTo("# Nouveau contenu");
        assertThat(updated.getModel()).isEqualTo("Claude Opus 5.5");
        assertThat(updated.getEstimatedTime()).isEqualTo(25);
        assertThat(updated.getCreatedAt()).isEqualTo(createdAtBefore);
        assertThat(flashCardRepository.count()).isEqualTo(1);
    }

    @Test
    void updateShouldChangeCategory() throws Exception {
        Category categoryA = saveCategory("A");
        Category categoryB = saveCategory("B");
        FlashCard flashCard = saveCard(categoryA);

        mockMvc.perform(put("/api/flashcards/" + flashCard.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateBody("titre", "résumé", "contenu", "model", 5, categoryB.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(categoryB.getId().toString()))
                .andExpect(jsonPath("$.categoryName").value("B"));

        FlashCard updated = flashCardRepository.findById(flashCard.getId()).orElseThrow();
        assertThat(updated.getCategory().getId()).isEqualTo(categoryB.getId());
    }

    static Stream<Arguments> invalidUpdatePayloads() {
        return Stream.of(
                Arguments.of("content", "titre", "résumé", null, "model", 5),
                Arguments.of("model", "titre", "résumé", "contenu", "", 5),
                Arguments.of("estimatedTime", "titre", "résumé", "contenu", "model", 0),
                Arguments.of("estimatedTime", "titre", "résumé", "contenu", "model", -3),
                Arguments.of("estimatedTime", "titre", "résumé", "contenu", "model", null),
                Arguments.of("title", "  ", "résumé", "contenu", "model", 5));
    }

    @ParameterizedTest
    @MethodSource("invalidUpdatePayloads")
    void updateShouldReturn400AndNotModifyCardWhenPayloadIsInvalid(String field, String title, String summary,
            String content, String model, Integer estimatedTime) throws Exception {
        Category category = saveCategory("Général");
        FlashCard flashCard = saveCard(category);

        mockMvc.perform(put("/api/flashcards/" + flashCard.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateBody(title, summary, content, model, estimatedTime, category.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(containsString(field)));

        assertUnchanged(flashCard, category);
    }

    @Test
    void updateShouldReturn400WhenBodyIsEmpty() throws Exception {
        Category category = saveCategory("Général");
        FlashCard flashCard = saveCard(category);

        mockMvc.perform(put("/api/flashcards/" + flashCard.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        assertUnchanged(flashCard, category);
    }

    @Test
    void updateShouldReturn400WhenBodyIsMalformed() throws Exception {
        Category category = saveCategory("Général");
        FlashCard flashCard = saveCard(category);

        mockMvc.perform(put("/api/flashcards/" + flashCard.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        assertUnchanged(flashCard, category);
    }

    @Test
    void updateShouldReturn400WhenIdIsNotUuid() throws Exception {
        Category category = saveCategory("Général");

        mockMvc.perform(put("/api/flashcards/abc")
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateBody("titre", "résumé", "contenu", "model", 5, category.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void updateShouldReturn404WhenFlashCardNotFound() throws Exception {
        Category category = saveCategory("Général");
        UUID unknownId = UUID.randomUUID();

        mockMvc.perform(put("/api/flashcards/" + unknownId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateBody("titre", "résumé", "contenu", "model", 5, category.getId())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value(containsString(unknownId.toString())));

        assertThat(flashCardRepository.count()).isZero();
    }

    @Test
    void updateShouldReturn404AndNotModifyCardWhenCategoryNotFound() throws Exception {
        Category category = saveCategory("Général");
        FlashCard flashCard = saveCard(category);

        mockMvc.perform(put("/api/flashcards/" + flashCard.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateBody("titre modifié", "résumé", "contenu modifié", "model", 5, UUID.randomUUID())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").exists());

        assertUnchanged(flashCard, category);
    }

    private Category saveCategory(String name) {
        Category category = new Category();
        category.setName(name);
        return categoryRepository.save(category);
    }

    private FlashCard saveCard(Category category) {
        FlashCard flashCard = new FlashCard();
        flashCard.setTitle("titre initial");
        flashCard.setSummary("résumé initial");
        flashCard.setContent("contenu initial");
        flashCard.setModel("model initial");
        flashCard.setEstimatedTime(10);
        flashCard.setCategory(category);
        return flashCardRepository.save(flashCard);
    }

    private void assertUnchanged(FlashCard original, Category category) {
        FlashCard current = flashCardRepository.findById(original.getId()).orElseThrow();
        assertThat(current.getTitle()).isEqualTo("titre initial");
        assertThat(current.getSummary()).isEqualTo("résumé initial");
        assertThat(current.getContent()).isEqualTo("contenu initial");
        assertThat(current.getModel()).isEqualTo("model initial");
        assertThat(current.getEstimatedTime()).isEqualTo(10);
        assertThat(current.getCategory().getId()).isEqualTo(category.getId());
    }

    private String updateBody(String title, String summary, String content, String model, Integer estimatedTime,
            UUID categoryId) {
        List<String> fields = new ArrayList<>();
        if (title != null) {
            fields.add("\"title\":\"" + title + "\"");
        }
        if (summary != null) {
            fields.add("\"summary\":\"" + summary + "\"");
        }
        if (content != null) {
            fields.add("\"content\":\"" + content + "\"");
        }
        if (model != null) {
            fields.add("\"model\":\"" + model + "\"");
        }
        if (estimatedTime != null) {
            fields.add("\"estimatedTime\":" + estimatedTime);
        }
        if (categoryId != null) {
            fields.add("\"categoryId\":\"" + categoryId + "\"");
        }
        return "{" + String.join(",", fields) + "}";
    }

}
