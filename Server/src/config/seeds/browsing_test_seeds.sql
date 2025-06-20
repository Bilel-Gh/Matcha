-- browsing_test_seeds.sql
-- Additional test data for browsing system

BEGIN;

DO $$
BEGIN
    -- Add more diverse users for browsing tests
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'test1@browse.com') THEN
        -- User 4: Male, hetero, Paris
        INSERT INTO users (
            id, email, username, firstname, lastname, password,
            gender, sexual_preferences, biography,
            latitude, longitude, city, country, location_source,
            birth_date, email_verified, profile_picture_url, fame_rating
        ) VALUES (
            4, 'test1@browse.com', 'paris_guy', 'Pierre', 'Martin',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m',
            'male', 'female', 'Passionate developer living in Paris. Love coffee and coding.',
            48.8566, 2.3522, 'Paris', 'France', 'gps',
            '1995-03-15', true, '/uploads/default/ppHOMME.jpeg', 45
        );

        -- User 5: Female, hetero, close to Paris
        INSERT INTO users (
            id, email, username, firstname, lastname, password,
            gender, sexual_preferences, biography,
            latitude, longitude, city, country, location_source,
            birth_date, email_verified, profile_picture_url, fame_rating
        ) VALUES (
            5, 'test2@browse.com', 'paris_girl', 'Marie', 'Dubois',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m',
            'female', 'male', 'Art student who loves museums and long walks in the city.',
            48.8584, 2.3545, 'Paris', 'France', 'gps',
            '1997-07-22', true, '/uploads/default/ppFEMME.jpg', 60
        );

        -- User 6: Male, bisexual, Lyon
        INSERT INTO users (
            id, email, username, firstname, lastname, password,
            gender, sexual_preferences, biography,
            latitude, longitude, city, country, location_source,
            birth_date, email_verified, profile_picture_url, fame_rating
        ) VALUES (
            6, 'test3@browse.com', 'lyon_artist', 'Luc', 'Bernard',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m',
            'male', 'both', 'Creative soul from Lyon. Photography and music are my passions.',
            45.7640, 4.8357, 'Lyon', 'France', 'gps',
            '1993-11-08', true, '/uploads/default/ppHOMME2.jpeg', 75
        );

        -- User 7: Female, bisexual, Marseille
        INSERT INTO users (
            id, email, username, firstname, lastname, password,
            gender, sexual_preferences, biography,
            latitude, longitude, city, country, location_source,
            birth_date, email_verified, profile_picture_url, fame_rating
        ) VALUES (
            7, 'test4@browse.com', 'marseille_sun', 'Sophie', 'Morel',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m',
            'female', 'both', 'Beach lover from Marseille. Surfing, yoga, and good vibes.',
            43.2965, 5.3698, 'Marseille', 'France', 'gps',
            '1996-05-14', true, '/uploads/default/ppFEMME2.jpg', 80
        );

        -- User 8: Male, gay, Nice
        INSERT INTO users (
            id, email, username, firstname, lastname, password,
            gender, sexual_preferences, biography,
            latitude, longitude, city, country, location_source,
            birth_date, email_verified, profile_picture_url, fame_rating
        ) VALUES (
            8, 'test5@browse.com', 'nice_guy', 'Thomas', 'Laurent',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m',
            'male', 'male', 'Fashion designer on the French Riviera. Style and elegance.',
            43.7102, 7.2620, 'Nice', 'France', 'gps',
            '1994-09-30', true, '/uploads/default/ppHOMME.jpeg', 85
        );

        -- User 9: Female, lesbian, Bordeaux
        INSERT INTO users (
            id, email, username, firstname, lastname, password,
            gender, sexual_preferences, biography,
            latitude, longitude, city, country, location_source,
            birth_date, email_verified, profile_picture_url, fame_rating
        ) VALUES (
            9, 'test6@browse.com', 'bordeaux_wine', 'Camille', 'Rousseau',
            '$2b$10$NSrsqjoP5zpngrkol8dH1uIza.OVByaZiRSsejBCBN7S2.O61Mv2m',
            'female', 'female', 'Wine enthusiast and sommelier. Love good food and great company.',
            44.8378, -0.5792, 'Bordeaux', 'France', 'gps',
            '1992-12-03', true, '/uploads/default/ppFEMME.jpg', 70
        );

        -- Add interests for these users
        INSERT INTO user_interests (user_id, interest_id)
        SELECT 4, i.id FROM interests i WHERE i.tag IN ('technology', 'music', 'coffee');

        INSERT INTO user_interests (user_id, interest_id)
        SELECT 5, i.id FROM interests i WHERE i.tag IN ('art', 'photography', 'books');

        INSERT INTO user_interests (user_id, interest_id)
        SELECT 6, i.id FROM interests i WHERE i.tag IN ('photography', 'music', 'art', 'travel');

        INSERT INTO user_interests (user_id, interest_id)
        SELECT 7, i.id FROM interests i WHERE i.tag IN ('surfing', 'yoga', 'nature', 'travel');

        INSERT INTO user_interests (user_id, interest_id)
        SELECT 8, i.id FROM interests i WHERE i.tag IN ('fashion', 'art', 'travel');

        INSERT INTO user_interests (user_id, interest_id)
        SELECT 9, i.id FROM interests i WHERE i.tag IN ('wine', 'cooking', 'books');

        -- Update sequence
        PERFORM setval('users_id_seq', (SELECT MAX(id) FROM users));

        RAISE NOTICE 'Browsing test users created successfully!';
    ELSE
        RAISE NOTICE 'Browsing test users already exist.';
    END IF;
END $$;

COMMIT;
