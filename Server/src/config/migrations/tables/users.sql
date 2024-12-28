CREATE TABLE "users" (
 "id" integer PRIMARY KEY,
 "email" varchar UNIQUE NOT NULL,
 "username" varchar UNIQUE NOT NULL,
 "firstname" varchar NOT NULL,
 "lastname" varchar NOT NULL,
 "password" varchar NOT NULL,
 "gender" varchar,
 "sexual_preferences" varchar,
 "biography" text,
 "latitude" float,
 "longitude" float,
 "fame_rating" integer DEFAULT 0,
 "last_connection" timestamp,
 "is_online" boolean DEFAULT false,
 "email_verified" boolean DEFAULT false,
 "birth_date" date NOT NULL,
 "created_at" timestamp DEFAULT (now())
);