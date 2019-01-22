import * as fs from 'fs';

export interface ConfigJson {
  api_key: string;
  community: string;
}

let configData: ConfigJson;

export function getConfig(): ConfigJson {
  if (configData == null) {
    fs.readFile('config.json', 'utf8', (err, data) => {
      if (err) {
        throw err;
      }
      configData = JSON.parse(data);
    });
  }

  return configData
}
