CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'completed');--> statement-breakpoint
CREATE TABLE "play_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"anon_id" varchar(64),
	"puzzle_id" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"duration_ms" integer,
	"hint_count" integer DEFAULT 0 NOT NULL,
	"penalty_ms" integer DEFAULT 0 NOT NULL,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"is_ranked" boolean DEFAULT false NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "puzzles" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(32) NOT NULL,
	"date" date NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"size" integer NOT NULL,
	"black" jsonb NOT NULL,
	"entries" jsonb NOT NULL,
	"solution" jsonb NOT NULL,
	"word_hashes" jsonb NOT NULL,
	"words" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "puzzles_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(20) NOT NULL,
	"password_hash" text NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"best_streak" integer DEFAULT 0 NOT NULL,
	"last_streak_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."puzzles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_leaderboard" ON "play_sessions" USING btree ("puzzle_id","is_ranked","duration_ms");--> statement-breakpoint
CREATE INDEX "sessions_identity" ON "play_sessions" USING btree ("user_id","puzzle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "puzzles_date_difficulty" ON "puzzles" USING btree ("date","difficulty");