import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MusicService {

  constructor(private http: HttpClient) {
  }

  getSongs(): Promise<any> {
    return this.http.get('http://localhost:3000/available')
    .toPromise();
  }

  getSong(song_id): Promise<any> {
    return this.http.get(`http://localhost:3000/song/${song_id}`)
    .toPromise();
  }
}