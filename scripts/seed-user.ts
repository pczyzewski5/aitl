import { MikroORM, type Options } from '@mikro-orm/postgresql';
import { createAppContainer } from '../packages/app/src/container/container.ts';
import { runSeed } from '../packages/app/src/seed/run-seed.ts';

const ARGUMENTS_OFFSET = 2;
const orms: MikroORM[] = [];

const initTrackedOrm = async (config: Options): Promise<MikroORM> => {
  const orm = await MikroORM.init(config);
  orms.push(orm);

  return orm;
};

try {
  const { cradle } = createAppContainer(process.env, initTrackedOrm).createScope();

  process.exitCode = await runSeed({
    argv: process.argv.slice(ARGUMENTS_OFFSET),
    env: process.env,
    provisioning: cradle.userProvisioningService,
    users: cradle.userRepository,
    passwordHasher: cradle.passwordHasher,
    writeOut: (text) => process.stdout.write(text),
    writeErr: (text) => process.stderr.write(text),
  });
} finally {
  await Promise.all(orms.map((orm) => orm.close()));
}
