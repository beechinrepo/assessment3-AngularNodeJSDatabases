import { Component, OnInit } from '@angular/core';
import { MusicService } from '../music.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.css']
})
export class PlayComponent implements OnInit {
  list = [];
  songId = 0;

  constructor(private mSvc: MusicService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit() {
    const songId = this.route.snapshot.params.song_id;
    console.log('test: ', this.route.snapshot.params);
    this.mSvc.getSong(songId).then((result) => {
      console.log('Song details: ', result);
      this.list = result; 
    })
  }
}