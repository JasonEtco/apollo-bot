require('dotenv').config()

const octokit = require('@octokit/rest');
const { getClient, getAllRepoNames } = require('../github');

const apolloLabels = [
  {
    name: 'blocking',
    color: 'b60205',
    description: 'Prevents production or dev due to perf, bug, build error, etc..',
  },
  {
    name: 'good first issue',
    color: '7057ff',
    description: 'Issues that are suitable for first-time contributors.',
  },
  {
    name: 'good first review',
    color: '7057ff',
    description: 'PR\'s that are suitable for first-time contributors to review.',
  },
  {
    name: 'feature',
    color: 'a2eeef',
    description: 'Feature: new addition or enhancement to existing solutions',
  },
  {
    name: 'has-reproduction',
    color: '42f44e',
    description: '❤ Has a reproduction in a codesandbox or single minimal repository',
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
  const creationJobs = repos.map(repo => ({
    update: async () => createOrUpdateLabels(client, 'apollographql', repo),
    name: repo,
  }));

  const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }
  const timeout = ms => new Promise(res => setTimeout(res, ms))

  await asyncForEach(creationJobs, async ({ name, update }) => {
    console.log(`trying ${name}`);
    try{
      await update();
      await timeout(100);
    } catch (e) {
      console.log(`failed ${name}`);
      console.error(e);
    }
  });

  return Promise.all(creationJobs)
}

syncLabels().then(process.exit).catch(console.error);
