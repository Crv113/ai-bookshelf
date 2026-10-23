# Variables de .env (APP_PORT…) si le fichier existe ; docker compose le lit aussi de lui-même
-include .env
APP_PORT ?= 8737
APP_URL := http://ai-bookshelf.localhost:$(APP_PORT)
BACKUP_FILE = backups/ai-bookshelf-$(shell date +%Y%m%d-%H%M%S).sql
COMPOSE := docker compose
DEV_COMPOSE := docker compose -f compose.dev.yaml
PROD_VOLUME := ai-bookshelf_db-data

# $(call psql,<commande compose>,<options psql>) : exécute psql dans le conteneur db avec ses identifiants
psql = $(1) exec -T db sh -c 'psql -q -v ON_ERROR_STOP=1 -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" $(2)'
# Nombre de fiches, 0 si la table n'existe pas encore
COUNT_CARDS_SQL := select case when to_regclass('public.flash_card') is null then 0 else (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.flash_card', false, true, '')))[1]::text::int end
# $(call reset_and_load,<commande compose>,<fichier>) : vide la base puis charge une sauvegarde
reset_and_load = $(call psql,$(1),-c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;") && $(call psql,$(1)) < "$(2)"

.DEFAULT_GOAL := help
.PHONY: help up down restart logs ps backup restore dev dev-restore test check-docker check-dev

help: ## Affiche cette aide
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F ':.*## ' '{printf "  make %-12s %s\n", $$1, $$2}'

up: check-docker ## Installe, démarre ou met à jour l'application (sauvegarde la base avant une mise à jour)
	@if docker volume inspect $(PROD_VOLUME) >/dev/null 2>&1; then $(MAKE) --no-print-directory backup; fi
	$(COMPOSE) up -d --build --wait
	@echo ""
	@echo "AI Bookshelf est disponible sur $(APP_URL)"
	@echo "(si le navigateur ne résout pas cette adresse : http://localhost:$(APP_PORT))"

down: check-docker ## Arrête l'application (les données sont conservées)
	$(COMPOSE) down

restart: check-docker ## Redémarre l'application
	$(COMPOSE) restart

logs: check-docker ## Affiche les logs de l'application en continu
	$(COMPOSE) logs -f app

ps: check-docker ## État des conteneurs
	$(COMPOSE) ps

backup: check-docker ## Sauvegarde la base dans backups/
	@mkdir -p backups
	@$(COMPOSE) up -d --wait db
	@file=$(BACKUP_FILE); \
	$(COMPOSE) exec -T db sh -c 'pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" --no-owner --no-privileges' > $$file \
		&& echo "Sauvegarde créée : $$file" || { rm -f $$file; echo "Échec de la sauvegarde."; exit 1; }

restore: check-docker ## Restaure une sauvegarde : make restore FILE=backups/xxx.sql (écrase la base)
	@test -n "$(FILE)" || { echo "Usage : make restore FILE=backups/ai-bookshelf-AAAAMMJJ-HHMMSS.sql"; exit 1; }
	@test -f "$(FILE)" || { echo "Fichier introuvable : $(FILE)"; exit 1; }
	@if [ "$(YES)" != "1" ]; then \
		printf "⚠️  Toutes les données actuelles de l'application seront remplacées par $(FILE) et ne pourront pas être récupérées.\nPense à lancer 'make backup' avant si besoin. Continuer ? [o/N] "; \
		read answer; [ "$$answer" = "o" ] || [ "$$answer" = "O" ] || { echo "Restauration annulée."; exit 1; }; \
	fi
	@$(COMPOSE) up -d --wait db
	@$(COMPOSE) stop app
	@$(call reset_and_load,$(COMPOSE),$(FILE))
	@$(COMPOSE) up -d --wait app
	@echo "Sauvegarde $(FILE) restaurée."

dev: check-docker check-dev ## Mode dev : back (8081) + front Vite (5737), sur une copie de la base de l'application
	@$(DEV_COMPOSE) up -d --wait db
	@if [ "$$(echo "$(COUNT_CARDS_SQL)" | $(call psql,$(DEV_COMPOSE),-At))" = "0" ]; then \
		echo "Base de dev vide : copie de la base de l'application…"; $(MAKE) --no-print-directory dev-restore YES=1; \
	fi
	@trap 'kill 0' INT TERM EXIT; \
	(cd backend && ./mvnw -q spring-boot:run) & \
	(cd frontend && npm install --silent && npm run dev) & \
	wait

dev-restore: check-docker ## Remplace la base de dev par une copie à jour de la base de l'application (ou FILE=…)
	@if [ "$(YES)" != "1" ]; then \
		printf "Les données de la base de dev seront remplacées (la base de l'application n'est pas modifiée). Continuer ? [o/N] "; \
		read answer; [ "$$answer" = "o" ] || [ "$$answer" = "O" ] || { echo "Annulé."; exit 1; }; \
	fi
	@if [ -z "$(FILE)" ] && docker volume inspect $(PROD_VOLUME) >/dev/null 2>&1; then $(MAKE) --no-print-directory backup; fi
	@file="$(or $(FILE),$$(ls -t backups/*.sql 2>/dev/null | head -1))"; \
	if [ -z "$$file" ]; then echo "Aucune sauvegarde disponible : la base de dev reste vide."; exit 0; fi; \
	$(DEV_COMPOSE) up -d --wait db && $(call reset_and_load,$(DEV_COMPOSE),$$file) && echo "Base de dev chargée depuis $$file"

test: check-dev ## Lance les tests back (Docker requis pour Testcontainers) et front
	cd backend && ./mvnw test
	cd frontend && npm install --silent && npm test

check-docker:
	@docker info >/dev/null 2>&1 || { echo "Docker n'est pas lancé ou pas installé : démarre Docker puis relance la commande."; exit 1; }

check-dev:
	@java -version 2>&1 | grep -qE 'version "(2[1-9]|[3-9][0-9])' || { echo "Le mode dev nécessite Java 21 ou plus."; exit 1; }
	@node -e 'process.exit(+process.versions.node.split(".")[0] >= 20 ? 0 : 1)' 2>/dev/null || { echo "Le mode dev nécessite Node 20 ou plus (avec nvm : 'nvm use' à la racine du projet)."; exit 1; }
