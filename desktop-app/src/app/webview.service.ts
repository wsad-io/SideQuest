import { Injectable } from '@angular/core';
import { AppService } from './app.service';

@Injectable({
    providedIn: 'root',
})
export class WebviewService {
    webView: any;
    isWebviewOpen: boolean;
    currentAddress: string = 'https://sidequestvr.com';
    isWebviewLoading: boolean = false;
    isLoaded = () => {};
    constructor(private appService: AppService) {
        appService.setWebviewService(this);
    }
    setWebView(webView) {
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
            //this.currentAddress = this.webView.getURL();
            this.isWebviewLoading = true;
            this.webView.insertCSS(customCss);
        });
        this.webView.addEventListener('did-navigate-in-page', () => {
            // setTimeout(() => {
            //   this.webView.executeJavaScript(customJS);
            //   //this.bsaber.getCurrentDeviceSongs();
            // }, 2500);
            // setTimeout(() => {
            //   this.webView.executeJavaScript(customJS);
            //   ///this.bsaber.getCurrentDeviceSongs();
            // }, 4500);
            // setTimeout(() => {
            //   this.webView.executeJavaScript(customJS);
            //   //this.bsaber.getCurrentDeviceSongs();
            // }, 6500);
            // setTimeout(() => {
            //   this.webView.executeJavaScript(customJS);
            //   //this.bsaber.getCurrentDeviceSongs();
            // }, 8500);
            this.currentAddress = this.webView.getURL();
        });
        this.webView.addEventListener('did-stop-loading', async e => {
            this.currentAddress = this.webView.getURL();
            this.isWebviewLoading = false;
            this.webView.insertCSS(customCss);
            this.isLoaded();
            //if (this.bsaber) {
            //this.webView.executeJavaScript(customJS);
            // this.bsaber.getCurrentDeviceSongs();
            //}

            // this.webView.openDevTools();
        });
    }
    back() {
        if (this.webView.canGoBack()) {
            this.webView.goBack();
        }
    }
    forward() {
        if (this.webView.canGoForward()) {
            this.webView.goForward();
        }
    }
    send() {
        this.webView.loadURL(this.currentAddress);
    }
    loadUrl(url: string) {
        this.currentAddress = url;
        this.webView.loadURL(url);
    }
}
