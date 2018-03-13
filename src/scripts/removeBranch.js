require('dotenv').config()

const { GithubAPI, getClient, getAllRepoNames } = require('../github');
const { timeout, asyncForEach } = require('../utils');

async function deleteBranch(client, repo, ref) {
  try{
    await client.gitdata.deleteReference({owner:'apollographql', repo, ref})
    console.log(`success ${repo}`);
  } catch(e) {
    console.log(`failed ${repo}`);
    console.error(`failed ${repo}\n`, e.code);
  }
}

async function deleteBranchFromAll(branch) {
  console.log('Authenticating Client');
  const client = await getClient();
  console.log('Fetching Repos');
  const repos = await getAllRepoNames(client);

  console.log('Removing Branch');
  const jobs = repos.map(repo => ({
    update: async () => deleteBranch(client, repo, branch),
    name: repo,
  }));

  await asyncForEach(jobs, async ({ name, update }) => {
    await update();
    await timeout(10);
  });

  return;
}

deleteBranchFromAll('heads/apollo-bot/templates').then(() => {
  console.log('success');
  process.exit(0)
}).catch(console.error);
