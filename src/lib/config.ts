import * as fs from 'fs';
import { bindNodeCallback, Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';

export interface ConfigJson {
  api_key: string;
  community: string;
}

const readFileAsObservable = bindNodeCallback((
  path: string,
  encoding: string,
  callback: (error: Error, data: string) => void
) => fs.readFile(path, encoding, callback));

let configData: ConfigJson;

export function getConfig(): Observable<ConfigJson> {
  if (configData === undefined) {
    return readFileAsObservable('config.json', 'utf8').pipe(
      concatMap((data: string) => {
        configData = JSON.parse(data);
        return new Observable<ConfigJson>(observer => {
          observer.next(configData);
          observer.complete()
        })
      })
    );
  }

  return new Observable<ConfigJson>(observer => {
    observer.next(configData);
    observer.complete()
  })
}
