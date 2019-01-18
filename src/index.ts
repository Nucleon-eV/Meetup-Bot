import { Carousel, Response } from 'actions-on-google';
import { Card, Suggestion, WebhookClient } from 'dialogflow-fulfillment';
import express from 'express';

const app = express();

function main():void {
  app.get('/', (req, res) => {
    console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(req.body));
    const agent = new WebhookClient({request: req, response: res});
    handleIntent(agent)
  });

  const port = 3000;
  app.listen(port, () => {
    console.log(`Listening on ${port}`)
  })
}

function handleIntent(agent: WebhookClient):void {
  // Run the proper handler based on the matched Dialogflow intent
  const intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  // if requests for intents other than the default welcome and default fallback
  // is from the Google Assistant use the `googleAssistantOther` function
  // otherwise use the `other` function
  if (agent.requestSource === agent.ACTIONS_ON_GOOGLE) {
    intentMap.set(null, googleAssistantOther);
  } else {
    intentMap.set(null, other);
  }
  agent.handleRequest(intentMap);
}

function googleAssistantOther(agent):void {
  const conv = agent.conv(); // Get Actions on Google library conversation object
  conv.ask('Please choose an item:'); // Use Actions on Google library to add responses
  conv.ask(new Carousel({
    items: {
      'GoogleHomeItemKey': {
        description: 'Google Home is a powerful speaker and voice Assistant.',
        title: 'Google Home'
      },
      'WorksWithGoogleAssistantItemKey': {
        description: 'If you see this logo, you know it will work with the Google Assistant.',
        title: 'Works With the Google Assistant'
      }
    }
  }) as Response);
  // Add Actions on Google library responses to your agent's response
  agent.add(conv);
}

function other(agent):void {
  agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  agent.add(new Card({
      buttonText: 'This is a button',
      text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
      title: `Title: this is a card title`,
    })
  );
  agent.add(new Suggestion(`Quick Reply`));
  agent.add(new Suggestion(`Suggestion`));
  agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
}

function welcome(agent):void {
  agent.add(`Guten Tag!`);
}

function fallback(agent):void {
  agent.add(`Das habe ich nicht verstanden.`);
  agent.add(`Entsschuldigung. Kannst du das nochmal sagen?`);
}

main();
