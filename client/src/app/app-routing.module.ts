import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AvailableComponent } from './components/available.component';
import { PlayComponent } from './components/play.component';

const routes: Routes = [
  { path: '', component: AvailableComponent },
  { path: 'available', component: AvailableComponent },
  { path: 'play/:song_id', component: PlayComponent },
  { path: '**', redirectTo: '/', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
