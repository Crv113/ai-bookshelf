# ai-bookshelf

Application de fiches de révision (flashcards) générées à partir de résumés de conversations avec une IA. Le contenu des flashcards est en Markdown.

## Stack

- **Java 21** / **Spring Boot 4.1**
- **PostgreSQL** (via Docker Compose)
- **Spring Data JPA** + **Hibernate**
- **Lombok**
- **Bean Validation** (`spring-boot-starter-validation`)
- **Testcontainers** pour les tests d'intégration

## DTOs

- `FlashCardCreateDTO` — payload de création/mise à jour
- `FlashCardResponseDTO` — réponse complète (tous les champs)
- `FlashCardSummaryDTO` — réponse allégée pour la liste
- `ErrorResponseDTO` — format standard des erreurs API

## Conventions

- Les IDs sont des UUID
- L'auditing JPA est activé (`@EnableJpaAuditing`)
- La validation est faite via `@Valid` dans les controllers et les annotations Bean Validation sur les DTOs/entités
- Les erreurs sont centralisées dans `GlobalExceptionHandler`
