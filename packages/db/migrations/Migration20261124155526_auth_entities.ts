import { Migration } from '@mikro-orm/migrations';

export class Migration20261124155526_auth_entities extends Migration {

  override name = 'Migration20261124155526_auth_entities';

  override up(): void | Promise<void> {
    this.addSql(`create table "login_throttles" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "key_hash" varchar(255) not null, "failures" int not null default 0, "window_started_at" timestamptz not null, "locked_until" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "login_throttles" add constraint "login_throttles_key_hash_unique" unique ("key_hash");`);
    this.addSql(`create index "login_throttles_updated_at_index" on "login_throttles" ("updated_at");`);

    this.addSql(`create table "users" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "email" varchar(255) not null, "display_name" varchar(255) not null, "password_hash" varchar(255) not null, primary key ("id"));`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);

    this.addSql(`create table "sessions" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "user_id" uuid not null, "token_hash" varchar(255) not null, "expires_at" timestamptz not null, "absolute_expires_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "sessions" add constraint "sessions_token_hash_unique" unique ("token_hash");`);
    this.addSql(`create index "sessions_expires_at_index" on "sessions" ("expires_at");`);
    this.addSql(`create index "sessions_absolute_expires_at_index" on "sessions" ("absolute_expires_at");`);

    this.addSql(`create table "bank_accounts" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "type" text not null, "name" varchar(255) not null, "owner_id" uuid null, primary key ("id"));`);
    this.addSql(`create unique index "bank_accounts_one_personal_per_owner" on "bank_accounts" ("owner_id") where "type" = 'personal';`);
    this.addSql(`create unique index "bank_accounts_shared_name_unique" on "bank_accounts" ("type", "name") where "type" = 'shared';`);

    this.addSql(`create table "bank_account_memberships" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "user_id" uuid not null, "bank_account_id" uuid not null, primary key ("id"));`);
    this.addSql(`alter table "bank_account_memberships" add constraint "bank_account_memberships_user_id_bank_account_id_unique" unique ("user_id", "bank_account_id");`);

    this.addSql(`alter table "users" add constraint "users_email_lowercase_check" check (email = lower(email));`);

    this.addSql(`alter table "sessions" add constraint "sessions_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;`);

    this.addSql(`alter table "bank_accounts" add constraint "bank_accounts_owner_id_foreign" foreign key ("owner_id") references "users" ("id") on delete restrict;`);
    this.addSql(`alter table "bank_accounts" add constraint "bank_accounts_owner_by_type_check" check ((type = 'personal' AND owner_id IS NOT NULL) OR (type = 'shared' AND owner_id IS NULL));`);
    this.addSql(`alter table "bank_accounts" add constraint "bank_accounts_type_check" check ("type" in ('shared', 'personal'));`);

    this.addSql(`alter table "bank_account_memberships" add constraint "bank_account_memberships_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;`);
    this.addSql(`alter table "bank_account_memberships" add constraint "bank_account_memberships_bank_account_id_foreign" foreign key ("bank_account_id") references "bank_accounts" ("id") on delete cascade;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "sessions" drop constraint "sessions_user_id_foreign";`);
    this.addSql(`alter table "bank_accounts" drop constraint "bank_accounts_owner_id_foreign";`);
    this.addSql(`alter table "bank_account_memberships" drop constraint "bank_account_memberships_user_id_foreign";`);
    this.addSql(`alter table "bank_account_memberships" drop constraint "bank_account_memberships_bank_account_id_foreign";`);

    this.addSql(`drop table if exists "login_throttles" cascade;`);
    this.addSql(`drop table if exists "users" cascade;`);
    this.addSql(`drop table if exists "sessions" cascade;`);
    this.addSql(`drop table if exists "bank_accounts" cascade;`);
    this.addSql(`drop table if exists "bank_account_memberships" cascade;`);
  }

}
