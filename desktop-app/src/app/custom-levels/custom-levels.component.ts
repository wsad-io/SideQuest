import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { LoadingSpinnerService } from '../loading-spinner.service';
import { AdbClientService } from '../adb-client.service';
import { StatusBarService } from '../status-bar.service';
import { AppService } from '../app.service';
import { BsaberService, QuestSaberPatchPack } from '../bsaber.service';
@Component({
  selector: 'app-custom-levels',
  templateUrl: './custom-levels.component.html',
  styleUrls: ['./custom-levels.component.css']
})
export class CustomLevelsComponent implements OnInit {
  addPack:QuestSaberPatchPack;
  constructor(public spinnerService:LoadingSpinnerService,
              public adbService:AdbClientService,
              public appService:AppService,
              public statusService:StatusBarService,
              public bsaberService:BsaberService,
              private changes:ChangeDetectorRef) {
    this.adbService.getPackageInfo(this.bsaberService.beatSaberPackage)
      .then(info=>{
        console.log(info);
      })
    this.appService.resetTop();
    appService.webService.isWebviewOpen = false;
    this.appService.setTitle('Beast Saber Custom Levels.');
    this.appService.showCustomActions = true;
    this.resetAddPack();
  }
  resetAddPack(){
    this.addPack = {
      id:'',
      name:'',
      coverImagePath:this.bsaberService.defaultImage
    }
  }
  removeSong(id){
    this.bsaberService.removeSong(id);
    this.bsaberService.getMySongs()
      .then(()=>this.bsaberService.saveJson(this.bsaberService.jSon));
  }
  ngOnInit() {
    this.bsaberService.getMySongs()
      .then(()=>this.orderSongs(true));
    this.bsaberService.hasBackup = this.bsaberService.backupExists();
    this.changes.detectChanges();
  }
  deletePack(){
    this.bsaberService.jSon.packs =
      this.bsaberService.jSon.packs.filter(p=>p.id !== this.addPack.id);
    this.resetAddPack();
    this.bsaberService.saveJson(this.bsaberService.jSon);
  }
  selectImage(){
    this.appService.electron.remote.dialog.showOpenDialog(
      {
        properties: ['openFile'],
        defaultPath: this.adbService.savePath,
        filters: [
          {
            name: 'Cover Images ( JPG,PNG )',
            extensions: ['png', 'jpg'],
          },
        ],
      },
      files => {
        if(files && files.length){
          this.addPack.coverImagePath = files[0];
        }
      });
  }
  addEditPack(){
    if(this.addPack.id){
      let packIndex = this.bsaberService.jSon.packs.map(p=>p.id).indexOf(this.addPack.id);
      if(packIndex>-1){
        this.bsaberService.jSon.packs[packIndex].name = this.addPack.name;
        this.bsaberService.jSon.packs[packIndex].coverImagePath = this.addPack.coverImagePath || this.bsaberService.defaultImage;
        if(this.bsaberService.jSon.packs[packIndex].coverImagePath){
          let imageIcon = this.appService.getBase64Image(this.bsaberService.jSon.packs[packIndex].coverImagePath);
          if(imageIcon) this.bsaberService.jSon.packs[packIndex].icon = imageIcon;
        }
        this.bsaberService.saveJson(this.bsaberService.jSon);
        return this.resetAddPack();
      }
    }
    let pack:QuestSaberPatchPack = {
      id: this.bsaberService.jSon.packs.length.toString(),
      name: this.addPack.name,
      coverImagePath: this.addPack.coverImagePath || this.bsaberService.defaultImage,
      levelIDs: [],
      isOpen:false,
    };
    if(pack.coverImagePath){
      let imageIcon = this.appService.getBase64Image(pack.coverImagePath);
      if(imageIcon) pack.icon = imageIcon;
    }
    this.bsaberService.jSon.packs.push(pack);
    this.resetAddPack();
    this.bsaberService.saveJson(this.bsaberService.jSon);
  }
  orderSongs(isRecent:boolean){
    if(isRecent){
      this.bsaberService.songs = this.bsaberService.songs
        .sort((a, b) => {
          return a.created < b.created
            ? -1
            : a.created > b.created
              ? 1
              : 0;
        })
        .reverse();
    }else{
      this.bsaberService.songs = this.bsaberService.songs.sort((a, b) => {
        let textA = a.name.toUpperCase();
        let textB = b.name.toUpperCase();
        return textA < textB ? -1 : textA > textB ? 1 : 0;
      });
    }
    this.bsaberService.saveJson(this.bsaberService.jSon);
  }
}
