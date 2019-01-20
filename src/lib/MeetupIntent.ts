import { RxHR, RxHttpRequestResponse } from '@akanass/rx-http-request';
import { BrowseCarousel, BrowseCarouselItem, DialogflowConversation } from 'actions-on-google';
import { Payload, Text, WebhookClient } from 'dialogflow-fulfillment';
import { PLATFORMS } from "dialogflow-fulfillment/src/rich-responses/rich-response";
import moment from 'moment';
import { Observable } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { DateTimeParamters } from './DateTimeParameters';
import { Event } from './MeetupInterfaces';

export default class MeetupIntent {
  private readonly agent: WebhookClient;
  private startDate: moment.Moment;
  private endDate: moment.Moment;
  private startDateString: string;
  private endDateString: string;
  private readonly community = `OK-Lab-Schleswig-Flensburg`;
  private readonly url = `https://api.meetup.com/${this.community}/events?&sign=true&photo-host=public&has_ended=true&no_earlier_than=${this.startDateString}&no_later_than=${this.endDateString}&status=past,upcoming,proposed,suggested`;


  constructor(agent: WebhookClient) {
    this.agent = agent
  }

  public readonly parseTime = (): Observable<void> => {
    return new Observable(observer => {
      const time: DateTimeParamters = this.agent.parameters['date-time'] as DateTimeParamters;
      if (time.startDate !== undefined || time.endDate !== undefined) {
        this.startDate = moment(time.startDate).startOf('day');
        this.endDate = moment(time.endDate).endOf('day');
      } else if (time['date-time'] !== undefined) {
        this.startDate = moment(time['date-time']).startOf('day');
        this.endDate = moment(time['date-time']).endOf('day');
      }

      this.startDateString = this.startDate.toISOString().slice(0, -1);
      this.endDateString = this.endDate.toISOString().slice(0, -1);
      observer.complete()
    });
  };

  public readonly handleAssistant = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const req = this.parseTime().pipe(
        flatMap(() => this.doRequest())
      );
      const conv = this.agent.conv();
      if (this.ensureCapabilities(conv)) {
        this.agent.add(conv);
        resolve()
      }

      req.subscribe(
        data => {
          console.log(data);

          const message: BrowseCarouselItem[] = [];
          if (data.length === 0) {

            if (this.endDate.isBefore(moment(), 'day')) {
              conv.close('In dem Zeitraum fanden leider keine Events statt :(');
            } else {
              conv.close('In dem Zeitraum finden leider keine Events statt :(');
            }
          } else {
            if (this.endDate.isBefore(moment(), 'day')) {
              conv.ask('Folgende Events fanden statt:');
            } else {
              conv.ask('Folgende Events finden statt:');
            }
            data.forEach(element => {
              const dateTime = moment(element.time);
              dateTime.locale('de');
              const upperCalendarTime = dateTime.calendar().replace(/^\w/, c => c.toUpperCase());

              message.push(new BrowseCarouselItem({
                description: upperCalendarTime,
                title: `${element.name}`,
                url: element.link
              }));
            });

            message.push(new BrowseCarouselItem({
              title: `Weitere Events`,
              url: `https://www.meetup.com/de-DE/${this.community}/events`
            }));

            const listL = new BrowseCarousel({
              items: message
            });
            conv.ask(listL);
          }
          this.agent.add(conv)
        },
        error => {
          console.error(error);
          reject(error);
        }
      )
    });
  };

  public readonly handleAny = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const req = this.parseTime().pipe(
        flatMap(() => this.doRequest())
      );

      req.subscribe(
        data => {
          console.log(data);
          const message: string[] = [];
          if (data.length === 0) {
            if (this.endDate.isBefore(moment(), 'day')) {
              message.push('In dem Zeitraum fanden leider keine Events statt :(');
            } else {
              message.push('In dem Zeitraum finden leider keine Events statt :(');
            }
            message.push('');
          } else {
            if (this.endDate.isBefore(moment(), 'day')) {
              message.push('Folgende Events fanden statt:');
            } else {
              message.push('Folgende Events finden statt:');
            }
            message.push('');

            data.forEach(element => {
              const dateTime = moment(element.time);
              dateTime.locale('de');
              const upperCalendarTime = dateTime.calendar().replace(/^\w/, c => c.toUpperCase());

              message.push(`- [${element.name}](${element.link}): ${upperCalendarTime}`);
            });
          }

          message.push('');
          message.push(`Weitere Events findest du hier: https://www.meetup.com/de-DE/${this.community}/events`);
          const payloadTg = new Payload(PLATFORMS.TELEGRAM, {
            parse_mode: 'Markdown',
            text: message.join('\n')
          });
          this.agent.add(payloadTg);
          const payloadNull = new Text('Unsupported Platform');
          this.agent.add(payloadNull);
          resolve();
        },
        error => {
          console.error(error);
          reject(error);
        }
      )
    });
  };

  private readonly ensureCapabilities = (conv: DialogflowConversation<any>): boolean => {
    if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
      conv.ask('Entschuldigung, versuche dies auf einem Bildschirm Gerät oder ' +
        'nutze die Handy Oberfläche im Simulator');
        return true
    }
    if (!conv.surface.capabilities.has('actions.capability.WEB_BROWSER')) {
      conv.ask('Entschuldigung, versuche dies auf einem Gerät mit Browser');
      return true
    }
    return false
  };

  private readonly doRequest = (): Observable<Event[]> => {
    console.log(this.url);
    return RxHR.get(this.url).pipe(
      flatMap(data => this.parseData(data)))
  };

  private readonly parseData = (data: RxHttpRequestResponse<any>): Observable<Event[]> => {
    return new Observable<Event[]>(observer => {
      const events: Event[] = [];
      if (data.response.statusCode === 200) {
        const json = JSON.parse(data.body);

        json.forEach(element => {
          const event: Event = element as Event;
          events.push(event);
        });
        observer.next(events)
      } else {
        observer.error(new Error("Invalid Data. Status Code not equal 200"))
      }
      observer.complete()
    })
  }
}
