import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StationValley } from './station-valley';
import { Observable, Observer } from 'rxjs';

import {find, map} from 'rxjs/operators';
import { StationFactory } from './station-factory';

const API = 'http://daten.buergernetz.bz.it/services/weather/station?categoryId=1&lang=de&format=json';

@Injectable()
export class WeatherService {

  private stations: StationValley[] = null;
  private station;

  constructor(private http: HttpClient) { }

  /**
   * Um den Netzwerkverkehr zu minimieren, werden vom Service die Stationen nur einmal über das
   * Internet geladen
   */
  getAll(sortOrder: string): Observable<StationValley[]> {
    if (this.stations != null) {
      return new Observable(((observer: Observer<StationValley[]>) => {
        // Es wird eine Kopie der originalen Stationsliste angelegt und diese Kopie dann sortiert.
        // Eine Kopie wird deshalb erstellt, damit im Template die Liste dann aktualisiert wird.
        // Würde dieselbe Liste - zwar sortiert - zurück geliefert, würde diese im Template nicht
        // aktualisiert
        const stations = this.sort(Object.assign([], this.stations), sortOrder);
        observer.next(stations);
        observer.complete();
      }));
    } else {
      return this.http.get<any>(API)
        // Webservice liefert ein Json-Objekt mit dem Namen rows zurück in dem das Array
        // gespeichert ist
        .pipe(
          map(response => response.rows),
          map(rawStations => rawStations.map(rawStation => StationFactory.fromObject(rawStation))),
          map(stations => this.stations = this.sort(stations, sortOrder)));
    }
  }

  get(code: string) {
      return this.http.get<any>(API).pipe(
        map(response => response.rows),
        map(rawStations => rawStations.map(rawStation => StationFactory.fromObject(rawStation))),
        map(stations => this.station = stations.find(st => st.code === code)));
  }
  getStations(s: string) {
    return this.http.get<any>(API).pipe(
      map(response => response.rows),
      map(rawStations => rawStations.map(rawStation => StationFactory.fromObject(rawStation))),
      map(stations => stations.filter(st => st.name.toLowerCase().startsWith(s.toLowerCase()))));
  }
  private sort(stations: StationValley[], sortOrder: string): StationValley[] {
    switch (sortOrder) {
      case 'name': {
        return stations.sort((s1, s2) => s1.name.localeCompare(s2.name));
      }
      case 'temperature': {
        return stations.sort((s1, s2) =>
          Number.isNaN(s1.t) ? s2.t : Number.isNaN(s2.t) ? -s1.t : s2.t - s1.t);
      }
      case 'precipitation': {
        return stations.sort((s1, s2) =>
          Number.isNaN(s1.n) ? s2.n : Number.isNaN(s2.n) ? -s1.n : s2.n - s1.n);
      }
      case 'airpressure': {
        return stations.sort((s1, s2) =>
          Number.isNaN(s1.p) ? s2.p : Number.isNaN(s2.p) ? -s1.p : s2.p - s1.p);
      }
    }
  }
}
