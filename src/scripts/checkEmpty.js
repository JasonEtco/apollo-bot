require('dotenv').config()

const { GithubAPI, getClient, getAllRepoNames } = require('../github');

const issueTemplateAddition =`**Labels**

- [ ] has-reproduction
- [ ] feature
- [ ] blocking
- [ ] good-first-issue

<!--
You are also able to add labels by placing /label on a new line
followed by the label you would like to add. ex: /label discussion
-->`;

const prTemplateAddition =`**Labels**

- [ ] has-reproduction
- [ ] feature
- [ ] blocking
- [ ] good-first-review

<!--
You are also able to add labels by placing /label on a new line
followed by the label you would like to add. ex: /label discussion
-->`;

async function updateTemplates(client, repo, newBranch) {
  const gh = new GithubAPI('apollographql', repo, client);

  try{
    const issueTemplate = await gh.readFileContents('master', '.github/ISSUE_TEMPLATE.md');
    const prTemplate = await gh.readFileContents('master', '.github/PULL_REQUEST_TEMPLATE.md');

    if(!issueTemplate) console.log(`${repo} has empty issue template`)

    if(!prTemplate) console.log(`${repo} has empty pr template`)

    return;
  } catch(e) {
    // console.error(`failed ${repo}\n`, e);
    console.log(`failed ${repo}`);
    console.error(`failed ${repo}\n`, e);
  }
  return;
}


async function updateAllTemplates() {
  console.log('Authenticating Client');
  const client = await getClient();
  console.log('Fetching Repos');
  const repos = await getAllRepoNames(client);

  console.log('Updating Templates');
  const updateJobs = repos.map(repo => ({
    update: async () => updateTemplates(client, repo, 'apollo-bot/templates'),
    name: repo,
  }));

  const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }
  const timeout = ms => new Promise(res => setTimeout(res, ms))


  await asyncForEach(updateJobs, async ({ name, update }) => {
    console.log(`trying ${name}`);
    await update();
    await timeout(1000);
  });

  return;
}

updateAllTemplates().then(() => {
  console.log('success');
  process.exit(0)
}).catch(console.error);
