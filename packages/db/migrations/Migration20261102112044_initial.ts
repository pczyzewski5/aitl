import { Migration } from '@mikro-orm/migrations';

export class Migration20261102112044_initial extends Migration {

  override name = 'Migration20261102112044_initial';

  override up(): void | Promise<void> {
    this.addSql(`select 1`);
  }

  override down(): void | Promise<void> {
    this.addSql(`select 1`);
  }

}
