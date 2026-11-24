import { Migration } from '@mikro-orm/migrations';

export class Migration20261124182000_login_throttles_failures_check extends Migration {

  override name = 'Migration20261124182000_login_throttles_failures_check';

  override up(): void | Promise<void> {
    this.addSql(`alter table "login_throttles" add constraint "login_throttles_failures_check" check (failures >= 0);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "login_throttles" drop constraint "login_throttles_failures_check";`);
  }

}
