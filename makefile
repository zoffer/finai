.PHONY: drizzle-push
drizzle-push:
	$(shell grep -v '^#' .env.dev | xargs) npx drizzle-kit push --verbose