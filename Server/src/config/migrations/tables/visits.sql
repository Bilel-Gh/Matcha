CREATE TABLE "visits" (
  "id" integer PRIMARY KEY,
  "visitor_id" integer NOT NULL,
  "visited_id" integer NOT NULL,
  "visit_date" timestamp DEFAULT (now())
);