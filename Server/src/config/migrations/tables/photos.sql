CREATE TABLE "photos" (
  "id" SERIAL PRIMARY KEY,
  "user_id" integer NOT NULL,
  "filename" varchar(255) NOT NULL,
  "url" varchar(500) NOT NULL,
  "is_profile" boolean DEFAULT false,
  "created_at" timestamp DEFAULT (now())
);
