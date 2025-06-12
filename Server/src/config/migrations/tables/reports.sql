CREATE TABLE "reports" (
"id" SERIAL PRIMARY KEY,
"reporter_id" integer NOT NULL,
"reported_id" integer NOT NULL,
"reason" text NOT NULL,
"created_at" timestamp DEFAULT (now())
);
