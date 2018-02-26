export class GithubAPI {

  constructor(owner, repo) {
    this.repo = repo;
    this.owner = owner;
    this.fileBlobs = [];
  }

  async authenticate() {
    const githubAsApp = await app.asApp();
    console.log("Installations:")
    const installations = await githubAsApp.apps.getInstallations({});

    this.github = await app.asInstallation(installations.data[0].id);
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
      parents:[ base_commit.data.sha ]
    });
  }

  async pushCommit(branchName, commit) {
    const owner = this.owner;
    const repo = this.repo;
    const ref = `heads/${branchName}`;
    return await this.github.gitdata.updateReference({
      owner,
      repo,
      ref,
      sha:commit.data.sha
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
