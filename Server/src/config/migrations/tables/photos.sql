CREATE TABLE "photos" (
  "id" integer PRIMARY KEY,
  "user_id" integer NOT NULL,
  "url" varchar NOT NULL,
  "is_profile_picture" boolean DEFAULT false,
  "created_at" timestamp DEFAULT (now())
);