ALTER TABLE "photos" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "user_interests" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "user_interests" ADD FOREIGN KEY ("interest_id") REFERENCES "interests" ("id") ON DELETE CASCADE;

ALTER TABLE "likes" ADD FOREIGN KEY ("liker_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "likes" ADD FOREIGN KEY ("liked_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "visits" ADD FOREIGN KEY ("visitor_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "visits" ADD FOREIGN KEY ("visited_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "blocks" ADD FOREIGN KEY ("blocker_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "blocks" ADD FOREIGN KEY ("blocked_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "reports" ADD FOREIGN KEY ("reporter_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "reports" ADD FOREIGN KEY ("reported_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "messages" ADD FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "messages" ADD FOREIGN KEY ("receiver_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
