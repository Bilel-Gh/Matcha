CREATE TABLE "likes" (
 "id" integer PRIMARY KEY,
 "liker_id" integer NOT NULL,
 "liked_id" integer NOT NULL,
 "created_at" timestamp DEFAULT (now())
);