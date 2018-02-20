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

app.asApp().then(github => {
  console.log("Installations:")
  github.apps.getInstallations({}).then(console.log);
});

const installationId = 87602;

const asyncFun = async () => {
  const github = await app.asInstallation(installationId);

  const owner = 'apollographql';
  const repo = 'apollo-bot';

  // github.issues.createComment({
  //   owner: 'apollographql',
  //   repo: 'apollo-bot',
  //   number: 1,
  //   body: 'hello world!'
  // });

  const master = await github.repos.getBranch({owner, repo, branch: 'master'});
  console.log(master.data.commit.sha);
  // const ref = 'refs/heads/test';
  // const sha = master.data.commit.sha;
  // const branch = await github.gitdata.createReference({owner, repo, ref, sha});

  const ref = 'heads/test';
  const sha = master.data.commit.sha;
  const branch = await github.gitdata.getReference({owner, repo, ref});
  console.log(branch.data.object.sha)
  const commit = await github.gitdata.getCommit({owner, repo, sha})
  console.log(commit)
  console.log(commit.data.tree.sha)
}

asyncFun();



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
