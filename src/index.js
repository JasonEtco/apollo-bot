//https://github.com/octokit/rest.js#options for config
const octokit = require('@octokit/rest')({})

const possibleLabels = [
  /^feature$/,
  /^blocking$/,
  /^has-reproduction$/,
  /^good first issue$/,
  /^good first review$/,
  /^docs$/,
]

function addCheckedLabels(context, body) {
  const name = 'label';
  const regex = /^- \[[xX] *(.*)?($|<br>)/gm;
  const single = /^- \[[xX]] *(.*)?$/m;
  const checkedLabels = body.match(regex);
  if(!checkedLabels) return [];

  const matchingLabels = [];

  const labelling = checkedLabels.map(checkedLabel => {
    if (checkedLabel) {
      const matched = checkedLabel.match(single);
      if(matched[1]) {
        const label = matched[1];
        if(possibleLabels.some(rx => rx.test(label))){
          matchingLabels.push(label);
        }
      }
    }
  })
  return matchingLabels;
}

function addCommandLabels(context, body) {
  const name = 'label';
  const regex = /^\/([\w]+)\b *(.*)?$/gm;
  const single = /^\/([\w]+)\b *(.*)?$/m;
  const commands = body.match(regex);
  if(!commands) return [];

  const matchingLabels = [];

  const labelling = commands.map(command => {
    const matched = command.match(single);
    if (command && name === matched[1]) {
      const args = matched[2];
      const labels = args.split(/, */);
      matchingLabels.push(...labels);
    }
  })
  return matchingLabels;
}

module.exports = (robot) => {
  // Your code here
  robot.log('Yay, the app was loaded!');

  //also takes care of pr comments
  robot.on(['issue_comment.created', 'issue_comment.edited'], async context => {
    if(process.env.NODE_ENV === 'production' && context.payload.repository.name === 'apollo-bot')
      return;

    robot.log(event)
    const currentLabels = context.payload.issue.labels;
    const labels = addCommandLabels(context, context.payload.comment.body);
    await context.github.issues.addLabels(context.issue({labels}));
  });

  robot.on(['issues.opened', 'issues.reopened', 'issues.edited'], async context => {
    if(process.env.NODE_ENV === 'production' && context.payload.repository.name === 'apollo-bot')
      return;

    robot.log(event);
    const currentLabels = context.payload.issue.labels;
    const labels = addCheckedLabels(context, context.payload.issue.body);
    labels.push(...addCommandLabels(context, context.payload.issue.body));
    await context.github.issues.addLabels(context.issue({labels}));
  })

  robot.on(['pull_request.opened', 'pull_request.edited'], async context => {
    if(process.env.NODE_ENV === 'production' && context.payload.repository.name === 'apollo-bot')
      return;
    robot.log(event)

    const currentLabels = context.payload.pull_request.labels;
    const labels = addCheckedLabels(context, context.payload.pull_request.body);
    labels.push(...addCommandLabels(context, context.payload.pull_request.body));
    //context.pull_request({labels}) does not return a correct object ¯\_(ツ)_/¯
    //neither does context.github.pullRequests
    await context.github.issues.addLabels(context.issue({labels}));
  });
}
