require('dotenv').config()

const { GithubAPI, getClient, getAllRepoNames } = require('../github');
const { timeout, asyncForEach } = require('../utils');

//Looks for an empty template
async function checkEmpty(client, repo, newBranch, file) {
  const gh = new GithubAPI('apollographql', repo, client);

  try{
    const contents = await gh.readFileContents('master', file);

    if(!contents) console.log(`${repo} has empty or no file at ${file}`)
  } catch(e) {
    console.log(`failed ${repo}`);
    console.error(`failed ${repo}\n`, e);
  }
  return;
}

async function checkAllEmpty(file) {
  console.log('Authenticating Client');
  const client = await getClient();
  console.log('Fetching Repos');
  const repos = await getAllRepoNames(client);

  console.log('Updating Templates');
  const updateJobs = repos.map(repo => ({
    update: async () => checkEmpty(client, repo, 'apollo-bot/templates', file),
    name: repo,
  }));

  await asyncForEach(updateJobs, async ({ name, update }) => {
    console.log(`trying ${name}`);
    await update();
    await timeout(1000);
  });

  return;
}

checkAllEmpty('.github/ISSUE_TEMPLATE.md').then(() => {
  console.log('success');
  process.exit(0)
}).catch(console.error);
