-- Fonction pour hasher les mots de passe avec bcrypt
-- Cette fonction est utilisée par l'edge function manage-users

-- Vérifier si l'extension pgcrypto est disponible, sinon utiliser SHA-256
CREATE OR REPLACE FUNCTION public.hash_password(password_text TEXT)
RETURNS TEXT AS $$
DECLARE
    hashed TEXT;
BEGIN
    -- Essayer d'utiliser bcrypt via pgcrypto si disponible
    BEGIN
        -- Utiliser crypt avec gen_salt pour bcrypt
        SELECT crypt(password_text, gen_salt('bf', 12)) INTO hashed;
        RETURN hashed;
    EXCEPTION WHEN OTHERS THEN
        -- Fallback: utiliser SHA-256 avec salt si pgcrypto n'est pas disponible
        RETURN encode(digest(password_text || 'cabinet_medical_salt_2025', 'sha256'), 'hex');
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier un mot de passe haché
CREATE OR REPLACE FUNCTION public.verify_password(password_text TEXT, password_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Essayer d'utiliser crypt pour bcrypt
    BEGIN
        RETURN crypt(password_text, password_hash) = password_hash;
    EXCEPTION WHEN OTHERS THEN
        -- Fallback: utiliser SHA-256
        RETURN encode(digest(password_text || 'cabinet_medical_salt_2025', 'sha256'), 'hex') = password_hash;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

