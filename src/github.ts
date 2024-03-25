import { Octokit } from '@octokit/rest';
import { writeFile } from 'fs/promises';
import { chain } from 'lodash-es';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// const rateLimit = await octokit.request('GET /rate_limit');
// console.log(rateLimit.data);

const perPage = 100;

const all = [];

const qs = [
  'openapi.json api.md',
  'swagger.json api.md',
  'swagger.yaml api.md',
];

// const a = await octokit.search.repos({
//   q: 'path:openapi.json',
// });
// console.log(a.data.total_count);

for (const q of qs) {
  let totalCount = 0;

  for (let i = 0; i < totalCount || i === 0; i += perPage) {
    const res = await octokit.request('GET /search/code', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      per_page: perPage,
      page: i / perPage + 1,
      q,
    });

    if (totalCount === 0) totalCount = res.data.total_count;
    console.log(totalCount);

    all.push(...res.data.items);
    if (i === perPage * 2) break;
  }
}

const githubLinks = chain(all)
  .map(res => ({
    name: res.name,
    html_url: res.repository.html_url,
    repoName: res.repository.name,
  }))
  //   .filter(i => i.repoName.toLowerCase().includes('api'))
  .uniqBy(i => i.repoName);

await writeFile('github.json', JSON.stringify(githubLinks));
