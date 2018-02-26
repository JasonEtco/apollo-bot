const Botkit = require('botkit');
const commands = require('probot-commands');
const GithubAPI = require('github');

const promisifyAll = require('es6-promisify-all');

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


async function testing(robot) {
  const gh = new GithubAPI('apollographql', 'apollo-bot');
  await gh.authenticate();

  robot.log('create branch');
  await gh.createBranch('master', 'test');
  robot.log('add file');
  await gh.addFile('test/lol', 'secret sauce');
  robot.log('get current');
  const currentCommit = await gh.getCurrentCommit('test');
  robot.log('create commit');
  const newCommit = await gh.createCommit('framework commit', currentCommit);
  robot.log('push commit');
  await gh.pushCommit('test', newCommit);
  robot.log('open pr');
  await gh.openPR('master', 'test', 'framework pr', 'body')
  return;
}

const possibleLabels = [
  /Feature/,
  /Bug: prod/,
  /Bug: blocks-dev/,
  /Bug: has-workaround/,
  /Impact: \w/,
  /good-first-issue/,
]

async function addCheckedLabels(context, body) {
  const name = 'label';
  const regex = /^- \[x] *(.*)?($|<br>)/gm;
  const single = /^- \[x] *(.*)?$/m;
  const commands = body.match(regex);

  const currentLabels = context.payload.issue.labels;
  const matchingLabels = [];

  const labelling = commands.map(command => {
    if (command) {
      const matched = command.match(single);
      const args = matched[1];
      const labels = args.split(/, */).map(str => str.replace('<br></br>', ''));
      matchingLabels.push(...labels.filter(label => possibleLabels.some(rx => rx.test(label))));
    }
  })
  await context.github.issues.addLabels(context.issue({labels:matchingLabels}));
}

async function addCommandLabels(context, body) {
  const name = 'label';
  const regex = /^\/([\w]+)\b *(.*)?$/gm;
  const single = /^\/([\w]+)\b *(.*)?$/m;
  const commands = body.match(regex);

  const currentLabels = context.payload.issue.labels;
  const matchingLabels = [];

  const labelling = commands.map(command => {
    const matched = command.match(single);
    if (command && name === matched[1]) {
      const args = matched[2];
      const labels = args.split(/, */);
      matchingLabels.push(...labels);
    }
  })
  await context.github.issues.addLabels(context.issue({labels:matchingLabels}));
}

module.exports = (robot) => {
  // Your code here
  robot.log('Yay, the app was loaded!');

  ['issue_comment.created', 'issue_comment.edited'].forEach(event => {
    robot.on(event, async context => {
      robot.log(event)
      await addCommandLabels(context, context.payload.comment.body);
    });
  });

  ['issues.opened', 'issues.reopened', 'issues.edited'].forEach(event => {
    robot.on(event, async context => {
      robot.log(event);
      await addCheckedLabels(context, context.payload.issue.body);
      await addCommandLabels(context, context.payload.issue.body);
    })
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
