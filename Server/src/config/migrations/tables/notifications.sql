CREATE TABLE "notifications" (
 "id" integer PRIMARY KEY,
 "user_id" integer NOT NULL,
 "type" varchar,
 "content" text NOT NULL,
 "is_read" boolean DEFAULT false,
 "created_at" timestamp DEFAULT (now())
);