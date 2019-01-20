import test from 'ava';
import request from 'supertest';
import Server from './server';

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
    .send( {"responseId":"15e909cc-517b-4478-8780-0edf19148cc1","queryResult":{"queryText":"Welche Ereignisse gab es gestern?","parameters":{"date-time":{"date-time":"2019-01-18T12:00:00+01:00"}},"allRequiredParamsPresent":true,"fulfillmentText":"Entschuldigung. Ich habe gerade nichts gefunden.","fulfillmentMessages":[{"text":{"text":["Entschuldigung. Ich habe gerade nichts gefunden."]}}],"outputContexts":[{"name":"projects/nucleon-ev-events/agent/sessions/7495624a-5ebb-4ef5-aa3a-a0c785b3f2e2/contexts/generic","lifespanCount":4,"parameters":{"date-time.original":"gestern?","telegram_chat_id":9048759,"date-time":{"date-time":"2019-01-18T12:00:00+01:00","date-time.original":"gestern?","date-time.recent":"2019-01-18T12:00:00+01:00","date-time.recent.original":"gestern?","date-time.partial":"2019-01-18T12:00:00+01:00","date-time.partial.original":"gestern?"}}}],"intent":{"name":"projects/nucleon-ev-events/agent/intents/aa6cab84-298b-40d1-bdf7-18e53f810a0a","displayName":"Welche Termine","endInteraction":true},"intentDetectionConfidence":1,"diagnosticInfo":{"end_conversation":true},"languageCode":"de"},"originalDetectIntentRequest":{"source":"telegram","payload":{"data":{"update_id":867355895,"message":{"date":1547923919,"chat":{"id":9048759,"type":"private","first_name":"Marcel","username":"mtrnord"},"from":{"language_code":"de","id":9048759,"is_bot":false,"first_name":"Marcel","username":"mtrnord"},"message_id":75,"text":"Welche Ereignisse gab es gestern?"}},"source":"telegram"}},"session":"projects/nucleon-ev-events/agent/sessions/7495624a-5ebb-4ef5-aa3a-a0c785b3f2e2"});

  t.is(res.status, 200);
});

test("should return 404 when not requesting root", async t => {
  t.plan(1);
  const res = await request(t.context['server'].server)
    .get('/somewhereOverTheRainbowwwss');

  t.is(res.status, 404);
});
