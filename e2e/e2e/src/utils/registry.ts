import { ChildProcess, fork, execSync } from 'child_process';
import * as glob from 'glob';
import { logInfo } from './logger';

export function runRegistry(
  args: string[] = [],
  // eslint-disable-next-line @typescript-eslint/ban-types
  childOptions: {}
): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const childFork = fork(
      require.resolve('verdaccio/bin/verdaccio'),
      args,
      childOptions
    );

    childFork.on('message', (msg: { verdaccio_started: boolean }) => {
      if (msg.verdaccio_started) {
        resolve(childFork);
      }
    });

    childFork.on('error', (err: any) => reject([err]));
    childFork.on('disconnect', (err: any) => reject([err]));
  });
}

export async function startVerdaccio() {
  const port = 4873;
  return runRegistry(
    [
      '-c',
      `${process.cwd()}/tools/scripts/local-registry/config.yml`,
      '-l',
      `${port}`,
    ],
    {}
  );
}

export function buildAllPackages() {
  logInfo('Build all....');
  execSync(
    `npx nx run-many --target=build --all --parallel --exclude=e2e,docs || { echo 'Build failed' ; exit 1; }`,
    {
      stdio: [0, 1, 2],
    }
  );
}

export function runNpmPublish(path: string) {
  const tag = 'latest';
  const buffer = execSync(`npm publish -tag ${tag} --access public --json`, {
    cwd: path,
  });
  return JSON.parse(buffer.toString());
}

export function publishPackages() {
  const pkgFiles = glob
    .sync('dist/packages/**/package.json')
    .map((pkgJsonPath) => pkgJsonPath.replace('package.json', ''));
  pkgFiles.forEach((distPath) => {
    const pkgInfo = runNpmPublish(distPath);
    console.log(`📦  ${pkgInfo.name} published...`);
  });
}