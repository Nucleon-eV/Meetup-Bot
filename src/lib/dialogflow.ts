import {RxHR} from "@akanass/rx-http-request";
import { WebhookClient } from 'dialogflow-fulfillment';

export class Dialogflow {
  public readonly handleIntent = (agent: WebhookClient):Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
// Run the proper handler based on the matched Dialogflow intent
      const deIntentMap = new Map<string, (agent: WebhookClient)=>void>();
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

  private readonly meetup = (agent: WebhookClient):Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      console.log(agent.parameters['date-time']);
      const community = `OK-Lab-Schleswig-Flensburg`;
      RxHR.get(`https://api.meetup.com/${community}/events?&sign=true&photo-host=public`).subscribe(
        (data) =>  {
          if (data.response.statusCode === 200) {
            console.log(data.body); // Show the HTML for the Google homepage.
            agent.add("Test");
            resolve()
          }
          reject(new Error("Status Code is not 200"))
        },
        (err) => {
          console.error(err);
          reject(err)
        }
      );
    });
  };

  private readonly welcomeDE = (agent: WebhookClient):void => {
    agent.add(`Guten Tag!`);
  };

  private readonly fallbackDE = (agent: WebhookClient):void => {
    agent.add(`Das habe ich nicht verstanden.`);
    agent.add(`Entsschuldigung. Kannst du das nochmal sagen?`);
  }
}
