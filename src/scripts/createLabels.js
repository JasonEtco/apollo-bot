require('dotenv').config()

const octokit = require('@octokit/rest');
const { getClient } = require('../github');

const apolloLabels = [
  {
    name: 'blocking',
    color: 'b60205',
    description: 'Prevents production or dev due to perf, bug, build error, etc..',
  },
  {
    name: 'good-first-issue',
    color: 'bfdadc',
    description: 'Good issue for a first time contributor to tackle',
  },
  {
    name: 'good-first-review',
    color: 'bfdadc',
    description: 'Good review for a first time contributor to look at',
  },
  {
    name: 'feature',
    color: '5319e7',
    description: 'Feature: new addition',
  },
  {
    name: 'has-reproduction',
    color: '42f44e',
    description: 'Has a reproduction in a codesandbox or single minimal repository',
  },
]

async function paginate (client, method, args = {}) {
  let response = await method(args);
  let {data} = response
  while (client.hasNextPage(response)) {
    response = await client.getNextPage(response)
    data = data.concat(response.data)
  }
  return data
}

async function getAllRepoNames(client) {
  let response = await client.apps.getInstallationRepositories({ per_page: 100 });
  let {data} = response;
  while (client.hasNextPage(response)) {
    response = await client.getNextPage(response)
    data.repositories.push(...response.data.repositories)
  }
  const names = data.repositories.map(({name}) => name);
  return names;
}


async function createOrUpdateLabels(client, owner, repo){
  const getNames = arr => arr.map(({name}) => name.toLowerCase());

  const labels = await paginate(client, client.issues.getLabels, {owner, repo, per_page:100});
  const labelNames = getNames(labels);

  const newLabels = apolloLabels.filter(({ name }) => !labelNames.includes(name));
  const existingLabels = apolloLabels.filter(({ name }) => labelNames.includes(name));

  const createNewLabels = newLabels.map(({name, color, description}) => client.issues.createLabel({owner, repo, name, color, description, headers: {
      accept: 'application/vnd.github.symmetra-preview+json'
  }}));
  const updateLabels = existingLabels.map(({name, color, description}) => client.issues.updateLabel({owner, repo, oldname:name, name, color, description, headers: {
      accept: 'application/vnd.github.symmetra-preview+json'
  }}));

  return Promise.all([...createNewLabels, ...updateLabels]);
}

async function syncLabels() {
  console.log('Authenticating Client');
  const client = await getClient();
  console.log('Fetching Repos');
  const repos = await getAllRepoNames(client);

  console.log('Syncing Labels')
  const creationJobs = repos.map(repo => createOrUpdateLabels(client, 'apollographql', repo));

  return Promise.all(creationJobs)
}

syncLabels().then(process.exit).catch(console.error);
