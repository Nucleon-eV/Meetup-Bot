declare module 'dialogflow-fulfillment' {
  import { DialogflowConversation } from 'actions-on-google';
  import { Request, Response } from 'express';

  export class Card extends RichResponse {
    constructor(card: string | object);

    public setButton(button: {
      text: string,
      url: string,
    }): Card;

    public setImage(imageUrl: string): Card;

    public setText(text: string): Card;

    public setTitle(title: string): Card;

    private getV1ResponseObject_(platform: string): object;

    private getV2ResponseObject_(platform: string): object;

  }

  export class Image extends RichResponse {
    constructor(image: string | {
      imageUrl: string,
      platform: string,
    });

    public setImage(imageUrl: string): Image;

    private getV1ResponseObject_(platform: string): object;

    private getV2ResponseObject_(platform: string): object;

  }

  export class Payload extends RichResponse {
    constructor(platform: string, payload: object, sendAsMessage?: boolean, rawPayload?: boolean);

    public setPayload(payload: string): Payload;

    private getPayload_(platform: string): object;

    private getV1ResponseObject_(platform: string): object;

    private getV2ResponseObject_(platform: string): object;

  }

  export class Suggestion extends RichResponse {
    constructor(suggestion: string | object);

    public setReply(reply: string): Suggestion;

    private addReply_(reply: string): void;

    private getV1ResponseObject_(platform: string): object;

    private getV2ResponseObject_(platform: string): object;

  }

  export class Text extends RichResponse {
    constructor(text: string | object);

    public setSsml(ssml: string): Text;

    public setText(text: string): Text;

    private getV1ResponseObject_(platform: string): object;

    private getV2ResponseObject_(platform: string): object;

  }

  export class RichResponse {
    public setPlatform(platform: string): RichResponse
  }

  export class WebhookClient {
    public locale: string;

    public parameters: object;

    constructor(options: { request: Request, response: Response } | object);

    public clearContext(context: string): WebhookClient;

    public clearOutgoingContexts(): WebhookClient;

    public conv(): DialogflowConversation<any>;

    public end(responses: RichResponse | string | RichResponse[] | string[]): void;

    public existingSuggestion_(platform: string): Suggestion | null;

    public getContext(contextName: string): {
      name: string,
      lifespan: number,
      parameters: object,
    };

    public handleRequest(handler: Map<string, (agent: WebhookClient) => void>): Promise<any>;

    public setContext(context: string | object): WebhookClient;

    public setFollowupEvent(event: string | object): void;

    public add(responses: RichResponse | string | RichResponse[] | string[]): void;

    private addResponse_(response: RichResponse | string): void;

    private existingPayload_(platform: string): Payload | null;

    private send_(): void;
  }
}

declare module 'dialogflow-fulfillment/src/rich-responses/rich-response' {

  export const PLATFORMS: {
    UNSPECIFIED: 'PLATFORM_UNSPECIFIED',
    FACEBOOK: 'FACEBOOK',
    SLACK: 'SLACK',
    TELEGRAM: 'TELEGRAM',
    KIK: 'KIK',
    SKYPE: 'SKYPE',
    LINE: 'LINE',
    VIBER: 'VIBER',
    ACTIONS_ON_GOOGLE: 'ACTIONS_ON_GOOGLE',
  };
}
