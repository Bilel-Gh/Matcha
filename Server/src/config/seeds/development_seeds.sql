-- development_seeds.sql - 500 Users

-- Bloc de transaction pour s'assurer que tout est exécuté ou rien
BEGIN;

-- Vérifie d'abord si les utilisateurs existent déjà pour éviter les doublons
DO $$
DECLARE
    user_counter INT := 4; -- Commence après admin, john, jane
    first_names TEXT[] := ARRAY['Lucas', 'Eva', 'Louis', 'Alice', 'Hugo', 'Chloe', 'Theo', 'Lea', 'Nathan', 'Manon', 'Enzo', 'Jade', 'Leo', 'Lina', 'Gabriel', 'Zoe', 'Raphael', 'Mila', 'Arthur', 'Inaya', 'Noa', 'Louise', 'Adam', 'Ambre', 'Paul', 'Julia', 'Victor', 'Rose', 'Sacha', 'Anna', 'Mohamed', 'Camille', 'Maxime', 'Sarah', 'Jules', 'Lola', 'Ethan', 'Romane', 'Mael', 'Juliette', 'Rayan', 'Margaux', 'Tom', 'Victoire', 'Noah', 'Margot', 'Clement', 'Capucine', 'Oscar', 'Apolline'];
    last_names TEXT[] := ARRAY['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dupont', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Muller', 'Lefevre', 'Faure', 'Andre', 'Mercier', 'Blanc', 'Guerin', 'Boyer', 'Garnier', 'Chevalier', 'Francois', 'Legrand', 'Gauthier', 'Garcia', 'Perrin', 'Robin', 'Clement', 'Morin', 'Nicolas', 'Henry', 'Roussel', 'Mathieu', 'Gautier', 'Masson'];
    cities TEXT[] := ARRAY['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Saint-Etienne', 'Toulon', 'Le Havre', 'Grenoble', 'Dijon', 'Angers', 'Nimes', 'Villeurbanne', 'Clermont-Ferrand', 'Aix-en-Provence', 'Brest', 'Tours', 'Amiens', 'Limoges', 'Annecy', 'Perpignan', 'Besancon', 'Metz'];
    latitudes FLOAT[] := ARRAY[48.8566, 45.7640, 43.2965, 43.6047, 43.7102, 47.2184, 43.6108, 48.5734, 44.8378, 50.6292, 48.1173, 49.2583, 45.4397, 43.1242, 49.4944, 45.1885, 47.3220, 47.4784, 43.8367, 45.7797, 45.7772, 43.5263, 48.3905, 47.3941, 49.8951, 45.8336, 45.8992, 42.6886, 47.2380, 49.1193];
    longitudes FLOAT[] := ARRAY[2.3522, 4.8357, 5.3698, 1.4442, 7.2619, -1.5536, 3.8767, 7.7521, -0.5792, 3.0573, -1.6778, 4.0317, 4.3872, 5.9280, 0.1079, 5.7245, 5.0415, -0.5582, 4.3601, 4.8951, 3.0870, 5.4456, -4.4860, 0.6942, 2.2957, 1.2611, 6.1296, 2.8956, 6.0240, 6.1757];
    interests_tags TEXT[] := ARRAY['sport', 'travel', 'cooking', 'photography', 'music', 'cinema', 'reading', 'art', 'fashion', 'technology', 'gaming', 'nature', 'fitness', 'dance', 'yoga', 'vegan', 'wine', 'coffee', 'books', 'movies', 'series', 'rock', 'pop', 'jazz', 'electronic', 'anime', 'comics', 'surfing', 'skiing', 'meditation'];
    bios TEXT[] := ARRAY[
        'Passionné de voyages et de nouvelles expériences, toujours prêt pour une aventure !',
        'Amatrice de cuisine et de bons petits plats, j''adore partager mes découvertes culinaires.',
        'Fan de sport et de fitness, je cherche quelqu''un qui partage ma passion pour le mouvement.',
        'Artiste dans l''âme, je trouve l''inspiration dans les petits détails du quotidien.',
        'Mélomane inconditionnel, la musique rythme ma vie et mes émotions.',
        'Cinéphile passionné, j''adore découvrir de nouveaux films et en discuter.',
        'Lecteur assidu, je m''évade dans les livres et les histoires captivantes.',
        'Photographe amateur, je capture les moments précieux de la vie.',
        'Geek assumé, j''aime la technologie et les innovations du futur.',
        'Yogi débutant, je cherche l''équilibre entre corps et esprit.',
        'Vegan convaincu, je prône un mode de vie respectueux de l''environnement.',
        'Amateur de vin et de gastronomie, j''apprécie les bonnes choses de la vie.',
        'Danseur passionné, j''exprime mes émotions à travers le mouvement.',
        'Gamer enthousiaste, je passe mes soirées à explorer des mondes virtuels.',
        'Amoureux de la nature, je me ressource en plein air.',
        'Fashionista dans l''âme, j''aime exprimer ma personnalité à travers mes tenues.',
        'Méditant régulier, je cultive la paix intérieure et la bienveillance.',
        'Surfeur des vagues et de la vie, toujours à la recherche de sensations nouvelles.',
        'Skieur passionné, les montagnes sont mon terrain de jeu favori.',
        'Coffee addict, une bonne tasse de café peut changer ma journée.'
    ];

    current_city_index INT;
    random_first_name TEXT;
    random_last_name TEXT;
    random_username TEXT;
    random_email TEXT;
    random_bio TEXT;
    random_birth_date DATE;
    random_gender TEXT;
    random_preferences TEXT;
    random_fame_rating INT;
    random_profile_pic TEXT;
    i INT;
    j INT;
    interest_count INT;
    random_interest_id INT;
BEGIN
    -- On vérifie si on a déjà des utilisateurs de test
    IF NOT EXISTS (SELECT 1 FROM users WHERE email IN ('john@test.com', 'jane@test.com', 'admin@matcha.com')) THEN

        -- Création des intérêts de base
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

        -- Création du compte permanent admin
        INSERT INTO users (
            id, email, username, firstname, lastname, password, gender, sexual_preferences,
            biography, latitude, longitude, city, country, location_source, birth_date,
            email_verified, is_online, profile_picture_url, fame_rating
        ) VALUES (
            1, 'admin@matcha.com', 'admin', 'Admin', 'Matcha',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m',
            'male', 'female',
            'Compte administrateur permanent pour les tests. J''aime la technologie et les rencontres authentiques.',
            48.8566, 2.3522, 'Paris', 'France', 'gps', '1990-01-01',
            true, false, '/uploads/default/ppHOMME2.jpeg', 65
        );

        -- Création de john_doe
        INSERT INTO users (
            id, email, username, firstname, lastname, password, gender, sexual_preferences,
            biography, latitude, longitude, city, country, location_source, birth_date,
            email_verified, is_online, profile_picture_url, fame_rating
        ) VALUES (
            2, 'john@test.com', 'john_doe', 'John', 'Doe',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m',
            'male', 'female',
            'Je suis John, 25 ans, passionné de sport et de voyages. J''adore découvrir de nouveaux endroits et rencontrer des personnes intéressantes.',
            48.8566, 2.3522, 'Paris', 'France', 'gps', '1998-05-15',
            true, false, '/uploads/default/ppHOMME.jpeg', 72
        );

        -- Création de jane_doe
        INSERT INTO users (
            id, email, username, firstname, lastname, password, gender, sexual_preferences,
            biography, latitude, longitude, city, country, location_source, birth_date,
            email_verified, is_online, profile_picture_url, fame_rating
        ) VALUES (
            3, 'jane@test.com', 'jane_doe', 'Jane', 'Doe',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m',
            'female', 'male',
            'Salut, je suis Jane, 23 ans, j''adore la photo et la cuisine. Toujours à la recherche de nouvelles expériences culinaires et artistiques.',
            48.8534, 2.3488, 'Paris', 'France', 'gps', '2000-08-20',
            true, false, '/uploads/default/ppFEMME.jpg', 78
        );

        -- Génération de 497 utilisateurs supplémentaires pour atteindre 500
        FOR i IN 1..497 LOOP
            -- Calcul des indices pour la variation des données
            current_city_index := (i % array_length(cities, 1)) + 1;

            -- Génération des données aléatoirement variées
            random_first_name := first_names[(i % array_length(first_names, 1)) + 1];
            random_last_name := last_names[((i * 3) % array_length(last_names, 1)) + 1];
            random_username := lower(random_first_name) || '_' || lower(random_last_name) || '_' || (user_counter);
            random_email := lower(random_first_name) || '.' || lower(random_last_name) || user_counter || '@test.com';
            random_bio := bios[((i * 7) % array_length(bios, 1)) + 1];

            -- Date de naissance aléatoire entre 18 et 50 ans
            random_birth_date := CURRENT_DATE - INTERVAL '1 year' * (18 + (i % 32));

            -- Genre et préférences variés
            IF i % 3 = 0 THEN
                random_gender := 'male';
                random_preferences := CASE WHEN i % 4 = 0 THEN 'bisexual' ELSE 'female' END;
                -- Variation aléatoire entre les 4 images pour plus de diversité
                CASE (i * 7) % 4
                    WHEN 0 THEN random_profile_pic := '/uploads/default/ppHOMME.jpeg';
                    WHEN 1 THEN random_profile_pic := '/uploads/default/ppHOMME2.jpeg';
                    WHEN 2 THEN random_profile_pic := '/uploads/default/ppFEMME.jpg';
                    ELSE random_profile_pic := '/uploads/default/ppFEMME2.jpg';
                END CASE;
            ELSE
                random_gender := 'female';
                random_preferences := CASE WHEN i % 4 = 0 THEN 'bisexual' ELSE 'male' END;
                -- Variation aléatoire entre les 4 images pour plus de diversité
                CASE (i * 11) % 4
                    WHEN 0 THEN random_profile_pic := '/uploads/default/ppFEMME.jpg';
                    WHEN 1 THEN random_profile_pic := '/uploads/default/ppFEMME2.jpg';
                    WHEN 2 THEN random_profile_pic := '/uploads/default/ppHOMME.jpeg';
                    ELSE random_profile_pic := '/uploads/default/ppHOMME2.jpeg';
                END CASE;
            END IF;

            -- Fame rating varié entre 10 et 95
            random_fame_rating := 10 + (i % 85);

            -- Insertion de l'utilisateur
            INSERT INTO users (
                id, email, username, firstname, lastname, password, gender, sexual_preferences,
                biography, latitude, longitude, city, country, location_source, birth_date,
                email_verified, is_online, profile_picture_url, fame_rating
            ) VALUES (
                user_counter,
                random_email,
                random_username,
                random_first_name,
                random_last_name,
                '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m', -- admin123
                random_gender,
                random_preferences,
                random_bio,
                latitudes[current_city_index] + (RANDOM() - 0.5) * 0.1, -- Petite variation
                longitudes[current_city_index] + (RANDOM() - 0.5) * 0.1,
                cities[current_city_index],
                'France',
                'gps',
                random_birth_date,
                true,
                CASE WHEN i % 10 = 0 THEN true ELSE false END, -- 10% en ligne
                random_profile_pic,
                random_fame_rating
            );

            user_counter := user_counter + 1;
        END LOOP;

        -- Association des intérêts aux utilisateurs de base
        INSERT INTO user_interests (user_id, interest_id)
        SELECT u.id, i.id FROM users u, interests i
        WHERE u.username = 'admin' AND i.tag IN ('technology', 'travel', 'cooking', 'photography');

        INSERT INTO user_interests (user_id, interest_id)
        SELECT u.id, i.id FROM users u, interests i
        WHERE u.username = 'john_doe' AND i.tag IN ('sport', 'travel', 'fitness', 'music');

        INSERT INTO user_interests (user_id, interest_id)
        SELECT u.id, i.id FROM users u, interests i
        WHERE u.username = 'jane_doe' AND i.tag IN ('cooking', 'photography', 'art', 'yoga');

        -- Association d'intérêts aléatoires pour tous les autres utilisateurs
        FOR i IN 4..500 LOOP
            interest_count := 2 + (i % 4); -- Entre 2 et 5 intérêts par personne
            FOR j IN 1..interest_count LOOP
                random_interest_id := 1 + ((i * j * 7) % 30);
                INSERT INTO user_interests (user_id, interest_id)
                VALUES (i, random_interest_id)
                ON CONFLICT DO NOTHING; -- Évite les doublons
            END LOOP;
        END LOOP;

        -- Ajout de photos pour tous les utilisateurs
        FOR i IN 1..500 LOOP
            INSERT INTO photos (user_id, filename, url, is_profile, created_at) VALUES
                (i, 'profile_' || i || '.jpeg',
                 -- Utilise la même logique que pour profile_picture_url
                 (SELECT profile_picture_url FROM users WHERE id = i),
                 true, NOW()),
                (i, 'photo2_' || i || '.jpeg',
                 -- Deuxième photo aléatoire parmi les 4 disponibles
                 CASE (i * 13) % 4
                    WHEN 0 THEN '/uploads/default/ppHOMME.jpeg'
                    WHEN 1 THEN '/uploads/default/ppHOMME2.jpeg'
                    WHEN 2 THEN '/uploads/default/ppFEMME.jpg'
                    ELSE '/uploads/default/ppFEMME2.jpg'
                 END,
                 false, NOW());
        END LOOP;

        -- Génération de likes réalistes (environ 20% des utilisateurs s'aiment entre eux)
        FOR i IN 1..100 LOOP
            INSERT INTO likes (liker_id, liked_id, created_at) VALUES
                (1 + (i % 499), 1 + ((i * 3) % 499), NOW() - INTERVAL '1 day' * (i % 30))
                ON CONFLICT DO NOTHING;

            INSERT INTO likes (liker_id, liked_id, created_at) VALUES
                (1 + ((i * 2) % 499), 1 + ((i * 5) % 499), NOW() - INTERVAL '1 day' * (i % 30))
                ON CONFLICT DO NOTHING;
        END LOOP;

        -- Génération de visites de profil
        FOR i IN 1..200 LOOP
            INSERT INTO visits (visitor_id, visited_id, visit_date) VALUES
                (1 + (i % 499), 1 + ((i * 7) % 499), NOW() - INTERVAL '1 hour' * (i % 168))
                ON CONFLICT DO NOTHING;
        END LOOP;

        -- Quelques interactions spécifiques pour les comptes de test
        INSERT INTO likes (liker_id, liked_id, created_at) VALUES
            (2, 3, NOW() - INTERVAL '2 days'),
            (3, 2, NOW() - INTERVAL '1 day'),
            (1, 2, NOW() - INTERVAL '3 hours'),
            (2, 1, NOW() - INTERVAL '1 day'),
            (3, 1, NOW() - INTERVAL '2 hours')
            ON CONFLICT DO NOTHING;

        INSERT INTO visits (visitor_id, visited_id, visit_date) VALUES
            (1, 2, NOW() - INTERVAL '1 hour'),
            (1, 3, NOW() - INTERVAL '2 hours'),
            (2, 1, NOW() - INTERVAL '3 hours'),
            (2, 3, NOW() - INTERVAL '4 hours'),
            (3, 1, NOW() - INTERVAL '5 hours'),
            (3, 2, NOW() - INTERVAL '6 hours')
            ON CONFLICT DO NOTHING;

        -- Fix des séquences
        PERFORM setval('users_id_seq', (SELECT MAX(id) FROM users));
        PERFORM setval('interests_id_seq', (SELECT MAX(id) FROM interests));
        PERFORM setval('photos_id_seq', (SELECT MAX(id) FROM photos));

        RAISE NOTICE '500 utilisateurs de test créés avec succès !';
    ELSE
        PERFORM setval('users_id_seq', (SELECT MAX(id) FROM users));
        PERFORM setval('interests_id_seq', (SELECT MAX(id) FROM interests));
        PERFORM setval('photos_id_seq', (SELECT MAX(id) FROM photos));
        RAISE NOTICE 'Les utilisateurs de test existent déjà.';
    END IF;
END $$;

COMMIT;
