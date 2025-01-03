-- development_seeds.sql

-- Bloc de transaction pour s'assurer que tout est exécuté ou rien
BEGIN;

-- Vérifie d'abord si les utilisateurs existent déjà pour éviter les doublons
DO $$
BEGIN
    -- On vérifie si on a déjà des utilisateurs de test
    IF NOT EXISTS (SELECT 1 FROM users WHERE email IN ('john@test.com', 'jane@test.com')) THEN
        -- Création du premier utilisateur
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
            'john@test.com',
            'john_doe',
            'John',
            'Doe',
            '12345',
            'male',
            'female',
            'Je suis John, 25 ans, passionné de sport et de voyages.',
            48.8566,
            2.3522,
            '1998-05-15',
            true,
            false
        );

        -- Création du deuxième utilisateur
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
            'jane@test.com',
            'jane_doe',
            'Jane',
            'Doe',
            '12345',
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
            (4, 'Photographie', 'photography');

        -- Association des intérêts aux utilisateurs
        INSERT INTO user_interests (user_id, interest_id)
        SELECT u.id, i.id
        FROM users u, interests i
        WHERE u.username = 'john_doe' AND i.tag IN ('sport', 'travel');

        INSERT INTO user_interests (user_id, interest_id)
        SELECT u.id, i.id
        FROM users u, interests i
        WHERE u.username = 'jane_doe' AND i.tag IN ('cooking', 'photography');

        RAISE NOTICE 'Utilisateurs de test créés avec succès !';
    ELSE
        RAISE NOTICE 'Les utilisateurs de test existent déjà.';
    END IF;
END $$;

COMMIT;