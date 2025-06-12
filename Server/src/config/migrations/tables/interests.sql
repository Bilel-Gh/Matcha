CREATE TABLE "interests" (
 "id" SERIAL PRIMARY KEY,
 "name" varchar UNIQUE NOT NULL,
 "tag" varchar UNIQUE NOT NULL
);

CREATE TABLE "user_interests" (
    "user_id" integer NOT NULL,
    "interest_id" integer NOT NULL,
    "created_at" timestamp DEFAULT (now()),
    PRIMARY KEY ("user_id", "interest_id")
);
