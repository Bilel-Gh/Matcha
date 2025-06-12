CREATE TABLE "messages" (
"id" SERIAL PRIMARY KEY,
"sender_id" integer NOT NULL,
"receiver_id" integer NOT NULL,
"content" text NOT NULL,
"is_read" boolean DEFAULT false,
"sent_at" timestamp DEFAULT (now())
);
