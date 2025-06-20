-- development_seeds.sql

-- Bloc de transaction pour s'assurer que tout est exécuté ou rien
BEGIN;

-- Vérifie d'abord si les utilisateurs existent déjà pour éviter les doublons
DO $$
BEGIN
    -- On vérifie si on a déjà des utilisateurs de test
    IF NOT EXISTS (SELECT 1 FROM users WHERE email IN ('john@test.com', 'jane@test.com', 'admin@matcha.com')) THEN
        -- Création du compte permanent admin
        INSERT INTO users (
            id,
            email,
            username,
            firstname,
            lastname,
            password,
            gender,
            sexual_preferences,
            biography,
            latitude,
            longitude,
            city,
            country,
            location_source,
            birth_date,
            email_verified,
            is_online,
            profile_picture_url,
            fame_rating
        ) VALUES (
            1,
            'admin@matcha.com',
            'admin',
            'Admin',
            'Matcha',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m', -- mot de passe: admin123
            'male',
            'female',
            'Compte administrateur permanent pour les tests. J''aime la technologie et les rencontres authentiques.',
            48.8566,
            2.3522,
            'Paris',
            'France',
            'gps',
            '1990-01-01',
            true,
            false,
            '/uploads/default/ppHOMME2.jpeg',
            65
        );

        -- Création du premier utilisateur de test
        INSERT INTO users (
            id,
            email,
            username,
            firstname,
            lastname,
            password,
            gender,
            sexual_preferences,
            biography,
            latitude,
            longitude,
            city,
            country,
            location_source,
            birth_date,
            email_verified,
            is_online,
            profile_picture_url,
            fame_rating
        ) VALUES (
            2,
            'john@test.com',
            'john_doe',
            'John',
            'Doe',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m', -- mot de passe: admin123
            'male',
            'female',
            'Je suis John, 25 ans, passionné de sport et de voyages. J''adore découvrir de nouveaux endroits et rencontrer des personnes intéressantes.',
            48.8566,
            2.3522,
            'Paris',
            'France',
            'gps',
            '1998-05-15',
            true,
            false,
            '/uploads/default/ppHOMME.jpeg',
            72
        );

        -- Création du deuxième utilisateur de test
        INSERT INTO users (
            id,
            email,
            username,
            firstname,
            lastname,
            password,
            gender,
            sexual_preferences,
            biography,
            latitude,
            longitude,
            city,
            country,
            location_source,
            birth_date,
            email_verified,
            is_online,
            profile_picture_url,
            fame_rating
        ) VALUES (
            3,
            'jane@test.com',
            'jane_doe',
            'Jane',
            'Doe',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m', -- mot de passe: admin123
            'female',
            'male',
            'Salut, je suis Jane, 23 ans, j''adore la photo et la cuisine. Toujours à la recherche de nouvelles expériences culinaires et artistiques.',
            48.8534,
            2.3488,
            'Paris',
            'France',
            'gps',
            '2000-08-20',
            true,
            false,
            '/uploads/default/ppFEMME.jpg',
            78
        );

        -- Ajout de quelques intérêts de base
        INSERT INTO interests (id, name, tag) VALUES
            (1, 'Sport', 'sport'),
            (2, 'Voyage', 'travel'),
            (3, 'Cuisine', 'cooking'),
            (4, 'Photographie', 'photography'),
            (5, 'Musique', 'music'),
            (6, 'Cinéma', 'cinema'),
            (7, 'Lecture', 'reading'),
            (8, 'Art', 'art'),
            (9, 'Mode', 'fashion'),
            (10, 'Technologie', 'technology'),
            (11, 'Gaming', 'gaming'),
            (12, 'Nature', 'nature'),
            (13, 'Fitness', 'fitness'),
            (14, 'Danse', 'dance'),
            (15, 'Yoga', 'yoga'),
            (16, 'Vegan', 'vegan'),
            (17, 'Wine', 'wine'),
            (18, 'Coffee', 'coffee'),
            (19, 'Books', 'books'),
            (20, 'Movies', 'movies'),
            (21, 'Series', 'series'),
            (22, 'Rock', 'rock'),
            (23, 'Pop', 'pop'),
            (24, 'Jazz', 'jazz'),
            (25, 'Electronic', 'electronic'),
            (26, 'Anime', 'anime'),
            (27, 'Comics', 'comics'),
            (28, 'Surf', 'surfing'),
            (29, 'Ski', 'skiing'),
            (30, 'Meditation', 'meditation');

        -- Association des intérêts aux utilisateurs
        INSERT INTO user_interests (user_id, interest_id)
        SELECT u.id, i.id
        FROM users u, interests i
        WHERE u.username = 'admin' AND i.tag IN ('technology', 'travel', 'cooking', 'photography');

        INSERT INTO user_interests (user_id, interest_id)
        SELECT u.id, i.id
        FROM users u, interests i
        WHERE u.username = 'john_doe' AND i.tag IN ('sport', 'travel', 'fitness', 'music');

        INSERT INTO user_interests (user_id, interest_id)
        SELECT u.id, i.id
        FROM users u, interests i
        WHERE u.username = 'jane_doe' AND i.tag IN ('cooking', 'photography', 'art', 'yoga');

        -- Ajout de photos fictives pour les utilisateurs de test
        INSERT INTO photos (user_id, filename, url, is_profile, created_at) VALUES
            (1, 'admin_profile.jpeg', '/uploads/default/ppHOMME2.jpeg', true, NOW()),
            (1, 'admin_photo2.jpeg', '/uploads/default/ppHOMME.jpeg', false, NOW()),

            (2, 'john_profile.jpeg', '/uploads/default/ppHOMME.jpeg', true, NOW()),
            (2, 'john_sport.jpeg', '/uploads/default/ppHOMME2.jpeg', false, NOW()),
            (2, 'john_travel.jpeg', '/uploads/default/ppHOMME.jpeg', false, NOW()),

            (3, 'jane_profile.jpg', '/uploads/default/ppFEMME.jpg', true, NOW()),
            (3, 'jane_cooking.jpg', '/uploads/default/ppFEMME2.jpg', false, NOW()),
            (3, 'jane_art.jpg', '/uploads/default/ppFEMME.jpg', false, NOW());

        -- Ajout de quelques interactions de test pour démonstration
        -- John like Jane
        INSERT INTO likes (liker_id, liked_id, created_at) VALUES (2, 3, NOW() - INTERVAL '2 days');

        -- Jane like John (créé un match)
        INSERT INTO likes (liker_id, liked_id, created_at) VALUES (3, 2, NOW() - INTERVAL '1 day');

        -- Admin like John SEULEMENT (pour permettre de tester le swipe avec Jane disponible)
        INSERT INTO likes (liker_id, liked_id, created_at) VALUES (1, 2, NOW() - INTERVAL '3 hours');

        -- Quelques visites de profil
        INSERT INTO visits (visitor_id, visited_id, visit_date) VALUES
            (1, 2, NOW() - INTERVAL '1 hour'),
            (1, 3, NOW() - INTERVAL '2 hours'),
            (2, 1, NOW() - INTERVAL '3 hours'),
            (2, 3, NOW() - INTERVAL '4 hours'),
            (3, 1, NOW() - INTERVAL '5 hours'),
            (3, 2, NOW() - INTERVAL '6 hours');

        -- Fix de la séquence pour éviter les conflits d'ID
        PERFORM setval('users_id_seq', (SELECT MAX(id) FROM users));
        PERFORM setval('interests_id_seq', (SELECT MAX(id) FROM interests));
        PERFORM setval('photos_id_seq', (SELECT MAX(id) FROM photos));

        RAISE NOTICE 'Utilisateurs de test créés avec succès avec photos de profil et interactions !';
    ELSE
        -- Fix de la séquence même si les utilisateurs existent déjà
        PERFORM setval('users_id_seq', (SELECT MAX(id) FROM users));
        PERFORM setval('interests_id_seq', (SELECT MAX(id) FROM interests));
        PERFORM setval('photos_id_seq', (SELECT MAX(id) FROM photos));
        RAISE NOTICE 'Les utilisateurs de test existent déjà.';
    END IF;
END $$;

COMMIT;
