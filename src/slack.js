const Botkit = require('botkit');

const controller = Botkit.slackbot({});

const bot = controller.spawn({
    token: process.env.SLACK_TOKEN,
});

// use RTM
bot.startRTM(function(err,bot,payload) {
  console.log(err);
  console.log(bot);
  console.log(payload);
});

// send webhooks
bot.configureIncomingWebhook({url: process.env.SLACK_WEBHOOK });

bot.sendWebhook({
  text: 'Hey from prod!',
	channel: '#apollo-outreach',
},function(err,res) {
  console.log(err);
  console.log(res);
});

