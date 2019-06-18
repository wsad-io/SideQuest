import { ApplicationRef, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { BsaberService } from '../bsaber.service';
import { DragulaService } from 'ng2-dragula';
import { Subscription } from 'rxjs/Subscription';
export interface SongItem{
  id:string;
  name:string;
  path:string;
  cover:string;
  created:number;
}
@Component({
  selector: 'app-song-pack-manager',
  templateUrl: './song-pack-manager.component.html',
  styleUrls: ['./song-pack-manager.component.css']
})
export class SongPackManagerComponent implements OnInit {
  @ViewChild('song_container',{static:false}) song_container;
  @ViewChild('pack_container',{static:false}) pack_container;
  BAG = "DRAGULA_EVENTS";
  subs = new Subscription();
  public constructor(private dragulaService: DragulaService,public bsaberService:BsaberService,private changeRef:ApplicationRef) {

    dragulaService.createGroup('SONGS', {
      copy: (el, source)=> {
        return source === this.song_container.nativeElement;
      },
      accepts: (el, target)=> {
        return (
          target !== this.song_container.nativeElement &&
          ((el.parentElement === this.pack_container.nativeElement &&
            target === this.pack_container.nativeElement) ||
            (el.parentElement !== this.pack_container.nativeElement &&
              target !== this.pack_container.nativeElement))
        );
      },
      moves: (el, source, handle, sibling)=> {
        return !~el.className.indexOf('add-to-drag'); // elements are always draggable by default
      },
      // mirrorContainer: document.querySelector(
      //   '.temp-move-container'
      // ),
    });
    // var scroll = autoScroll([window, this.pack_container.nativeElement], {
    //   margin: 150,
    //   autoScroll: function() {
    //     return this.down && songsDrake.dragging;
    //   },
    // });
    this.subs.add(dragulaService.drag(this.BAG)
      .subscribe(({ el }) => {
        //this.removeClass(el, 'ex-moved');
      })
    );
    this.subs.add(dragulaService.drop(this.BAG)
      .subscribe(({ el }) => {
        //this.addClass(el, 'ex-moved');
      })
    );
    this.subs.add(dragulaService.over(this.BAG)
      .subscribe(({ el, container }) => {
        console.log('over', container);
        //this.addClass(container, 'ex-over');
      })
    );
    this.subs.add(dragulaService.out(this.BAG)
      .subscribe(({ el, container }) => {
        console.log('out', container);
        //this.removeClass(container, 'ex-over');
      })
    );
  }
  ngOnDestroy(){
    this.dragulaService.destroy('SONGS');
    this.subs.unsubscribe();
  }
  ngOnInit() {
  }
  uniquePack(pack){
    let keys = {};
    pack.levelIDs = pack.levelIDs.filter((a)=> {
      let key = a.id + '|' + a.name;
      if (!keys['_'+key]) {
        keys['_'+key] = true;
        return true;
      }
    });
    pack.isOpen = false;
    setTimeout(()=>pack.isOpen = true,100);
  }
  sortPack(pack){
    pack.levelIDs = pack.levelIDs.sort((a, b) => {
      let textA = a.name.toUpperCase();
      let textB = b.name.toUpperCase();
      return textA < textB ? -1 : textA > textB ? 1 : 0;
    });
  }
}
