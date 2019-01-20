import { RxHR } from '@akanass/rx-http-request';
import { Carousel, LinkOutSuggestion } from 'actions-on-google';
import { CarouselOptionItem } from 'actions-on-google/src/service/actionssdk/conversation/helper/option/carousel';
import { OptionItems } from 'actions-on-google/src/service/actionssdk/conversation/helper/option/option';
import { Payload, Text, WebhookClient } from 'dialogflow-fulfillment';
import { PLATFORMS } from 'dialogflow-fulfillment/src/rich-responses/rich-response';
import moment from 'moment';
import { DateTimeParamters } from './DateTimeParameters';
import { Event } from './MeetupInterfaces';

export class Dialogflow {
  private readonly events: Event[] = [];

  public readonly handleIntent = (agent: WebhookClient): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {

      const deIntentMap = new Map<string, (agent: WebhookClient) => void>();
      deIntentMap.set('Default Welcome Intent', this.welcomeDE);
      deIntentMap.set('Default Fallback Intent', this.fallbackDE);

      // console.log(`Request locale: ${agent.locale}`);

      if (agent.requestSource === PLATFORMS.ACTIONS_ON_GOOGLE) {
        deIntentMap.set('Welche Termine', (agentL: WebhookClient) => this.meetup(agentL, 'google'));
        deIntentMap.set('Selected', this.selected);
      } else {
        deIntentMap.set('Welche Termine', (agentL: WebhookClient) => this.meetup(agentL, 'other'));
      }

      if (agent.locale === 'de') {
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

  private readonly selected = (agent: WebhookClient): Promise<void> => {
    return new Promise<void>((resolve) => {
      const conv = agent.conv();

      const inputs = agent.originalRequest['inputs'] as object[];
      inputs.forEach(element => {
        const args = element["arguments"] as object[];
        args.forEach(argument => {
          if (argument["name"] === "OPTION") {
            this.events.forEach(event => {
              if (event.id === argument["textValue"]) {
                conv.close(new LinkOutSuggestion({
                  name: event.name,
                  url: event.link,
                }))
              }
            })
          }
        });
      });


      agent.add(conv);
      resolve();
    });
  };

  private readonly meetup = (agent: WebhookClient, platform: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const community = `OK-Lab-Schleswig-Flensburg`;
      let url: string;
      let startDate: moment.Moment;
      let endDate: moment.Moment;
      const time: DateTimeParamters = agent.parameters['date-time'] as DateTimeParamters;
      if (time.startDate !== undefined || time.endDate !== undefined) {
        startDate = moment(time.startDate).startOf('day');
        endDate = moment(time.endDate).endOf('day');
      } else if (time['date-time'] !== undefined) {
        startDate = moment(time['date-time']).startOf('day');
        endDate = moment(time['date-time']).endOf('day');
      } else {
        reject(new Error('Missing Time data'));
      }

      const startDateString = startDate.toISOString().slice(0, -1);
      const endDateString = endDate.toISOString().slice(0, -1);

      url = `https://api.meetup.com/${community}/events?&sign=true&photo-host=public&has_ended=true&no_earlier_than=${startDateString}&no_later_than=${endDateString}&status=past,upcoming,proposed,suggested`;

      RxHR.get(url).subscribe(
        (data) => {
          if (data.response.statusCode === 200) {
            const json = JSON.parse(data.body);

            json.forEach(element => {
              const event: Event = element as Event;
              this.events.push(event);
            });

            if (platform === 'google') {
              const conv = agent.conv();
              const message: OptionItems<CarouselOptionItem> = {};
              if (this.events.length === 0) {

                if (endDate.isBefore(moment(), 'day')) {
                  conv.close('In dem Zeitraum fanden leider keine Events statt :(');
                } else {
                  conv.close('In dem Zeitraum finden leider keine Events statt :(');
                }
              } else {
                if (endDate.isBefore(moment(), 'day')) {
                  conv.ask('Folgende Events fanden statt:');
                } else {
                  conv.ask('Folgende Events finden statt:');
                }
                this.events.forEach(element => {
                  const dateTime = moment(element.time);
                  dateTime.locale('de');
                  const upperCalendarTime = dateTime.calendar().replace(/^\w/, c => c.toUpperCase());

                  message[element.id] = {
                    description: element.link,
                    title: `${element.name}: ${upperCalendarTime}`
                  };
                });

                message['more'] = {
                  description: `Weitere Events findest du hier: https://www.meetup.com/de-DE/${community}/events`,
                  title: `Weitere Events`
                };

                const listL = new Carousel({
                  items: message
                });
                conv.ask(listL);
              }
              agent.add(conv);
            } else {
              const message: string[] = [];
              if (this.events.length === 0) {
                if (endDate.isBefore(moment(), 'day')) {
                  message.push('In dem Zeitraum fanden leider keine Events statt :(');
                } else {
                  message.push('In dem Zeitraum finden leider keine Events statt :(');
                }
                message.push('');
              } else {
                if (endDate.isBefore(moment(), 'day')) {
                  message.push('Folgende Events fanden statt:');
                } else {
                  message.push('Folgende Events finden statt:');
                }
                message.push('');

                this.events.forEach(element => {
                  const dateTime = moment(element.time);
                  dateTime.locale('de');
                  const upperCalendarTime = dateTime.calendar().replace(/^\w/, c => c.toUpperCase());

                  message.push(`- [${element.name}](${element.link}): ${upperCalendarTime}`);
                });
              }

              message.push('');
              message.push(`Weitere Events findest du hier: https://www.meetup.com/de-DE/${community}/events`);
              const payloadTg = new Payload(PLATFORMS.TELEGRAM, {
                parse_mode: 'Markdown',
                text: message.join('\n')
              });
              agent.add(payloadTg);
            }

            const payloadNull = new Text('Unsupported Platform');
            agent.add(payloadNull);
            resolve();
          } else {
            console.log(data.body);
          }
          reject(new Error('Status Code is not 200'));
        },
        (err) => {
          console.error(err);
          reject(err);
        }
      );
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
