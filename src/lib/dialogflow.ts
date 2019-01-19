import { WebhookClient } from 'dialogflow-fulfillment';

export class Dialogflow {
  public readonly handleIntent = (agent: WebhookClient):Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
// Run the proper handler based on the matched Dialogflow intent
      const deIntentMap = new Map();
      deIntentMap.set('Default Welcome Intent', this.welcomeDE);
      deIntentMap.set('Default Fallback Intent', this.fallbackDE);

      console.log(`Request locale: ${agent.locale}`);

      deIntentMap.set("Welche Termine", this.meetup);

      if (agent.locale === 'de') {
        agent.handleRequest(deIntentMap).then(() => {
          resolve(true)
        })
        .catch(e => {
          reject(e)
        })
      } else {
        resolve(false)
      }
    });
  };

  private readonly meetup = (agent: WebhookClient):void => {
    console.log(agent.parameters.date);
    agent.add("Test");
  };

  private readonly welcomeDE = (agent: WebhookClient):void => {
    agent.add(`Guten Tag!`);
  };

  private readonly fallbackDE = (agent: WebhookClient):void => {
    agent.add(`Das habe ich nicht verstanden.`);
    agent.add(`Entsschuldigung. Kannst du das nochmal sagen?`);
  }
}
