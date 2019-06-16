import { Component, OnInit } from '@angular/core';
import { AppService, FolderType } from '../app.service';
import { AdbClientService } from '../adb-client.service';
import { LoadingSpinnerService } from '../loading-spinner.service';
import { StatusBarService } from '../status-bar.service';
enum FFR{
OFF,LOW,MEDIUM,HIGH,HIGH_TOP
}
enum GPU{
  _2,_4
}
enum CA{
  OFF,ON
}
enum SSO{
  _512,
  _768,
  _1280,
  _1536,
  _2048,
  _2560,
  _3072
}
enum SVR{
  _1024,_1536
}
enum SVB{
  _5Mbps,_15Mbps,_25Mbps
}
@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.css']
})
export class ToolsComponent implements OnInit {
  folder = FolderType;
  isPassword:boolean;
  textToSend:string;
  _textToSend:string[];
  FFR = FFR;
  SVR = SVR;
  SVB = SVB;
  SSO = SSO;
  CA = CA;
  GPU = GPU;
  constructor(public appService:AppService, public adbService:AdbClientService,
              private spinnerService:LoadingSpinnerService,
              private statusService:StatusBarService) { }

  ngOnInit() {  }
  setFFR(ffr:FFR){
    let value:number = 0;
    switch(ffr){
      case FFR.LOW:
        value = 1;
        break;
      case FFR.MEDIUM:
        value = 2;
        break;
      case FFR.HIGH:
        value = 3;
        break;
      case FFR.HIGH_TOP:
        value = 4;
        break;
    }
    this.adbService.shellCommand('"setprop debug.oculus.foveation.level '+value+'"')
      .then(() => this.statusService.showStatus('FFR set OK!!'));
  }
  setGPU(gpu:GPU){
    let value = gpu===GPU._2?2:4;

    this.adbService.shellCommand('"setprop debug.oculus.cpuLevel ' +
      value +
      ' && setprop debug.oculus.gpuLevel ' +
      value +
      '"')
      .then(() => this.statusService.showStatus('CPU/GPU level set OK!!'));
  }
  setCa(ca:CA){
    this.adbService.shellCommand('"setprop debug.oculus.forceChroma '+(ca===CA.ON?1:0)+'"')
      .then(() => this.statusService.showStatus('Chromatic Aberration set OK!!'));
  }
  setSSO(sso:SSO){
    let value:number = 0;
    switch(sso){
      case SSO._512:
        value = 512;
        break;
      case SSO._768:
        value = 768;
        break;
      case SSO._1280:
        value = 1280;
        break;
      case SSO._1536:
        value = 1536;
        break;
      case SSO._2048:
        value = 2048;
        break;
      case SSO._2560:
        value = 2560;
        break;
      case SSO._3072:
        value = 3072;
        break;
    }
    this.adbService.shellCommand('"setprop debug.oculus.textureWidth ' +
      value +
      ' && setprop debug.oculus.textureHeight ' +
      value +
      '"')
      .then(() => this.statusService.showStatus('Texture Resolution set OK!!'));
  }
  setSVB(svb:SVB){
    let value:number = 5000000;
    switch(svb){
      case SVB._5Mbps:
        value = 5000000;
        break;
      case SVB._15Mbps:
        value = 15000000;
        break;
      case SVB._25Mbps:
        value = 25000000;
        break;
    }
    this.adbService.shellCommand('"setprop debug.oculus.videoBitrate ' + value + '"')
      .then(() => this.statusService.showStatus('Video Bitrate set OK!!'));
  }
  setSVR(svr:SVR){
    let value:number = 5000000;
    switch(svr){
      case SVR._1024:
        value = 1024;
        break;
      case SVR._1536:
        value = 1536;
        break;
    }
    this.adbService.shellCommand('"setprop debug.oculus.videoResolution ' + value + '"')
      .then(() => this.statusService.showStatus('Video Resolution set OK!!'));
  }
  setPavlovPermission(){
    this.adbService.shellCommand('pm grant com.davevillz.pavlov android.permission.RECORD_AUDIO')
      .then(() => this.statusService.showStatus('Permission set OK!!'))
  }
  pasteToDevice(){
    this._textToSend = this.textToSend.split('');
    this.textToSend = '';

    this.spinnerService.setMessage('Setting Text...');
    this.spinnerService.showLoader();
    this.inputCharacters()
      .then(() => {
        this.statusService.showStatus('Text sent to the device!!');
        this.spinnerService.hideLoader();
      })
      .catch(e => {
        this.statusService.showStatus(e.toString(), true);
        this.spinnerService.hideLoader();
      });
  }
  inputCharacters(){
    let character = this._textToSend.shift();
    return this.adbService.client
      .shell(
        this.adbService.deviceSerial,
        'input text "' + character + '"'
      )
      .then(this.adbService.ADB.util.readAll)
      .then(res => {
        if (this.textToSend.length) {
          return this.inputCharacters();
        }
      });
  }
}
