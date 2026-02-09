CREATE TABLE "user" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"nickname" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_nickname_unique" UNIQUE("nickname"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
