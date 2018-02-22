const Botkit = require('botkit');
const commands = require('probot-commands');

//https://github.com/octokit/rest.js#options for config
const octokit = require('@octokit/rest')({})

const createApp = require('github-app');

const app = createApp({
  // Your app id
  id: process.env.APP_ID,
  // The private key for your app, which can be downloaded from the
  // app's settings: https://github.com/settings/apps
  cert: process.env.PRIVATE_KEY || require('fs').readFileSync(process.env.PRIVATE_KEY_PATH)
});

// const installationId = 87602;

class GithubAPI {

  constructor() {
    this.repo = repo;
    this.owner = owner;
    this.fileBlobs = [];
  }

  async function authenticate() {
    const githubAsApp = await app.asApp();
    console.log("Installations:")
    const installations = await githubAsApp.apps.getInstallations({});

    this.github = app.asInstallation(installations.data[0].id);
  }

  async function addFile(baseName, branchName, path, content) {
    const encoding = 'utf-8'; //can be 'base64'
    const blob = await github.gitdata.createBlob({owner, repo, content, encoding});
    this.fileBlobs.push({
      sha: blob.data.sha,
      path,
    });

    return blob;
  }

  async function createBranch(message) {
    const branch = await github.gitdata.getReference({owner, repo, ref});
  }

  async function getCurrentCommit(branchName) {
    const owner = this.owner;
    const repo = this.repo;

    const branch = await github.repos.getBranch({owner, repo, branch: branchName});
    const sha = branch.data.commit.sha;

    return this.github.gitdata.getCommit({owner, repo, sha});
  }

  async function createCommit(message, base_commit) {
    const owner = this.owner;
    const repo = this.repo;

    const tree = await this.github.gitdata.getTree({
      owner,
      repo,
      sha:base_commit.data.tree.sha,
      recursive: true
    });

    //mode: The file mode; one of
    //100644 for file (blob),
    //100755 for executable (blob),
    //040000 for subdirectory (tree),
    //160000 for submodule (commit), or
    //120000 for a blob that specifies the path of a symlink
    const filesToAdd = this.fileBlobs.map(({sha, path}) => ({
      mode: '100644',
      type: 'blob',
      sha: blob.data.sha,
      path,
    }));

    const newTree = await this.github.gitdata.createTree({
      owner,
      repo,
      tree: filesToAdd,
      base_tree: tree.data.sha
    });

    return this.github.gitdata.createCommit({
      owner,
      repo,
      message:'test commit',
      tree: newTree.data.sha,
      parents:[ commit.data.sha ]
    });
  }

  async function pushCommit(branchName, commit) {
    const ref = `heads/${branchName}`;
    return await this.github.gitdata.updateReference({
      owner: this.owner,
      repo: this.repo,
      ref,
      sha:commit.data.sh
    });
  }

  async function openPR(base, head, title, body) {
    return github.pullRequests.create({
      owner: this.owner,
      repo: this.repo,
      head,
      base,
      title,
      body
    });

  }
}

async function createIssueComment(github, options) {
  // github.issues.createComment({
  //   owner: 'apollographql',
  //   repo: 'apollo-bot',
  //   number: 1,
  //   body: 'hello world!'
  // });
  github.issue.createComment(options);
}

async function addFileOpenPR(github, owner, repo, baseName, branchName, path, content) {
  const github = await getGithubAPI();

  const master = await github.repos.getBranch({owner, repo, branch: baseName});
  const ref = `heads/${branchName}`;
  const fullRef = `refs/heads/${branchName}`;
  const currentCommitSha = master.data.commit.sha;

  const branch = await github.gitdata.createReference({owner, repo, ref:fullRef, sha: currentCommitSha});

  const commit = await github.gitdata.getCommit({owner, repo, sha: currentCommitSha});

  const tree = await github.gitdata.getTree({owner, repo, sha: commit.data.tree.sha, recursive: true});

  //mode: The file mode; one of
  //100644 for file (blob),
  //100755 for executable (blob),
  //040000 for subdirectory (tree),
  //160000 for submodule (commit), or
  //120000 for a blob that specifies the path of a symlink
  const newNode = {
    path,
    mode: '100644',
    type: 'blob',
    // sha: blob.data.sha,
    content,
  }

  const newTree = await github.gitdata.createTree({owner, repo, tree: [newNode], base_tree: tree.data.sha});
  const newCommit = await github.gitdata.createCommit({owner, repo, message:'test commit', tree: newTree.data.sha, parents:[ commit.data.sha ] });
  const newRef = await github.gitdata.updateReference({owner, repo, ref, sha:newCommit.data.sha});
  const pr = await github.pullRequests.create({owner, repo, head: 'test', base: 'master', title:'first one', body: '@jbaxleyiii check me out!'});
  return pr;
}

const asyncFun = async () => {
  const github = await getGithubAPI();

  const owner = 'apollographql';
  const repo = 'apollo-bot';

  const master = await github.repos.getBranch({owner, repo, branch: 'master'});
  console.log(master.data.commit.sha);
  const ref = 'heads/test';
  const fullRef = 'refs/heads/test';
  const sha = master.data.commit.sha;
  const branch = await github.gitdata.createReference({owner, repo, ref:fullRef, sha});

  // const sha = master.data.commit.sha;
  // const branch = await github.gitdata.getReference({owner, repo, ref});
  // console.log(branch.data.object.sha)

  const commit = await github.gitdata.getCommit({owner, repo, sha});
  console.log(commit);
  console.log(commit.data.tree.sha);

  const tree = await github.gitdata.getTree({owner, repo, sha: commit.data.tree.sha, recursive: true});

  console.log(tree);
  console.log(tree.data.tree);

  // const content = 'hello world!';
  // const encoding = 'utf-8'; //can be 'base64'
  // const blob = await github.gitdata.createBlob({owner, repo, content, encoding});
  // console.log(blob);
  // console.log(blob.data.sha);

  //mode: The file mode; one of
  //100644 for file (blob),
  //100755 for executable (blob),
  //040000 for subdirectory (tree),
  //160000 for submodule (commit), or
  //120000 for a blob that specifies the path of a symlink
  const newNode = {
    path: 'test/hello.txt',
    mode: '100644',
    type: 'blob',
    // sha: blob.data.sha,
    content: "hello world!"
  }

  const newTree = await github.gitdata.createTree({owner, repo, tree: [newNode], base_tree: tree.data.sha});
  console.log(newTree);

  const newCommit = await github.gitdata.createCommit({owner, repo, message:'test commit', tree: newTree.data.sha, parents:[ commit.data.sha ] });
  console.log(newCommit);

  // const newRef = await github.gitdata.updateReference({owner, repo, ref, sha:newCommit.data.sha});
  const newRef = await github.gitdata.updateReference({owner, repo, ref, sha:newCommit.data.sha});
  console.log(newRef);

  // const pr = await github.pullRequests.create({owner, repo, head: 'test', base: 'master', title:'first one', body: '@jbaxleyiii check me out!'});
  // console.log(pr);

}

module.exports = (robot) => {
  // Your code here
  robot.log('Yay, the app was loaded!');

  // const controller = Botkit.slackbot({});

  // const bot = controller.spawn({
  //     token: process.env.SLACK_TOKEN,
  // });

	// // use RTM
	// bot.startRTM(function(err,bot,payload) {
    // console.log(err);
    // console.log(bot);
    // console.log(payload);
	// });

	// // send webhooks
	// bot.configureIncomingWebhook({url: process.env.SLACK_WEBHOOK });

	// bot.sendWebhook({
    // text: 'Hey from prod!',
	// 	channel: '#apollo-outreach',
	// },function(err,res) {
    // console.log(err);
    // console.log(res);
	// });

  robot.on(['issue_comment.created', 'issue_comment.edited'], context => {
    const name = 'label';
    const command = context.payload.comment.body.match(/^\/([\w]+)\b *(.*)?$/m);

    if (command && this.name === command[1]) {
      const arguments = command[2];
      const labels = arguments.split(/, */);
      return context.github.issues.addLabels(context.issue({labels}));
    }

  });

  robot.on('issue.opened', context => {
    context.payload
  });

  robot.on('issues.opened', async context => {
    console.log(context)

    // `context` extracts information from the event, which can be passed to
    // GitHub API calls. This will return:
    //   {owner: 'yourname', repo: 'yourrepo', number: 123, body: 'Hello World!}
    const params = context.issue({body: 'Hello World!'})

    // Post a comment on the issue
    return context.github.issues.createComment(params)
  })

  // Get an express router to expose new HTTP endpoints
  const app = robot.route('/apollo-bot')

  // Use any middleware
  app.use(require('express').static('public'))

  // Add a new route
  app.get('/hello-world', (req, res) => {
    res.end('Hello World')
  })
}
