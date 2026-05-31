.DEFAULT_GOAL := help

# ---------- Docker stack (app + mongo + redis) ----------

up: ## Start the whole stack (builds the image on first run)
	docker compose up -d

rebuild: ## Rebuild after changing package.json (refreshes node_modules)
	docker compose up -d --build -V

down: ## Stop & remove containers (keeps data)
	docker compose down

reset: ## Stop & remove containers AND data volumes (wipes db data)
	docker compose down -v

restart: ## Restart just the app container
	docker compose restart app

ps: ## Show container status
	docker compose ps

logs: ## Follow the app logs
	docker compose logs -f app

logs-all: ## Follow logs from all services
	docker compose logs -f

sh: ## Open a shell inside the app container
	docker compose exec app sh

# ---------- Databases ----------

mongo: ## Open mongosh in the mongo container
	docker compose exec mongo mongosh minimart

redis: ## Open redis-cli in the redis container
	docker compose exec redis redis-cli

# ---------- Host (run without Docker) ----------

install: ## Install npm dependencies on the host
	npm install

dev: ## Run app on host with nodemon (starts mongo+redis in docker, frees port 2800)
	docker compose up -d mongo redis
	-docker compose stop app
	npm start

audit: ## Check dependency vulnerabilities
	npm audit

# ---------- Meta ----------

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

.PHONY: up rebuild down reset restart ps logs logs-all sh mongo redis install dev audit help
