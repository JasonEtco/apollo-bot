require('dotenv').config()

const { GithubAPI } = require('../github');

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

async function updateTemplates(newBranch) {
  const gh = new GithubAPI('apollographql', 'apollo-bot');
  await gh.authenticate();

  const issueTemplate = await gh.readFileContents('master', '.github/ISSUE_TEMPLATE.md');
  const prTemplate = await gh.readFileContents('master', '.github/PULL_REQUEST_TEMPLATE.md');
  console.log(issueTemplate);
  console.log(prTemplate);
  console.log('create branch');
  await gh.createBranch('master', newBranch);

  console.log('add updates');

  const newIssueContent = `${issueTemplate}
  ${issueTemplateAddition}`;
  const newsPRContent = `${prTemplate}
  ${prTemplateAddition}`;

  await gh.addFile('.github/ISSUE_TEMPLATE.md', newIssueContent);
  await gh.addFile('.github/PULL_REQUEST_TEMPLATE.md', newPRContent);

  console.log('get current');
  const currentCommit = await gh.getCurrentCommit(newBranch);
  console.log('create commit');
  const newCommit = await gh.createCommit('[apollo-bot] Update the Issue/PR Templates with auto label', currentCommit);
  console.log('push commit');
  await gh.pushCommit('test', newCommit);
  console.log('open pr');
  await gh.openPR('master', newBranch, '[apollo-bot] Update the Issue/PR Templates with auto label', 'This PR contains an update to the issue templates that adds a notice about being able to add labels to Issues and PRs')
  return;
}

testing().then(process.exit).catch(console.error);
