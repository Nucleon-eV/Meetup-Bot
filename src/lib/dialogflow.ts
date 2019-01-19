import {RxHR} from "@akanass/rx-http-request";
import { Payload, Text, WebhookClient } from 'dialogflow-fulfillment';
import { PLATFORMS } from 'dialogflow-fulfillment/src/rich-responses/rich-response';
import moment from 'moment';
import { Event } from './MeetupInterfaces';

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
      const community = `OK-Lab-Schleswig-Flensburg`;
      const startDate = moment(agent.parameters['date-time']['startDate']).toISOString().slice(0, -1);
      const endDate = moment(agent.parameters['date-time']['endDate']).toISOString().slice(0, -1);
      console.log(startDate);
      console.log(endDate);
      RxHR.get(`https://api.meetup.com/${community}/events?&sign=true&photo-host=public&has_ended=true&no_earlier_than=${startDate}&no_later_than=${endDate}`).subscribe(
        (data) =>  {
          if (data.response.statusCode === 200) {
            const json = JSON.parse(data.body);
            const events: Event[] = [];

            json.forEach(element => {
              const event: Event = element as Event;
              events.push(event)
            });

            const message: string[] = [];
            if (events.length === 0) {
              message.push("In dem Zeitraum finden leider keine Events statt :(");
              message.push("");
            } else {
              message.push("Folgende Events finden statt:");
              message.push("");

              events.forEach(element => {
                const dateTime = moment(element.time);
                dateTime.locale("de");
                const upperCalendarTime = dateTime.calendar().replace(/^\w/, c => c.toUpperCase());

                message.push(`- [${element.name}](${element.link}): ${upperCalendarTime}`)
              });
            }

            message.push("");
            message.push(`Weitere Events findest du hier: https://www.meetup.com/de-DE/${community}/events`);

            const payloadTg = new Payload(PLATFORMS.TELEGRAM, {
              parse_mode: "Markdown",
              text: message.join("\n"),
            });
            const payloadNull = new Text(message.join("\n"));
            agent.add(payloadTg);
            agent.add(payloadNull);
            resolve()
          } else {
            console.log(data.body)
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
    agent.add(`Entschuldigung. Kannst du das nochmal sagen?`);
  }
}
