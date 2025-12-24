ALTER TABLE "stock_dynamic_data" ALTER COLUMN "price" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "stock_dynamic_data" ALTER COLUMN "open" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "stock_dynamic_data" ALTER COLUMN "high" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "stock_dynamic_data" ALTER COLUMN "low" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "stock_dynamic_data" ALTER COLUMN "volume" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "stock_dynamic_data" ALTER COLUMN "turnover" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "stock_dynamic_data" ADD COLUMN "change" numeric DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_dynamic_data" ADD COLUMN "change_percent" numeric DEFAULT 0 NOT NULL;