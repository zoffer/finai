CREATE TABLE "api_cache" (
	"url" text NOT NULL,
	"data" json NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_cache_url_unique" UNIQUE("url")
);
