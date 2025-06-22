-- chat_test_seeds.sql
-- Test data specifically for the chat system

BEGIN;

DO $$
BEGIN
    -- Check if chat test data already exists
    IF NOT EXISTS (SELECT 1 FROM messages WHERE content LIKE '%Comment ça va%') THEN

        -- First, ensure we have some likes/matches for users to be able to chat
        -- These users should already exist from development_seeds.sql and browsing_test_seeds.sql

        -- Make sure admin (1) and john_doe (2) are matched
        INSERT INTO likes (liker_id, liked_id, created_at)
        VALUES (1, 2, NOW() - INTERVAL '2 days')
        ON CONFLICT DO NOTHING;

        INSERT INTO likes (liker_id, liked_id, created_at)
        VALUES (2, 1, NOW() - INTERVAL '2 days')
        ON CONFLICT DO NOTHING;

        -- Make sure admin (1) and jane_doe (3) are matched
        INSERT INTO likes (liker_id, liked_id, created_at)
        VALUES (1, 3, NOW() - INTERVAL '1 day')
        ON CONFLICT DO NOTHING;

        INSERT INTO likes (liker_id, liked_id, created_at)
        VALUES (3, 1, NOW() - INTERVAL '1 day')
        ON CONFLICT DO NOTHING;

        -- Make sure john_doe (2) and jane_doe (3) are matched (they already exist in dev seeds)
        -- No need to add them again as they're already there

        -- Add matches between admin and some of the browsing test users
        -- admin (1) and paris_guy (4)
        INSERT INTO likes (liker_id, liked_id, created_at)
        VALUES (1, 4, NOW() - INTERVAL '3 hours')
        ON CONFLICT DO NOTHING;

        INSERT INTO likes (liker_id, liked_id, created_at)
        VALUES (4, 1, NOW() - INTERVAL '3 hours')
        ON CONFLICT DO NOTHING;

        -- admin (1) and paris_girl (5)
        INSERT INTO likes (liker_id, liked_id, created_at)
        VALUES (1, 5, NOW() - INTERVAL '2 hours')
        ON CONFLICT DO NOTHING;

        INSERT INTO likes (liker_id, liked_id, created_at)
        VALUES (5, 1, NOW() - INTERVAL '2 hours')
        ON CONFLICT DO NOTHING;

        -- admin (1) and lyon_artist (6)
        INSERT INTO likes (liker_id, liked_id, created_at)
        VALUES (1, 6, NOW() - INTERVAL '1 hour')
        ON CONFLICT DO NOTHING;

        INSERT INTO likes (liker_id, liked_id, created_at)
        VALUES (6, 1, NOW() - INTERVAL '1 hour')
        ON CONFLICT DO NOTHING;

        -- Now add messages between matched users

        -- Conversation between admin (1) and john_doe (2)
        INSERT INTO messages (sender_id, receiver_id, content, is_read, sent_at) VALUES
            (1, 2, 'Salut John ! Comment ça va ?', true, NOW() - INTERVAL '2 days'),
            (2, 1, 'Salut ! Ça va super bien, merci ! Et toi ?', true, NOW() - INTERVAL '2 days' + INTERVAL '5 minutes'),
            (1, 2, 'Ça va très bien aussi ! Tu fais quoi ce week-end ?', true, NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),
            (2, 1, 'Je pensais aller faire du sport, et toi ?', true, NOW() - INTERVAL '2 days' + INTERVAL '15 minutes'),
            (1, 2, 'Excellente idée ! On pourrait peut-être se voir ?', false, NOW() - INTERVAL '1 day');

        -- Conversation between admin (1) and jane_doe (3)
        INSERT INTO messages (sender_id, receiver_id, content, is_read, sent_at) VALUES
            (3, 1, 'Hello ! J''ai vu qu''on avait des intérêts en commun 😊', true, NOW() - INTERVAL '1 day'),
            (1, 3, 'Salut Jane ! Oui c''est vrai, j''aime beaucoup la photographie aussi', true, NOW() - INTERVAL '1 day' + INTERVAL '30 minutes'),
            (3, 1, 'Tu as des spots préférés pour prendre des photos ?', true, NOW() - INTERVAL '1 day' + INTERVAL '1 hour'),
            (1, 3, 'J''adore les couchers de soleil sur la Seine ! Et toi ?', true, NOW() - INTERVAL '1 day' + INTERVAL '1 hour 15 minutes'),
            (3, 1, 'Magnifique ! Je suis plus dans les portraits en studio', false, NOW() - INTERVAL '12 hours'),
            (1, 3, 'Intéressant ! Tu pourrais me montrer ton travail ?', false, NOW() - INTERVAL '6 hours');

        -- Conversation between john_doe (2) and jane_doe (3)
        INSERT INTO messages (sender_id, receiver_id, content, is_read, sent_at) VALUES
            (2, 3, 'Hey Jane ! On s''est matché 🎉', true, NOW() - INTERVAL '6 hours'),
            (3, 2, 'Salut John ! Oui j''ai vu ça ! Tu aimes la cuisine ?', true, NOW() - INTERVAL '6 hours' + INTERVAL '20 minutes'),
            (2, 3, 'J''adore ! Surtout la cuisine italienne. Et toi ?', true, NOW() - INTERVAL '5 hours'),
            (3, 2, 'Moi c''est plutôt cuisine française traditionnelle', false, NOW() - INTERVAL '4 hours'),
            (2, 3, 'On pourrait échanger nos recettes préférées !', false, NOW() - INTERVAL '3 hours');

        -- Conversation between admin (1) and paris_guy (4)
        INSERT INTO messages (sender_id, receiver_id, content, is_read, sent_at) VALUES
            (4, 1, 'Salut ! Je vois qu''on habite tous les deux à Paris !', true, NOW() - INTERVAL '3 hours'),
            (1, 4, 'Salut Pierre ! Oui c''est cool ! Tu es dans quel arrondissement ?', true, NOW() - INTERVAL '3 hours' + INTERVAL '10 minutes'),
            (4, 1, 'Je suis dans le 11ème, près de République. Et toi ?', false, NOW() - INTERVAL '2 hours 30 minutes'),
            (1, 4, 'Pas loin ! Je suis souvent dans le centre', false, NOW() - INTERVAL '2 hours');

        -- Conversation between admin (1) and paris_girl (5)
        INSERT INTO messages (sender_id, receiver_id, content, is_read, sent_at) VALUES
            (5, 1, 'Hello ! J''ai vu que tu aimais l''art aussi ?', true, NOW() - INTERVAL '2 hours'),
            (1, 5, 'Salut Marie ! Oui j''adore ! Tu es étudiante en art ?', true, NOW() - INTERVAL '2 hours' + INTERVAL '5 minutes'),
            (5, 1, 'Exact ! Je suis aux Beaux-Arts. Tu as des musées préférés ?', false, NOW() - INTERVAL '1 hour 30 minutes');

        -- Conversation between admin (1) and lyon_artist (6)
        INSERT INTO messages (sender_id, receiver_id, content, is_read, sent_at) VALUES
            (6, 1, 'Salut ! Lyon - Paris, on est pas si loin finalement !', true, NOW() - INTERVAL '1 hour'),
            (1, 6, 'Salut Luc ! C''est vrai ! Tu montes souvent sur Paris ?', false, NOW() - INTERVAL '45 minutes'),
            (6, 1, 'De temps en temps pour le boulot. Et toi tu descends sur Lyon ?', false, NOW() - INTERVAL '30 minutes'),
            (1, 6, 'Pas souvent mais j''aimerais bien ! C''est une belle ville', false, NOW() - INTERVAL '15 minutes');

        -- Add some longer conversations for testing pagination
        -- Extended conversation between admin (1) and john_doe (2)
        INSERT INTO messages (sender_id, receiver_id, content, is_read, sent_at) VALUES
            (2, 1, 'Au fait, tu travailles dans quoi exactement ?', false, NOW() - INTERVAL '8 hours'),
            (1, 2, 'Je suis développeur web ! Et toi ?', false, NOW() - INTERVAL '7 hours 45 minutes'),
            (2, 1, 'Cool ! Moi je suis dans le marketing digital', false, NOW() - INTERVAL '7 hours 30 minutes'),
            (1, 2, 'Intéressant ! On pourrait collaborer un jour 😄', false, NOW() - INTERVAL '7 hours 15 minutes'),
            (2, 1, 'Pourquoi pas ! Tu utilises quelles technos ?', false, NOW() - INTERVAL '7 hours'),
            (1, 2, 'Principalement React et Node.js', false, NOW() - INTERVAL '6 hours 45 minutes'),
            (2, 1, 'Perfect ! J''ai des clients qui cherchent des devs React', false, NOW() - INTERVAL '6 hours 30 minutes'),
            (1, 2, 'On en reparle autour d''un café ? ☕', false, NOW() - INTERVAL '6 hours 15 minutes'),
            (2, 1, 'Avec plaisir ! Tu connais le café près de République ?', false, NOW() - INTERVAL '6 hours'),
            (1, 2, 'Le Coffee Shop ? Oui parfait ! Demain 14h ?', false, NOW() - INTERVAL '5 hours 45 minutes'),
            (2, 1, 'C''est noté ! À demain 😊', false, NOW() - INTERVAL '5 hours 30 minutes');

        RAISE NOTICE 'Chat test data created successfully!';
    ELSE
        RAISE NOTICE 'Chat test data already exists.';
    END IF;
END $$;

COMMIT;
