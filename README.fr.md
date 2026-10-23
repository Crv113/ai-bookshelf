[🇬🇧 English](README.md) | 🇫🇷 Français

# ai-bookshelf

AI-Bookshelf est une application open source qui transforme les conversations d'apprentissage avec une IA en fiches de révision structurées et faciles à retrouver.

J'apprends beaucoup avec des IA conversationnelles — parfois ChatGPT, parfois Claude, ou d'autres. Mais je ne relirais jamais mes conversations éparpillées entre tous les modèles que j'ai utilisés. J'ai donc créé une application pour rassembler les sujets que je veux pouvoir réviser.

## Comment ça marche ?

1. Apprends un sujet avec n'importe quelle IA conversationnelle : demande-lui un plan de cours, pose tes questions, creuse les détails.
2. Dans AI-Bookshelf, clique sur **Importer un JSON**, puis sur **Copier le prompt**, et colle ce prompt dans ta conversation. L'IA répond avec un résumé du cours au format JSON (contenu en Markdown, avec des schémas Mermaid quand c'est utile).
3. Colle le JSON dans la fenêtre d'import et choisis une catégorie : ta fiche de révision est créée.

## Fonctionnalités

- Fiches rendues depuis le Markdown, avec schémas Mermaid, classées par catégorie
- Sommaire cliquable pour les fiches longues, avec mise en évidence de la section en cours de lecture
- Édition section par section pour ajouter une précision sans réécrire toute la fiche
- Copie d'une fiche en JSON pour la faire corriger par une IA, puis remplacement par le JSON corrigé
- Prompts de quiz pour s'entraîner avec une IA : QCM d'abord, puis questions ouvertes
- Export PDF

## Installation

Le seul prérequis est [Docker](https://docs.docker.com/get-docker/) (Docker Desktop sur macOS et Windows), lancé.

```bash
git clone https://github.com/Crv113/ai-bookshelf.git
cd ai-bookshelf
make up
```

L'application est ensuite disponible sur **http://ai-bookshelf.localhost:8737** (ou http://localhost:8737 si ton navigateur ne résout pas `*.localhost`, comme Safari). Elle redémarre automatiquement avec Docker : inutile de relancer `make up` après un redémarrage de la machine.

Pour utiliser un autre port, copie `.env.example` en `.env` et modifie `APP_PORT`.

### Commandes

| Commande | Description |
|---|---|
| `make up` | Installe, démarre ou met à jour l'application (sauvegarde d'abord la base si elle existe déjà) |
| `make down` | Arrête l'application (les données sont conservées) |
| `make logs` | Affiche les logs de l'application en continu |
| `make backup` | Sauvegarde la base dans `backups/` |
| `make restore FILE=backups/xxx.sql` | Remplace la base par une sauvegarde (demande une confirmation) |
| `make dev` | Mode développement : Spring Boot (8081) + Vite (5737) avec rechargement automatique — nécessite Java 21 et Node 20+ |
| `make dev-restore` | Remplace la base de développement par une copie à jour de la base de l'application |
| `make test` | Lance les tests back et front — nécessite Java 21 et Node 20+ |

Sans `make` (par exemple sous Windows sans WSL), utilise directement Docker Compose :

```bash
docker compose up -d --build   # démarrer ou mettre à jour
docker compose down            # arrêter
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' > backup.sql
```

### Fonctionnement

- `db` : PostgreSQL 18, données stockées dans le volume Docker `ai-bookshelf_db-data`, non exposé hors de Docker.
- `app` : un seul conteneur Spring Boot qui sert à la fois l'API (`/api`) et le front React buildé, exposé uniquement sur `127.0.0.1`.
- `make dev` utilise une base de développement séparée (`compose.dev.yaml`) : il ne touche jamais à tes vraies données. Au premier lancement, elle est remplie avec une copie de la base de l'application ; `make dev-restore` rafraîchit cette copie. Le front de développement affiche un filigrane et un badge « DEV ».
