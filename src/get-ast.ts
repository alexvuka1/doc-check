import { writeFile } from 'fs/promises';
import { docParse } from './parsing/markdown';

const tree = await docParse('README.md');
await writeFile('out', JSON.stringify(tree, null, 2));
