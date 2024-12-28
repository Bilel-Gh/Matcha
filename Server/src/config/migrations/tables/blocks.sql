CREATE TABLE "blocks" (
  "id" integer PRIMARY KEY,
  "blocker_id" integer NOT NULL,
  "blocked_id" integer NOT NULL,
  "created_at" timestamp DEFAULT (now())
);