-- Extensions used across the schema.
-- pgcrypto: gen_random_uuid() for primary keys, digest()/gen_random_bytes() for guest tokens.
create extension if not exists pgcrypto with schema extensions;
