import test from 'ava';
import request from 'supertest';
import { Server } from './server';

test.beforeEach(t => {
  t.context['server'] = new Server(0);
  try {
    t.context['server'].run();
  } catch (e) {
    t.fail(e);
  }
});

test.afterEach(t => {
  try {
    t.context['server'].stop();
  } catch (e) {
    t.fail(e);
  }
});

test("ask for tomorrows meetups", async t => {
  // fixme correct body
  t.plan(1);
  const res = await request(t.context['server'].server)
    .post('/')
    .send({
      "originalDetectIntentRequest": {},
      "queryResult": {
        "allRequiredParamsPresent": true,
        "diagnosticInfo": {
          "end_conversation": true
        },
        "fulfillmentMessages": [
          {
            "text": {
              "text": [
                "Entschuldigung. Ich habe gerade nichts gefunden."
              ]
            }
          }
        ],
        "fulfillmentText": "Entschuldigung. Ich habe gerade nichts gefunden.",
        "intent": {
          "displayName": "Welche Termine",
          "endInteraction": true,
          "name": "projects/nucleon-ev-events/agent/intents/aa6cab84-298b-40d1-bdf7-18e53f810a0a",
        },
        "intentDetectionConfidence": 1,
        "languageCode": "de",
        "parameters": {
          "date": "2019-01-20T12:00:00+01:00",
          "date-period": "",
        },
        "queryText": "Was passiert morgen?"
      },
      "responseId": "822011bf-c32b-467a-bfce-02aa2975de09",
      "session": "projects/nucleon-ev-events/agent/sessions/88d13aa8-2999-4f71-b233-39cbf3a824a0"
    });

  t.is(res.status, 200);
});

test("should return 404 when not requesting root", async t => {
  t.plan(1);
  const res = await request(t.context['server'].server)
    .get('/somewhereOverTheRainbowwwss');

  t.is(res.status, 404);
});
