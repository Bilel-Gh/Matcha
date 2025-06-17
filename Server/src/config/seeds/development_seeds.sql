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
            birth_date,
            email_verified,
            is_online
        ) VALUES (
            1,
            'admin@matcha.com',
            'admin',
            'Admin',
            'Matcha',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m', -- mot de passe: admin123
            'male',
            'female',
            'Compte administrateur permanent pour les tests.',
            48.8566,
            2.3522,
            '1990-01-01',
            true,
            false
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
            birth_date,
            email_verified,
            is_online
        ) VALUES (
            2,
            'john@test.com',
            'john_doe',
            'John',
            'Doe',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m', -- mot de passe: admin123
            'male',
            'female',
            'Je suis John, 25 ans, passionné de sport et de voyages.',
            48.8566,
            2.3522,
            '1998-05-15',
            true,
            false
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
            birth_date,
            email_verified,
            is_online
        ) VALUES (
            3,
            'jane@test.com',
            'jane_doe',
            'Jane',
            'Doe',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m', -- mot de passe: admin123
            'female',
            'male',
            'Salut, je suis Jane, 23 ans, j''adore la photo et la cuisine.',
            48.8534,
            2.3488,
            '2000-08-20',
            true,
            false
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
        WHERE u.username = 'admin' AND i.tag IN ('sport', 'travel', 'cooking', 'photography');

        INSERT INTO user_interests (user_id, interest_id)
        SELECT u.id, i.id
        FROM users u, interests i
        WHERE u.username = 'john_doe' AND i.tag IN ('sport', 'travel');

        INSERT INTO user_interests (user_id, interest_id)
        SELECT u.id, i.id
        FROM users u, interests i
        WHERE u.username = 'jane_doe' AND i.tag IN ('cooking', 'photography');

        -- Fix de la séquence pour éviter les conflits d'ID
        PERFORM setval('users_id_seq', (SELECT MAX(id) FROM users));
        PERFORM setval('interests_id_seq', (SELECT MAX(id) FROM interests));

        RAISE NOTICE 'Utilisateurs de test créés avec succès !';
    ELSE
        -- Fix de la séquence même si les utilisateurs existent déjà
        PERFORM setval('users_id_seq', (SELECT MAX(id) FROM users));
        PERFORM setval('interests_id_seq', (SELECT MAX(id) FROM interests));
        RAISE NOTICE 'Les utilisateurs de test existent déjà.';
    END IF;
END $$;

COMMIT;
