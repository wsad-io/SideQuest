import { Injectable } from '@angular/core';
import { AppService } from './app.service';

@Injectable({
  providedIn: 'root'
})
export class WebviewService {
  webView:any;
  isWebviewOpen:boolean;
  constructor(private appService:AppService) {
    appService.setWebviewService(this);
  }
  setWebView(webView){
    this.webView = webView;
    this.setupWebview();
  }
  setupWebview() {
    let customCss = `
            ::-webkit-scrollbar {
                height: 16px;
                width: 16px;
                background: #e0e0e0;
            }
            ::-webkit-scrollbar-corner {
                background: #cfcfcf;
            }
            ::-webkit-scrollbar-thumb {
                background: #ed4e7a;
            }
            .-sidequest{
                background-image: url('https://i.imgur.com/Hy2oclv.png');
                background-size: 12.814px 15px;
            }
            .bsaber-tooltip.-sidequest::after {
                content: "Add to SideQuest";
            }
            .-sidequest-remove{
                background-image: url('https://i.imgur.com/5ZPR9L1.png');
                background-size: 15px 15px;
            }
            .bsaber-tooltip.-sidequest-remove::after {
                content: "Remove Custom Level";
            }`;
    //[].slice.call(document.querySelectorAll('.bsaber-tooltip.-beatsaver-viewer')).forEach(e=>e.style.display = 'none');
    let customJS = `
            [].slice.call(document.querySelectorAll('.bsaber-tooltip.-beatdrop')).forEach(e=>e.style.display = 'none');
            [].slice.call(document.querySelectorAll('.bsaber-tooltip.-download-zip')).forEach(e=>{
                e.style.display = 'none';
                //let hrefParts = e.href.split('/');
                //let songIdParts = hrefParts[hrefParts.length-1].split('-');
                
                let isAlready = !!e.parentElement.querySelector('.action.post-icon.bsaber-tooltip.-sidequest');
                if(isAlready) return;
                let downloadButton = document.createElement('a');
                downloadButton.className = 'action post-icon bsaber-tooltip -sidequest';
                downloadButton.href='javascript:void(0)';
                downloadButton.addEventListener('click',()=>{
                    window.Bridge.sendMessage(
                        JSON.stringify({
                            beatsaber:e.href
                        })
                    );
                });
                let removeButton = document.createElement('a');
                removeButton.className = 'action post-icon bsaber-tooltip -sidequest-remove';
                removeButton.style.display = 'none';
                removeButton.href='javascript:void(0)';
                removeButton.addEventListener('click',()=>{
                    window.Bridge.sendMessage(
                        JSON.stringify({
                            beatsaberRemove:hrefParts[hrefParts.length-1]
                        })
                    );
                });
                let alreadyInstalled = document.createElement('span');
                alreadyInstalled.className = 'beat-already-installed';
                alreadyInstalled.innerText = 'INSTALLED';
                alreadyInstalled.style.display = 'none';
                e.parentElement.appendChild(removeButton);
                e.parentElement.appendChild(downloadButton);
                e.parentElement.appendChild(alreadyInstalled);
            });
        `;
    // let webaddress = document.getElementById('web_address');
    // let back_button = document.querySelector('.browser-back-button');
    // let forward_button = document.querySelector('.browser-forward-button');
    // let send_button = document.querySelector('.browser-send-button');
    // let fix_address = () => {
    //   if (
    //     webaddress.value.substr(0, 7) !== 'http://' &&
    //     webaddress.value.substr(0, 8) !== 'https://'
    //   )
    //     webaddress.value = 'http://' + webaddress.value;
    // };
    // webaddress.addEventListener('keyup', e => {
    //   if (e.keyCode === 13) {
    //     fix_address();
    //     this.beatView.loadURL(webaddress.value);
    //   }
    // });

    this.webView.addEventListener('did-start-loading', e => {
      //webaddress.value = this.beatView.getURL();
      //this.browser_loading.style.display = 'inline-block';
      this.webView.insertCSS(customCss);
    });
    this.webView.addEventListener('did-navigate-in-page', () => {
      setTimeout(() => {
        this.webView.executeJavaScript(customJS);
        //this.bsaber.getCurrentDeviceSongs();
      }, 2500);
      setTimeout(() => {
        this.webView.executeJavaScript(customJS);
        ///this.bsaber.getCurrentDeviceSongs();
      }, 4500);
      setTimeout(() => {
        this.webView.executeJavaScript(customJS);
        //this.bsaber.getCurrentDeviceSongs();
      }, 6500);
      setTimeout(() => {
        this.webView.executeJavaScript(customJS);
        //this.bsaber.getCurrentDeviceSongs();
      }, 8500);
    });
    this.webView.addEventListener('did-stop-loading', async e => {
      //webaddress.value = this.beatView.getURL();
      //this.browser_loading.style.display = 'none';
      this.webView.insertCSS(customCss);
      //if (this.bsaber) {
        this.webView.executeJavaScript(customJS);
       // this.bsaber.getCurrentDeviceSongs();
      //}
    });
    // send_button.addEventListener('click', () => {
    //   fix_address();
    //   this.beatView.loadURL(webaddress.value);
    // });
    // back_button.addEventListener('click', () => {
    //   if (this.beatView.canGoBack()) {
    //     this.beatView.goBack();
    //   }
    // });
    // forward_button.addEventListener('click', () => {
    //   if (this.beatView.canGoForward()) {
    //     this.beatView.goForward();
    //   }
    // });
    //this.webView.openDevTools();
  }
}
