import {cp, mkdir, rm, access} from 'node:fs/promises';
const source = new URL('../../web/dist/', import.meta.url);
const target = new URL('../public/', import.meta.url);
await access(new URL('index.html', source));
await rm(target, {recursive: true, force: true});
await mkdir(target, {recursive: true});
await cp(source, target, {recursive: true});
console.log('Copied web/dist into api/public for the Lambda package.');
