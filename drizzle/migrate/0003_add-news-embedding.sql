CREATE TABLE "news_embedding__cloudflare_qwen3_embedding_0_6b" (
	"id" text PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"news_id" text NOT NULL,
	"embedding" vector(1024) NOT NULL,
	"norm" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_embedding__cloudflare_qwen3_embedding_0_6b_news_id_unique" UNIQUE("news_id")
);
--> statement-breakpoint
CREATE INDEX "news_embedding__cloudflare_qwen3_embedding_0_6b_embedding_index" ON "news_embedding__cloudflare_qwen3_embedding_0_6b" USING hnsw ("embedding" vector_ip_ops);