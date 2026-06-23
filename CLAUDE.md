# ai-bookshelf

Application de fiches de révision (flashcards) générées à partir de résumés de conversations avec une IA. Le contenu des flashcards est en Markdown.

## Stack

- **Java 21** / **Spring Boot 4.1**
- **PostgreSQL** (via Docker Compose)
- **Spring Data JPA** + **Hibernate**
- **Lombok**
- **Bean Validation** (`spring-boot-starter-validation`)
- **Testcontainers** pour les tests d'intégration

## Structure du projet

```
src/main/java/com/github/crv113/ai_bookshelf/
├── controllers/       # Couche HTTP — @RestController
├── services/          # Logique métier
├── repositories/      # Accès base de données — Spring Data JPA
├── entities/          # Entités JPA
├── dtos/              # Objets de transfert (create, response, summary, error)
└── exceptions/        # Gestion globale des erreurs (@ControllerAdvice)
```

## Entité principale : FlashCard

| Champ       | Type            | Détail                              |
|-------------|-----------------|-------------------------------------|
| `id`        | UUID            | Généré automatiquement              |
| `createdAt` | LocalDateTime   | Rempli automatiquement (auditing)   |
| `title`     | String          | Non vide                            |
| `summary`   | String          | Résumé court, non vide              |
| `content`   | TEXT            | Contenu Markdown, non vide          |

## API REST — `/api/flashcards`

| Méthode  | Route               | Description                        |
|----------|---------------------|------------------------------------|
| `POST`   | `/api/flashcards`   | Créer une flashcard                |
| `GET`    | `/api/flashcards`   | Lister toutes les flashcards       |
| `GET`    | `/api/flashcards/{id}` | Récupérer une flashcard par ID  |
| `PUT`    | `/api/flashcards/{id}` | Mettre à jour une flashcard     |
| `DELETE` | `/api/flashcards/{id}` | Supprimer une flashcard         |

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
