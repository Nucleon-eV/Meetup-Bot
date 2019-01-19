import compression from 'compression';
import { WebhookClient } from 'dialogflow-fulfillment';
import express from 'express';
import helmet from 'helmet';
import * as http from "http";
import { Dialogflow } from './lib/dialogflow';

const app = express();

export class Server {
  public server: http.Server;
  private readonly port: number;
  private readonly dialogflow: Dialogflow = new Dialogflow();

  constructor(port: number) {
    this.port = port
  }
  public readonly run = () => {
    app.use(express.json());       // to support JSON-encoded bodies
    app.use(helmet());
    app.use(compression());
    app.post('/', (req, res) => {
      console.log(`Dialogflow Request headers: ${JSON.stringify(req.headers)}`);
      console.log(`Dialogflow Request body: ${JSON.stringify(req.body)}`);
      const agent = new WebhookClient({request: req, response: res});
      this.dialogflow.handleIntent(agent).then(state => {
        if (!state) {
          res.sendStatus(500)
        } else {
          res.end()
        }
      })
      .catch((e: Error) => {
        console.error(e);
        res.status(500).send(e.message)
      });
    });

    this.server = app.listen(this.port, () => {
      console.log(`Listening on ${this.port}`)
    })
  };

  public readonly stop = () => {
    this.server.close();
  }
}