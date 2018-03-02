require('dotenv').config()

const { GithubAPI, getClient, getAllRepoNames } = require('../github');

const issueTemplateAddition =`<!--**Issue Labels**

While not necessary, you can help organize our issues by labeling this issue when you open it.  To add a label automatically, simply [x] mark the appropriate box below:

- [ ] has-reproduction
- [ ] feature
- [ ] blocking
- [ ] good first issue

To add a label not listed above, simply place \`/label another-label-name\` on a line by itself.
-->`;

const prTemplateAddition =`<!--**Pull Request Labels**

While not necessary, you can help organize our pull requests by labeling this issue when you open it.  To add a label automatically, simply [x] mark the appropriate box below:

- [ ] has-reproduction
- [ ] feature
- [ ] blocking
- [ ] good first review

To add a label not listed above, simply place \`/label another-label-name\` on a line by itself.
-->`;

async function updateTemplates(client, repo, newBranch) {
  const gh = new GithubAPI('apollographql', repo, client);

  try{
    const issueTemplate = await gh.readFileContents('master', '.github/ISSUE_TEMPLATE.md');
    const prTemplate = await gh.readFileContents('master', '.github/PULL_REQUEST_TEMPLATE.md');
    console.log('create branch');
    await gh.createBranch('master', newBranch);

    console.log('add updates');

    const newIssueContent = `${issueTemplate || ''}
${issueTemplateAddition}`;
    const newPRContent = `${prTemplate || ''}
${prTemplateAddition}`;

    await gh.addFile('.github/ISSUE_TEMPLATE.md', newIssueContent);
    await gh.addFile('.github/PULL_REQUEST_TEMPLATE.md', newPRContent);

    console.log('get current');
    const currentCommit = await gh.getCurrentCommit(newBranch);
    console.log('create commit');
    const newCommit = await gh.createCommit('[apollo-bot] Update the Issue/PR Templates with auto label', currentCommit);
    console.log('push commit');
    await gh.pushCommit(newBranch, newCommit);
    console.log('open pr');
    await gh.openPR('master', newBranch, '[apollo-bot] Update the Issue/PR Templates with auto label', 'This PR contains an update to the issue templates that adds a notice about being able to add labels to Issues and PRs')
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
