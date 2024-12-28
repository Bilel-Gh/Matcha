-- Les index permettent une meilleur performance car il evitent de parcourir toute la bdd
-- Index UNIQUE pour empêcher les likes en double
CREATE UNIQUE INDEX ON "likes" ("liker_id", "liked_id");
-- Index UNIQUE pour empêcher les blocks en double
CREATE UNIQUE INDEX ON "blocks" ("blocker_id", "blocked_id");
-- Index simple pour la recherche géographique
CREATE INDEX users_location_idx ON users (latitude, longitude);
-- Index simple pour le tri par popularité
CREATE INDEX users_fame_rating_idx ON users (fame_rating);
-- Index pour optimiser la recherche des conversations
CREATE INDEX messages_participants_idx ON messages (sender_id, receiver_id);
-- Index pour les notifications non lues
CREATE INDEX notifications_unread_idx ON notifications (user_id, is_read);