import { Component, OnInit } from '@angular/core';
import { MusicService } from '../music.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-available',
  templateUrl: './available.component.html',
  styleUrls: ['./available.component.css']
})
export class AvailableComponent implements OnInit {
  list = [];

  constructor(private mSvc: MusicService, private router: Router) {
  }

  ngOnInit() {
    this.mSvc.getSongs().then((result) => {
      console.log('Songs: ', result);
      this.list = result; 
    })
  }

  nextPage(id: string) {
    this.router.navigate([`play/${id}`]);
  }

}
