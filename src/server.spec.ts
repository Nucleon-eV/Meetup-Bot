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
    .send({"responseId":"d7357d38-33d4-4fec-9333-5e494841a4dd","queryResult":{"queryText":"was ist nächste woche?","parameters":{"date-time":{"startDate":"2019-01-21T12:00:00+01:00","endDate":"2019-01-27T12:00:00+01:00"}},"allRequiredParamsPresent":true,"fulfillmentText":"Entschuldigung. Ich habe gerade nichts gefunden.","fulfillmentMessages":[{"text":{"text":["Entschuldigung. Ich habe gerade nichts gefunden."]}}],"intent":{"name":"projects/nucleon-ev-events/agent/intents/aa6cab84-298b-40d1-bdf7-18e53f810a0a","displayName":"Welche Termine","endInteraction":true},"intentDetectionConfidence":0.97,"diagnosticInfo":{"end_conversation":true},"languageCode":"de"},"originalDetectIntentRequest":{"payload":{}},"session":"projects/nucleon-ev-events/agent/sessions/997a4e5b-45bc-2847-a722-b146e19e31dc"});

  t.is(res.status, 200);
});

test("should return 404 when not requesting root", async t => {
  t.plan(1);
  const res = await request(t.context['server'].server)
    .get('/somewhereOverTheRainbowwwss');

  t.is(res.status, 404);
});
