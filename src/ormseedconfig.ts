import { ConnectionOptions } from 'typeorm';
import ormconfig from '@app/ormconfig';

const seedconfig: ConnectionOptions = {
  ...ormconfig,
  migrations: [__dirname + '/seeds/**/*{.ts,.js}'],
  cli: {
    migrationsDir: 'src/seeds',
  },
};

export default seedconfig;
