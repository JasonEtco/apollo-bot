const createApp = require('./github-app');

function makeApp() {
  const prod = process.env.NODE_ENV === 'production';

  return createApp({
    // Your app id
    id: prod ? process.env.PROD_APP_ID : process.env.APP_ID,
    // The private key for your app, which can be downloaded from the
    // app's settings: https://github.com/settings/apps
    cert: prod ? process.env.PROD_PRIVATE_KEY || require('fs').readFileSync(process.env.PROD_PRIVATE_KEY_PATH) :
    process.env.PRIVATE_KEY || require('fs').readFileSync(process.env.PRIVATE_KEY_PATH)
  });
}

module.exports.GithubAPI = class GithubAPI {

  //client is optional and can be created with an this.authenticate call or getClient
  constructor(owner, repo, client) {
    this.app = makeApp()
    this.repo = repo;
    this.owner = owner;
    this.fileBlobs = [];

    if(client) {
      this.github = client;
    }
  }

  async authenticate() {
    const githubAsApp = await this.app.asApp();
    console.log("Installations:")
    const installations = await githubAsApp.apps.getInstallations({});

    //instance of https://github.com/octokit/rest.js
    this.github = await this.app.asInstallation(installations.data[0].id);
    return this.gitub;
  }

  async readFileContents(branch, filePath) {
    const owner = this.owner;
    const repo = this.repo;
    const commit = await this.getCurrentCommit(branch);

    const tree = await this.github.gitdata.getTree({
      owner,
      repo,
      sha:commit.data.tree.sha,
      recursive: true
    });

    const matchingBlob = tree.data.tree.filter(({ path }) => path === filePath).pop();
    if(!matchingBlob) {
      return null;
    }

    const blob = await this.github.gitdata.getBlob({owner, repo, sha: matchingBlob.sha });
    const content = Buffer.from(blob.data.content, 'base64');
    return content.toString('utf8');
  }

  async addFile(path, content) {
    const owner = this.owner;
    const repo = this.repo;
    const encoding = 'utf-8'; //can be 'base64'
    const blob = await this.github.gitdata.createBlob({owner, repo, content, encoding});
    this.fileBlobs.push({
      sha: blob.data.sha,
      path,
    });
    return blob;
  }

  async createBranch(baseBranchName, newBranchName) {
    const owner = this.owner;
    const repo = this.repo;
    const baseBranch = await this.github.repos.getBranch({owner, repo, branch: baseBranchName});

    const currentCommitSha = baseBranch.data.commit.sha;
    const fullRef = `refs/heads/${newBranchName}`;
    try {
      return await this.github.gitdata.createReference({owner, repo, ref:fullRef, sha: currentCommitSha});
    } catch (e) {
      const ref = `heads/${newBranchName}`;
      return await this.github.gitdata.getReference({owner, repo, ref});
    }
  }

  async getCurrentCommit(branchName) {
    const owner = this.owner;
    const repo = this.repo;

    const branch = await this.github.repos.getBranch({owner, repo, branch: branchName});
    const sha = branch.data.commit.sha;

    return this.github.gitdata.getCommit({owner, repo, sha});
  }

  //adds all of the currently added files
  async createCommit(message, base_commit) {
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
    //120000r a blob that specifies the path of a symlink
    const filesToAdd = this.fileBlobs.map(({sha, path}) => ({
      mode: '100644',
      type: 'blob',
      sha,
      path,
    }));
    this.fileBlob = [];

    const newTree = await this.github.gitdata.createTree({
      owner,
      repo,
      tree: filesToAdd,
      base_tree: tree.data.sha
    });

    return this.github.gitdata.createCommit({
      owner,
      repo,
      message,
      tree: newTree.data.sha,
      parents:[ base_commit.data.sha ]
    });
  }

  async pushCommit(branchName, commit, force=false) {
    const owner = this.owner;
    const repo = this.repo;
    const ref = `heads/${branchName}`;
    return await this.github.gitdata.updateReference({
      owner,
      repo,
      ref,
      sha:commit.data.sha,
      force,
    });
  }

  async openPR(base, head, title, body) {
    const owner = this.owner;
    const repo = this.repo;
    return this.github.pullRequests.create({
      owner,
      repo,
      head,
      base,
      title,
      body
    });

  }
}

module.exports.getClient = async function() {
  const app = makeApp();
  const githubAsApp = await app.asApp();
  const installations = await githubAsApp.apps.getInstallations({});

  const github = await app.asInstallation(installations.data[0].id);
  return github;
}

module.exports.getAllRepoNames = async function getAllRepoNames(client) {

  let response = await client.apps.getInstallationRepositories({ per_page: 100 });
  let {data} = response;
  while (client.hasNextPage(response)) {
    response = await client.getNextPage(response)
    data.repositories.push(...response.data.repositories)
  }
  const names = data.repositories.map(({name}) => name);
  return names;
}
