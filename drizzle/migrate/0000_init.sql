CREATE TABLE "news" (
	"id" text PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_title_date_unique" UNIQUE("title","date")
);
--> statement-breakpoint
CREATE TABLE "news_effect" (
	"id" text PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"news_id" text NOT NULL,
	"keyword" text NOT NULL,
	"effect" real DEFAULT 0 NOT NULL,
	"confidence" real DEFAULT 0 NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_effect_news_id_keyword_unique" UNIQUE("news_id","keyword")
);
--> statement-breakpoint
CREATE TABLE "stock" (
	"id" text PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"exchange" text NOT NULL,
	"industry" text DEFAULT '' NOT NULL,
	"introduction" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_dynamic_data" (
	"id" text PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"stock_id" text NOT NULL,
	"price" numeric NOT NULL,
	"open" numeric NOT NULL,
	"high" numeric NOT NULL,
	"low" numeric NOT NULL,
	"volume" numeric NOT NULL,
	"turnover" numeric NOT NULL,
	"market_data_time" timestamp with time zone NOT NULL,
	"visits_24h" integer DEFAULT 0 NOT NULL,
	"heat_score" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_dynamic_data_stock_id_unique" UNIQUE("stock_id")
);
--> statement-breakpoint
CREATE TABLE "stock_keyword" (
	"id" text PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"stock_id" text NOT NULL,
	"keyword" text NOT NULL,
	"weight" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "news_effect_keyword_index" ON "news_effect" USING btree ("keyword");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_symbol_exchange_index" ON "stock" USING btree ("symbol","exchange");--> statement-breakpoint
CREATE INDEX "stock_symbol_index" ON "stock" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "stock_exchange_index" ON "stock" USING btree ("exchange");--> statement-breakpoint
CREATE INDEX "stock_name_index" ON "stock" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_keyword_stock_id_keyword_index" ON "stock_keyword" USING btree ("stock_id","keyword");--> statement-breakpoint
CREATE INDEX "stock_keyword_keyword_index" ON "stock_keyword" USING btree ("keyword");