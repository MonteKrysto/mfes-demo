COMPOSE ?= docker compose
DEV_COMPOSE ?= docker compose -f docker-compose.yml -f docker-compose.dev.yml
SERVICE ?= azurite

.PHONY: help build pull up down restart ps logs logs-follow ports clean dev-build dev-up dev-down dev-ps dev-logs dev-logs-follow azurite-up azurite-down azurite-logs azurite-restart publish-dev fake-ci-frodos-franks fake-ci-frodos-franks-backend fake-ci-frodos-franks-frontend fake-ci-boromirs-burgers fake-ci-boromirs-burgers-backend fake-ci-boromirs-burgers-frontend fake-ci-shire-sides fake-ci-shire-sides-backend fake-ci-shire-sides-frontend fake-ci-gondor-sauces fake-ci-gondor-sauces-backend fake-ci-gondor-sauces-frontend

help:
	@printf "Container targets:\n"
	@printf "  make pull             Pull container images\n"
	@printf "  make build            Build local development images\n"
	@printf "  make up               Start all containers in docker-compose.yml\n"
	@printf "  make down             Stop and remove containers\n"
	@printf "  make restart          Restart all containers\n"
	@printf "  make ps               Show container status\n"
	@printf "  make logs             Show recent logs for all containers\n"
	@printf "  make logs-follow      Follow logs for all containers\n"
	@printf "  make ports            Show local listeners used by the demo\n"
	@printf "  make clean            Stop containers and remove volumes\n"
	@printf "\nHot-reload development targets:\n"
	@printf "  make dev-build        Build images for bind-mounted dev mode\n"
	@printf "  make dev-up           Start bind-mounted hot-reload dev stack\n"
	@printf "  make dev-down         Stop bind-mounted hot-reload dev stack\n"
	@printf "  make dev-ps           Show bind-mounted dev stack status\n"
	@printf "  make dev-logs         Show recent bind-mounted dev logs\n"
	@printf "  make dev-logs-follow  Follow bind-mounted dev logs\n"
	@printf "\nFake CI targets:\n"
	@printf "  make publish-dev      Publish and promote all remotes to dev using host pnpm\n"
	@printf "  make fake-ci-*        Publish release bundles only; assign environments in the deployment UI\n"
	@printf "  make fake-ci-frodos-franks\n"
	@printf "  make fake-ci-frodos-franks-backend\n"
	@printf "  make fake-ci-frodos-franks-frontend\n"
	@printf "  make fake-ci-boromirs-burgers\n"
	@printf "  make fake-ci-boromirs-burgers-backend\n"
	@printf "  make fake-ci-boromirs-burgers-frontend\n"
	@printf "  make fake-ci-shire-sides\n"
	@printf "  make fake-ci-shire-sides-backend\n"
	@printf "  make fake-ci-shire-sides-frontend\n"
	@printf "  make fake-ci-gondor-sauces\n"
	@printf "  make fake-ci-gondor-sauces-backend\n"
	@printf "  make fake-ci-gondor-sauces-frontend\n"
	@printf "\nAzurite aliases:\n"
	@printf "  make azurite-up       Start Azurite only\n"
	@printf "  make azurite-down     Stop the stack\n"
	@printf "  make azurite-logs     Follow Azurite logs\n"
	@printf "  make azurite-restart  Restart Azurite only\n"

pull:
	$(COMPOSE) pull

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs --tail=200

logs-follow:
	$(COMPOSE) logs -f

ports:
	lsof -nP -iTCP:5050,5173,5174,5175,5176,5177,5178,5183,5184,5185,6073,6074,6075,6077,6078 -sTCP:LISTEN

clean:
	$(COMPOSE) down -v

dev-build:
	$(DEV_COMPOSE) build

dev-up:
	$(DEV_COMPOSE) up -d

dev-down:
	$(DEV_COMPOSE) down

dev-ps:
	$(DEV_COMPOSE) ps

dev-logs:
	$(DEV_COMPOSE) logs --tail=200

dev-logs-follow:
	$(DEV_COMPOSE) logs -f

azurite-up:
	$(COMPOSE) up -d $(SERVICE)

azurite-down: down

azurite-logs:
	$(COMPOSE) logs -f $(SERVICE)

azurite-restart:
	$(COMPOSE) restart $(SERVICE)

publish-dev:
	pnpm publish:frodos-franks
	pnpm publish:boromirs-burgers
	pnpm publish:shire-sides
	pnpm publish:gondor-sauces
	curl -sS -X POST http://localhost:5050/api/promote -H 'content-type: application/json' -d '{"remoteId":"frodos-franks","toEnvironment":"dev"}'
	curl -sS -X POST http://localhost:5050/api/promote -H 'content-type: application/json' -d '{"remoteId":"boromirs-burgers","toEnvironment":"dev"}'
	curl -sS -X POST http://localhost:5050/api/promote -H 'content-type: application/json' -d '{"remoteId":"shire-sides","toEnvironment":"dev"}'
	curl -sS -X POST http://localhost:5050/api/promote -H 'content-type: application/json' -d '{"remoteId":"gondor-sauces","toEnvironment":"dev"}'

fake-ci-frodos-franks:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote frodos-franks

fake-ci-frodos-franks-backend:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote frodos-franks --frontend-current

fake-ci-frodos-franks-frontend:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote frodos-franks --backend-current

fake-ci-boromirs-burgers:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote boromirs-burgers

fake-ci-boromirs-burgers-backend:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote boromirs-burgers --frontend-current

fake-ci-boromirs-burgers-frontend:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote boromirs-burgers --backend-current

fake-ci-shire-sides:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote franks-sides

fake-ci-shire-sides-backend:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote franks-sides --frontend-current

fake-ci-shire-sides-frontend:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote franks-sides --backend-current

fake-ci-gondor-sauces:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote burgers-sauces

fake-ci-gondor-sauces-backend:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote burgers-sauces --frontend-current

fake-ci-gondor-sauces-frontend:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote burgers-sauces --backend-current
