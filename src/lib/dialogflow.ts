import { WebhookClient } from 'dialogflow-fulfillment';
import { PLATFORMS } from 'dialogflow-fulfillment/src/rich-responses/rich-response';
import { Request } from 'express';
import MeetupIntent from './MeetupIntent';

export default class Dialogflow {
  private readonly request: Request;

  constructor(req: Request) {
    this.request = req;
  }

  public readonly handleIntent = (agent: WebhookClient): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {

      const deIntentMap = new Map<string, (agent: WebhookClient) => void>();
      deIntentMap.set('Default Welcome Intent', this.welcomeDE);
      deIntentMap.set('Default Fallback Intent', this.fallbackDE);

      // console.log(`Request locale: ${agent.locale}`);

      if (agent.requestSource === PLATFORMS.ACTIONS_ON_GOOGLE) {
        deIntentMap.set('Welche Termine', (agentL: WebhookClient): Promise<void> => new MeetupIntent(agentL, this.request).handleAssistant());
      } else {
        deIntentMap.set('Welche Termine', (agentL: WebhookClient): Promise<void> => new MeetupIntent(agentL, this.request).handleAny());
      }

      if (agent.locale === 'de') {
        // @ts-ignore
        this.request.setLocale('de');
        agent.handleRequest(deIntentMap).then(() => {
          resolve(true);
        })
          .catch(e => {
            reject(e);
          });
      } else {
        resolve(false);
      }
    });
  };

  private readonly welcomeDE = (agent: WebhookClient): void => {
    agent.add(`Guten Tag!`);
  };

  private readonly fallbackDE = (agent: WebhookClient): void => {
    agent.add(`Das habe ich nicht verstanden.`);
    agent.add(`Entschuldigung. Kannst du das nochmal sagen?`);
  };
}
