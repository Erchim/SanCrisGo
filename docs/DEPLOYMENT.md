# Deployment

## Production database

Supabase provides the production PostgreSQL database. This GitHub repository is the source of truth for database schema history, and `main` is the production branch. Versioned database migrations live in:

```text
supabase/migrations/
```

## Migration workflow

Every database schema change follows the reviewed, version-controlled path:

```text
create migration
↓
review in PR
↓
merge PR into main
↓
Supabase GitHub Integration applies pending migrations
```

Do not manually edit production tables through the Supabase dashboard as a normal deployment method. If an emergency requires a manual database change, follow it with a migration that accurately represents the change so that Git history and production do not diverge.

## Migration naming and history

Migration filenames use a monotonically increasing timestamp prefix followed by a concise description. The initial migrations establish the convention:

```text
202608130001_initial_schema.sql
202608130002_rls_policies.sql
```

Give each future migration a new, later timestamp/name. Never rewrite a migration that has already been applied to production.

## Seed data

`supabase/seed.sql` contains development/bootstrap seed data. Do not assume that it runs automatically during normal production migration deployment. If production data ever needs an explicit, reviewed change, plan that operation separately rather than duplicating the current seed file into a migration without a product requirement.

## Secrets

Never commit secrets or credentials to Git, including database passwords, service-role keys, private API keys, SMTP passwords, and third-party tokens. Use environment variables or Supabase secrets when runtime configuration is introduced.

## Rollback and corrections

Do not edit an already-applied migration to correct production. Create a new migration that safely fixes or reverses the earlier change, review it in a PR, and deploy it through the normal `main` branch workflow.

## Verification after deployment

After a production deployment, verify that:

- the Supabase deployment succeeded;
- both existing migrations are recorded as applied;
- the expected application tables exist;
- row-level security is enabled;
- no unexpected database errors appear; and
- the production database remains healthy.
