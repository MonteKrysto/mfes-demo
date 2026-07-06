COMPOSE ?= docker compose
DEV_COMPOSE ?= docker compose -f docker-compose.yml -f docker-compose.dev.yml
SERVICE ?= azurite
LOCAL_REGISTRY ?= localhost:5001
REGISTRY_IMAGE_PREFIX ?= $(LOCAL_REGISTRY)/mfes-demo
ifndef BUILD_VERSION
BUILD_VERSION := $(shell date -u +%Y%m%dT%H%M%SZ-local-dev)
endif

.PHONY: help build pull up down restart ps logs logs-follow ports clean dev-build dev-up dev-down dev-ps dev-logs dev-logs-follow preview-build preview-up preview-ps preview-logs preview-logs-follow azurite-up azurite-down azurite-logs azurite-restart registry-up registry-logs registry-catalog publish-dev publish-backend-image fake-ci-frodos-franks fake-ci-frodos-franks-backend fake-ci-frodos-franks-frontend fake-ci-boromirs-burgers fake-ci-boromirs-burgers-backend fake-ci-boromirs-burgers-frontend fake-ci-shire-sides fake-ci-shire-sides-backend fake-ci-shire-sides-frontend fake-ci-gondor-sauces fake-ci-gondor-sauces-backend fake-ci-gondor-sauces-frontend

help:
	@printf "Container targets:\n"
	@printf "  make pull             Pull container images\n"
	@printf "  make build            Build hot-reload development images\n"
	@printf "  make up               Start bind-mounted hot-reload dev stack\n"
	@printf "  make down             Stop and remove containers\n"
	@printf "  make restart          Restart all containers\n"
	@printf "  make ps               Show container status\n"
	@printf "  make logs             Show recent logs for all containers\n"
	@printf "  make logs-follow      Follow logs for all containers\n"
	@printf "  make ports            Show local listeners used by the demo\n"
	@printf "  make clean            Stop containers and remove volumes\n"
	@printf "\nDevelopment aliases:\n"
	@printf "  make dev-build        Alias for make build\n"
	@printf "  make dev-up           Alias for make up\n"
	@printf "  make dev-down         Stop bind-mounted hot-reload dev stack\n"
	@printf "  make dev-ps           Show bind-mounted dev stack status\n"
	@printf "  make dev-logs         Show recent bind-mounted dev logs\n"
	@printf "  make dev-logs-follow  Follow bind-mounted dev logs\n"
	@printf "\nPreview targets:\n"
	@printf "  make preview-build    Build production-preview containers\n"
	@printf "  make preview-up       Start production-preview containers without source mounts\n"
	@printf "  make preview-ps       Show production-preview container status\n"
	@printf "  make preview-logs     Show recent production-preview logs\n"
	@printf "  make preview-logs-follow Follow production-preview logs\n"
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
	@printf "\nLocal registry aliases:\n"
	@printf "  make registry-up      Start the local Docker registry\n"
	@printf "  make registry-logs    Follow registry logs\n"
	@printf "  make registry-catalog List repositories in the local registry\n"

pull:
	$(COMPOSE) pull

build:
	$(DEV_COMPOSE) build

up:
	$(DEV_COMPOSE) up -d

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

ps:
	$(DEV_COMPOSE) ps

logs:
	$(DEV_COMPOSE) logs --tail=200

logs-follow:
	$(DEV_COMPOSE) logs -f

ports:
	lsof -nP -iTCP:5001,5050,5173,5174,5175,5176,5177,5178,5183,5184,5185,6073,6074,6075,6077,6078 -sTCP:LISTEN

clean:
	$(COMPOSE) down -v

dev-build:
	$(MAKE) build

dev-up:
	$(MAKE) up

dev-down:
	$(DEV_COMPOSE) down

dev-ps:
	$(DEV_COMPOSE) ps

dev-logs:
	$(DEV_COMPOSE) logs --tail=200

dev-logs-follow:
	$(DEV_COMPOSE) logs -f

preview-build:
	$(COMPOSE) build

preview-up:
	$(COMPOSE) up -d

preview-ps:
	$(COMPOSE) ps

preview-logs:
	$(COMPOSE) logs --tail=200

preview-logs-follow:
	$(COMPOSE) logs -f

azurite-up:
	$(COMPOSE) up -d $(SERVICE)

azurite-down: down

azurite-logs:
	$(COMPOSE) logs -f $(SERVICE)

azurite-restart:
	$(COMPOSE) restart $(SERVICE)

registry-up:
	$(COMPOSE) up -d registry

registry-logs:
	$(COMPOSE) logs -f registry

registry-catalog:
	curl -sS http://$(LOCAL_REGISTRY)/v2/_catalog

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
	$(MAKE) publish-backend-image PACKAGE_NAME=frodos-franks IMAGE_NAME=frodos-franks-api BUILD_VERSION=$(BUILD_VERSION)
	$(DEV_COMPOSE) exec -T -e BUILD_VERSION=$(BUILD_VERSION) -e BACKEND_IMAGE=$(REGISTRY_IMAGE_PREFIX)/frodos-franks-api:$(BUILD_VERSION) -e BACKEND_IMAGE_DIGEST=$$(docker inspect --format='{{index .RepoDigests 0}}' $(REGISTRY_IMAGE_PREFIX)/frodos-franks-api:$(BUILD_VERSION) 2>/dev/null | sed 's/^.*@//') deployment-api pnpm --filter deployment publish:remote frodos-franks

fake-ci-frodos-franks-backend:
	$(MAKE) publish-backend-image PACKAGE_NAME=frodos-franks IMAGE_NAME=frodos-franks-api BUILD_VERSION=$(BUILD_VERSION)
	$(DEV_COMPOSE) exec -T -e BUILD_VERSION=$(BUILD_VERSION) -e BACKEND_IMAGE=$(REGISTRY_IMAGE_PREFIX)/frodos-franks-api:$(BUILD_VERSION) -e BACKEND_IMAGE_DIGEST=$$(docker inspect --format='{{index .RepoDigests 0}}' $(REGISTRY_IMAGE_PREFIX)/frodos-franks-api:$(BUILD_VERSION) 2>/dev/null | sed 's/^.*@//') deployment-api pnpm --filter deployment publish:remote frodos-franks --frontend-current

fake-ci-frodos-franks-frontend:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote frodos-franks --backend-current

fake-ci-boromirs-burgers:
	$(MAKE) publish-backend-image PACKAGE_NAME=boromirs-burgers IMAGE_NAME=boromirs-burgers-api BUILD_VERSION=$(BUILD_VERSION)
	$(DEV_COMPOSE) exec -T -e BUILD_VERSION=$(BUILD_VERSION) -e BACKEND_IMAGE=$(REGISTRY_IMAGE_PREFIX)/boromirs-burgers-api:$(BUILD_VERSION) -e BACKEND_IMAGE_DIGEST=$$(docker inspect --format='{{index .RepoDigests 0}}' $(REGISTRY_IMAGE_PREFIX)/boromirs-burgers-api:$(BUILD_VERSION) 2>/dev/null | sed 's/^.*@//') deployment-api pnpm --filter deployment publish:remote boromirs-burgers

fake-ci-boromirs-burgers-backend:
	$(MAKE) publish-backend-image PACKAGE_NAME=boromirs-burgers IMAGE_NAME=boromirs-burgers-api BUILD_VERSION=$(BUILD_VERSION)
	$(DEV_COMPOSE) exec -T -e BUILD_VERSION=$(BUILD_VERSION) -e BACKEND_IMAGE=$(REGISTRY_IMAGE_PREFIX)/boromirs-burgers-api:$(BUILD_VERSION) -e BACKEND_IMAGE_DIGEST=$$(docker inspect --format='{{index .RepoDigests 0}}' $(REGISTRY_IMAGE_PREFIX)/boromirs-burgers-api:$(BUILD_VERSION) 2>/dev/null | sed 's/^.*@//') deployment-api pnpm --filter deployment publish:remote boromirs-burgers --frontend-current

fake-ci-boromirs-burgers-frontend:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote boromirs-burgers --backend-current

fake-ci-shire-sides:
	$(MAKE) publish-backend-image PACKAGE_NAME=franks-sides IMAGE_NAME=shire-sides-api BUILD_VERSION=$(BUILD_VERSION)
	$(DEV_COMPOSE) exec -T -e BUILD_VERSION=$(BUILD_VERSION) -e BACKEND_IMAGE=$(REGISTRY_IMAGE_PREFIX)/shire-sides-api:$(BUILD_VERSION) -e BACKEND_IMAGE_DIGEST=$$(docker inspect --format='{{index .RepoDigests 0}}' $(REGISTRY_IMAGE_PREFIX)/shire-sides-api:$(BUILD_VERSION) 2>/dev/null | sed 's/^.*@//') deployment-api pnpm --filter deployment publish:remote franks-sides

fake-ci-shire-sides-backend:
	$(MAKE) publish-backend-image PACKAGE_NAME=franks-sides IMAGE_NAME=shire-sides-api BUILD_VERSION=$(BUILD_VERSION)
	$(DEV_COMPOSE) exec -T -e BUILD_VERSION=$(BUILD_VERSION) -e BACKEND_IMAGE=$(REGISTRY_IMAGE_PREFIX)/shire-sides-api:$(BUILD_VERSION) -e BACKEND_IMAGE_DIGEST=$$(docker inspect --format='{{index .RepoDigests 0}}' $(REGISTRY_IMAGE_PREFIX)/shire-sides-api:$(BUILD_VERSION) 2>/dev/null | sed 's/^.*@//') deployment-api pnpm --filter deployment publish:remote franks-sides --frontend-current

fake-ci-shire-sides-frontend:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote franks-sides --backend-current

fake-ci-gondor-sauces:
	$(MAKE) publish-backend-image PACKAGE_NAME=burgers-sauces IMAGE_NAME=gondor-sauces-api BUILD_VERSION=$(BUILD_VERSION)
	$(DEV_COMPOSE) exec -T -e BUILD_VERSION=$(BUILD_VERSION) -e BACKEND_IMAGE=$(REGISTRY_IMAGE_PREFIX)/gondor-sauces-api:$(BUILD_VERSION) -e BACKEND_IMAGE_DIGEST=$$(docker inspect --format='{{index .RepoDigests 0}}' $(REGISTRY_IMAGE_PREFIX)/gondor-sauces-api:$(BUILD_VERSION) 2>/dev/null | sed 's/^.*@//') deployment-api pnpm --filter deployment publish:remote burgers-sauces

fake-ci-gondor-sauces-backend:
	$(MAKE) publish-backend-image PACKAGE_NAME=burgers-sauces IMAGE_NAME=gondor-sauces-api BUILD_VERSION=$(BUILD_VERSION)
	$(DEV_COMPOSE) exec -T -e BUILD_VERSION=$(BUILD_VERSION) -e BACKEND_IMAGE=$(REGISTRY_IMAGE_PREFIX)/gondor-sauces-api:$(BUILD_VERSION) -e BACKEND_IMAGE_DIGEST=$$(docker inspect --format='{{index .RepoDigests 0}}' $(REGISTRY_IMAGE_PREFIX)/gondor-sauces-api:$(BUILD_VERSION) 2>/dev/null | sed 's/^.*@//') deployment-api pnpm --filter deployment publish:remote burgers-sauces --frontend-current

fake-ci-gondor-sauces-frontend:
	$(DEV_COMPOSE) exec -T deployment-api pnpm --filter deployment publish:remote burgers-sauces --backend-current

publish-backend-image:
	$(COMPOSE) up -d registry
	docker build -f Dockerfile.backend --build-arg PACKAGE_NAME=$(PACKAGE_NAME) -t $(REGISTRY_IMAGE_PREFIX)/$(IMAGE_NAME):$(BUILD_VERSION) .
	docker push $(REGISTRY_IMAGE_PREFIX)/$(IMAGE_NAME):$(BUILD_VERSION)
