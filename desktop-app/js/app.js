class App{
    constructor(){
        this.spinner_drag = document.querySelector('.spinner-drag');
        this.spinner_background = document.querySelector('.spinner-background');
        this.spinner_loading_message = document.querySelector('.spinner-loading-message');
        this.repos = new Repos(this);
        this.reset_patch_base = document.querySelector('.reset-patch-base');
        this.make_backup = document.querySelector('.make-backup');
        this.sync_songs_now = document.querySelector('.sync-songs-now');
        this.add_repo = document.querySelector('.add-repo');
        this.sync_songs = document.querySelector('.sync-songs');
        this.add_repo_button = document.querySelector('.add-repo-button');
        this.add_repo_url = document.querySelector('#repoUrl');
        this.menu_container = document.querySelector('.menu-items');
        this.filter_select = document.querySelector('#filterDropdown');
        this.filter_select.addEventListener('change',()=>this.searchFilter());
        this.apkInstall = document.querySelector('.apk-install')
        this.search_box = document.querySelector('#searchBox');
        this.search_box.addEventListener('keyup',()=>this.searchFilter());
        this.browser_bar = document.getElementById('browser-bar');
        this.container = document.querySelector('#container');
        this.browser_loading = document.querySelector('.browser-loading');
        this.beatView = document.getElementById('beatView');
        this.setupInstructions = document.querySelector('#setupInstructions');
        this.deviceSettings = document.querySelector('#deviceSettings');
        this.backupTemplate = document.querySelector('#backupItem');
        this.appItem = document.querySelector('#appItem');
        this.template = document.querySelector('#listItem');
        this.appVersion = document.querySelector('#appVersion');
        this.packageItem = document.querySelector('#packageItem');
        this.statusbar = document.querySelector('.status-bar');
        this.statusmessage = document.querySelector('.status-message');
        this.statuscopy = document.querySelector('.copy-status');
        this.restore_backup = document.querySelector('.restore-backup-button');
        this.restore_backup.addEventListener('click',()=>this.openBackups());
        this.sync_selected_button = document.querySelector('.sync-selected-button');
        this.sync_selected_button.addEventListener('click',()=>this.openSyncSelected());
        this.patch_make_data_backup = document.querySelector('.patch-make-data-backup');
        this.title = document.querySelector('.header-title');
        this.searchFilterContainer = document.querySelector('#searchFilterContainer');
        this.setup_menu = document.querySelector('.setup-menu');
        this.add_menu = document.querySelector('.add-menu');
        this.enable_wifi = document.querySelector('#enable-wifi');

        ipcRenderer.on('open-url',(event , data)=>{
            this.open_url_custom = data;
            if(this.open_url_custom){
                let url = this.open_url_custom.split('#');
                switch(url[0]){
                    case "sidequest://repo/":
                        this.repos.addRepoInput(url[1])
                            .then(()=>this.repos.openMenuRepos());
                        break;
                    case "sidequest://sideload/":
                        this.toggleLoader(true);
                        this.spinner_loading_message.innerText = 'Installing APK...';
                        this.setup.installApk(url[1])
                            .then(()=>{
                                this.toggleLoader(false);
                                this.showStatus('APK installed!!');
                            });
                        break;
                    case "sidequest://bsaber/":
                        // coming soon.
                        break;
                    default:
                        this.showStatus('Custom protocol not recognised: '+(data||""),true,true);
                        break;
                }
            }
        });
        ipcRenderer.on('info' , (event , data)=>{
            try{
                data = JSON.parse(data);
                if(data.beatsaber){
                    if(this.bsaber){
                        this.spinner_loading_message.innerText = 'Saving to My Custom Levels...';
                        this.toggleLoader(true);
                        this.bsaber.downloadSong(data.beatsaber)
                            .then(()=>{
                                this.getMySongs()
                                    .then(()=>this.toggleLoader(false))
                                    .then(()=>this.showStatus('Level Downloaded Ok!!'))
                                    .then(()=>this.bsaber.getCurrentDeviceSongs(true));
                            })
                            .catch(e=>{
                                this.showStatus(e.toString(),true,true);
                                this.toggleLoader(false);
                            })
                    }
                }
                if(data.beatsaberRemove){
                    if(this.bsaber) {
                        this.spinner_loading_message.innerText = 'Removing Beatsaber Song...';
                        this.toggleLoader(true);
                        this.bsaber.removeSong(data.beatsaberRemove)
                        // .then(()=>new Promise(r=>setTimeout(r,500)))
                            .then(()=>this.getMySongs())
                            .then(() => this.bsaber.getCurrentDeviceSongs(true))
                            .then(() => this.toggleLoader(false))
                            .catch(e => {
                                this.showStatus(e.toString(),true,true);
                                this.toggleLoader(false);
                            });
                    }
                }
            }catch(e){

            }
        });
        M.AutoInit();
        this.mkdir(appData)
            .then(()=>this.mkdir(path.join(appData,'bsaber-backups')))
            .then(()=>this.mkdir(path.join(appData,'tmp')))
            .then(()=>this.mkdir(path.join(appData,'bsaber-data-backups')))
            .then(()=>this.mkdir(path.join(appData,'bsaber')))
            .then(()=>this.mkdir(path.join(appData,'saber-quest-patch')))
            .then(async ()=>{
                if(!fs.existsSync(path.join(appData,'sources.txt'))){
                    fs.createReadStream(path.join(__dirname,'sources.txt')).pipe(fs.createWriteStream(path.join(appData,'sources.txt')));
                }
                this.current_data = [];
                this.setup = new Setup(this);
                this.toggleLoader(true);
                this.spinner_loading_message.innerText = 'Downloading, This might take some time on first launch please wait...';
                await this.setup.setup();
                this.setupMenu();
                this.getMySongs().then(()=>this.setupWebview());
                this.repos.setupRepos();
                this.bsaber = new Bsaber(this);
                this.bsaber.downloadConverterBinary();
                //this.bsaber.hasRightJavaVersion = await this.bsaber.checkJava64();
                this.spinner_loading_message.innerText = 'Downloading, This might take some time on first launch please wait...';
                this.bsaber.downloadQuestSaberPatch();
                //this.bsaber.downloadAppSigner();
                this.bsaber.setBeatVersion()
                    .catch(e=>{});
            });
    }
    async mkdir(path){
        return new Promise(resolve=>{
            fs.mkdir(path,resolve);
        })
    }
    setupMenu(){
        document.querySelector('.select-new-base').addEventListener('click',()=>{
            dialog.showOpenDialog({
                properties: ['openFile'],
                filters:[
                    { name: 'Android APK File', extensions: ['apk'] }
                ]
            }, (files)=> {
                this.backupsModal.close();
                this.toggleLoader(true);
                this.spinner_loading_message.innerText = 'Copying APK...';
                if (files !== undefined && files.length===1) {
                    let current_path = path.join(appData,'bsaber-base.apk');
                    if(this.setup.doesFileExist(current_path)){
                        fs.copyFileSync(current_path,path.join(appData,'bsaber-backups','bsaber-base-old.apk'));
                    }
                    fs.copyFileSync(files[0],current_path);
                    fs.copyFileSync(files[0],path.join(appData,'bsaber-backups','bsaber-base.apk'));
                    this.showStatus('Master base APK file backed up and replaced!!')
                }else if(files !== undefined && files.length!==1){
                    this.showStatus('One select one APK file!',true,true);
                }
                this.toggleLoader(false);
            });
        });
        this.reset_patch_base.addEventListener('click',()=>{
            let copied = this.bsaber.resetPatched();
            if(copied){
                this.showStatus("Reset completed ok.");
            }else{
                this.showStatus("Error resetting, base does not exist!!",true,true);
            }
            this.backupsModal.close();
        });
        this.patch_make_data_backup.addEventListener('click',()=>{
            this.patchModal.close();
            this.bsaber.backUpBeatSaberBinary()
                .catch(e=>{
                    this.showStatus(e.toString(),true,true);
                });
        });
        this.patch_beatsaber = document.querySelector('.patch-beatsaber');
        this.patch_beatsaber.addEventListener('click',()=>{
            let songs = (this.songs||[]).filter(d=>d.enabled);
            let questSaberPatchContainer = document.getElementById('questSaberPatchContainer');
            if(this.patch_beatsaber.style.display !== 'none'&&songs.length){
                questSaberPatchContainer.innerHTML = '<br><br><div style="text-align: center"><div class="loader-initial"></div><br>Patching now, <br>this should take 40 - 60 seconds...</div>';
                this.patch_beatsaber.style.display = 'none';
                this.bsaber.runQuestSaberPatch(songs)
                    .then(result=>{
                        if(result&&result.error){
                            return Promise.reject(result.error);
                        }
                        let skipped = Object.keys(result&&result.installSkipped?result.installSkipped:{}).map(d=>{
                            return "&nbsp;&nbsp;<b>"+d+"</b>:"+result.installSkipped[d];
                        });
                        questSaberPatchContainer.innerHTML = `<br><h6>Patch Results</h6>
                            <b>Current Levels</b>: `+(result&&result.presentLevels?result.presentLevels:[]).join(', ')+`<br><br>
                            <b>Just Installed</b>: `+(result&&result.installedLevels?result.installedLevels:[]).join(', ')+`<br><br>
                            <b>Skipped</b>: <br>`+(skipped.length?skipped.join('<br>'):'none')+`<br><br><a class="waves-effect waves-light btn install-beat-patch">Install APK to Headset</a>`;
                        return questSaberPatchContainer.querySelector('.install-beat-patch');
                    })
                    .then(ele=>new Promise(r=>{
                        if(ele){
                            ele.addEventListener('click',()=>{
                                questSaberPatchContainer.innerHTML = '<br><br><div style="text-align: center"><div class="loader-initial"></div><br><span id="patch-loading-message">Installing now, <br>this should take 60 - 90 seconds...</span></div>';
                                r();
                            });
                        }
                    }))
                    //.then(()=>this.bsaber.signAPK(path.join(appData,'bsaber-base_patched.apk')))
                    .then(()=>this.setup.uninstallApk('com.beatgames.beatsaber'))
                    .then(()=>this.setup.installLocalApk(path.join(appData,'bsaber-base_patched.apk'),true))
                    .then(()=>{
                        questSaberPatchContainer.innerHTML = '<br><br><h4>Install complete!</h4><br><br>Click close to continue...';
                    })
                    .then(()=>this.showStatus('Patching complete. You can now enjoy your custom levels!!'))
                    .catch(e=>{
                        this.showStatus(e.toString(),true,true);
                        questSaberPatchContainer.innerHTML = `<br><h6>Install Failed</h6>
                            There was an error installing. Before you see it, would you like to reset your beat saber patched and installed APK from a backup base? ( Recommended )
                            <br><br><a class="waves-effect waves-light btn install-base-reset">Reset To Base</a>`;
                        questSaberPatchContainer.querySelector('.install-base-reset').addEventListener('click',()=>{
                            this.patchModal.close();
                            this.spinner_loading_message.innerText = 'Installing Base APK';
                            this.toggleLoader(true);
                            this.setup.installLocalApk(path.join(appData,'bsaber-base.apk'),true)
                                .then(()=>this.toggleLoader(false))
                                .then(()=>{
                                    if(!this.bsaber.resetPatched()){
                                        return Promise.reject(new Error("Failed to reset the patched base, the base backup does not exist."));
                                    }
                                })
                                .catch(e2=>{
                                    this.showStatus(e.toString()+", "+e2.toString(),true,true);
                                });
                        });
                    })
            }else{
                this.patchModal.close();
                this.showStatus('Something went wrong, do you have any songs selected?',true,true);
            }
        });
        this.statuscopy.addEventListener('click',()=>this.copyStatus());
        document.querySelector('.close-status').addEventListener('click',()=>this.hideStatus());
        document.querySelector('.open-backup').addEventListener('click',()=>{
            shell.openItem(path.join(appData,'bsaber-backups'));
        });
        document.querySelector('.open-data-backup-folder').addEventListener('click',()=>{
            shell.openItem(path.join(appData,'bsaber-data-backups'));
        });
        document.querySelector('.make-data-backup').addEventListener('click',()=>{
            this.backupsModal.close();
            this.toggleLoader(true);
            this.spinner_loading_message.innerText = 'Backing up data...';
            this.bsaber.makeDataBackup()
                .then(()=>{
                    this.toggleLoader(false);
                    this.showStatus('Beat player data backed up to '+path.join(appData,'bsaber-data-backups'));
                })
                .catch(e=>{
                    this.toggleLoader(false);
                    this.showStatus(e.toString(),true,true);
                })
        });
        this.sync_songs_now.addEventListener('click',()=>this.openCustomLevels());
        document.getElementById('musiclist').addEventListener('click',()=>this.openCustomLevels());
        //this.showStatus('Repo Deleted!!Repo Deleted!!Repo Deleted!!Repo Deleted!!Repo Deleted!!Repo Deleted!!Repo Deleted!!Repo Deleted!!Repo Deleted!!Repo Deleted!!Repo Deleted!!Repo Deleted!!Repo Deleted!!Repo Deleted!!Repo Deleted!!Repo Deleted!!',true,true);

        this.setup_menu.addEventListener('click',()=>this.openSetupScreen());

        this.add_menu.addEventListener('click',()=>this.repos.openRepos());
        this.enable_wifi.addEventListener('click',()=>this.setup.enableWifiMode());
        document.getElementById('close-app').addEventListener('click',()=>remote.getCurrentWindow().close());
        document.getElementById('open-debugger').addEventListener('click',()=>remote.getCurrentWindow().toggleDevTools());
        document.getElementById('installed-apps').addEventListener('click',()=>this.openPackageList());
        document.getElementById('device-settings').addEventListener('click',()=>this.openDeviceSettings());
        document.querySelector('.confirm-uninstall-app').addEventListener('click',()=>{
            if(this.current_uninstall_package){
                this.setup.uninstallApk(this.current_uninstall_package)
                    .then(()=>this.openPackageList());
            }
        });
        document.querySelector('.beat-menu').addEventListener('click',()=>{
            this.openBeat();
        });
        this.make_backup.addEventListener('click',()=>{
            this.bsaber.backUpBeatSaberBinary()
                .catch(e=>{
                    this.showStatus(e.toString(),true,true);
                });
        });
        this.backupsModal = M.Modal.getInstance(document.querySelector('#modal5'));
        this.patchModal = M.Modal.getInstance(document.querySelector('#modal4'));

        let dragTimeout;
        document.ondragover = () => {
            clearTimeout(dragTimeout);
            this.spinner_drag.style.display = 'block';
            this.spinner_background.style.display = 'block';
            return false;
        };

        document.ondragleave = () => {
            dragTimeout = setTimeout(()=>{
                this.spinner_drag.style.display = 'none';
                this.spinner_background.style.display = 'none';
            },1000)
            return false;
        };

        document.ondragend = () => {
            this.spinner_drag.style.display = 'none';
            this.spinner_background.style.display = 'none';
            return false;
        };

        document.ondrop = (e) => {
            e.preventDefault();
            this.spinner_drag.style.display = 'none';
            this.spinner_background.style.display = 'none';
            const typeBasedActions = {
                ".apk" : function(filepath, bind){
                    return bind.setup.installLocalApk(filepath)
                        .then(() => bind.toggleLoader(false));    
                },
                ".obb" : function(filepath, bind){
                    if(path.basename(filepath).match(/main.[0-9]{1,}.[a-z]{1,}.[A-z]{1,}.[A-z]{1,}.obb/)){
                        return bind.setup.installLocalObb(filepath)
                            .then(() => bind.toggleLoader(false));
                    }else{
                        bind.toggleLoader(false);
                        return Promise.reject("Invalid OBB");
                    }
                     
                },
                ".zip" : function(filepath, bind){
                    return bind.setup.installLocalZip(filepath, false, () => bind.toggleLoader(false))
                }
            };
            let installableFiles = Object.keys(e.dataTransfer.files).filter((val, index) => {
                return Object.keys(typeBasedActions).includes(path.extname(e.dataTransfer.files[index].name))
            });
            installableFiles.forEach((val, index) => {
                let filepath = e.dataTransfer.files[val].path,
                ext = path.extname(filepath);
                console.log("Installing", filepath);
                this.spinner_loading_message.innerText = `Installing ${filepath}, Please wait...`;
                if(typeBasedActions.hasOwnProperty(ext)){
                    this.toggleLoader(true);
                    typeBasedActions[ext](filepath, this)
                        .then(()=>{
                            this.showStatus('Installed APK File'+filepath,false,true);
                        })
                        .catch(e=>{
                            this.showStatus(e.toString(),true,true);
                        });
                }
            });
            return false;
        };
    }
    showStatus(message,isWarning,showCopy){
        this.statuscopy.style.display = showCopy?'inline-block':'none';
        this.statusbar.className = isWarning?'status-bar-warning':'status-bar';
        this.statusmessage.innerHTML = message;
        this.statusbar.style.display = 'block';
    }
    hideStatus(){
        this.statusbar.style.display = 'none';
    }
    copyStatus(){
        clipboard.writeText(this.statusmessage.innerText);
        this.showStatus('Copied to your clipboard! Please post this in our discord server in the #side-quest-general channel - <span class="link link-white" data-url="https://discord.gg/r38T5rR">https://discord.gg/r38T5rR</span> - Thanks!');
        let link = this.statusmessage.querySelector('.link');
        link.addEventListener('click',()=>this.openExternalLink(link.dataset.url));
    }
    toggleLoader(show){
        document.querySelector('.spinner').style.display =
            this.spinner_background.style.display = show ? 'block' : 'none';
    }
    openExternalLink(url){
        opn(url);
    }
    openSyncSelected(){
        this.patch_beatsaber.style.display = 'none';
        this.getMyBackups()
            .then(async files=> {
                this.patch_beatsaber.style.display = files.length?'inline-block':'none';
                this.patch_make_data_backup.style.display = files.length?'none':'inline-block';
                let questSaberPatchContainer = document.getElementById('questSaberPatchContainer');
                questSaberPatchContainer.innerHTML = files.length?`
                    We will now attempt to patch your beat saber APK file with the custom levels selected. This process is experimental and can break so we do not accept any liability for any losses incurred. Please make a backup of your APK file and data files before you begin - this way you can restore things if something goes wrong. 
                    <br><br>
                    This patch uses the kind efforts of trishume and also some work done by emulamer. For more information please visit https://github.com/trishume/QuestSaberPatch. Note that they don't provide support so please don't ask them for help with any issues.
                `:'<br><h5>&nbsp;&nbsp;&nbsp;No Backups made!! Make a backup now!</h5>';
            });
    }
    openBackups(){
        this.getMyBackups()
            .then(async files=>{
                this.bsaber.setBeatVersion(true);
                let backupsContainer = document.getElementById('backupsContainer');
                let dataBackupsContainer = document.getElementById('dataBackupsContainer');
                backupsContainer.innerHTML = files.length?'':'<br><h5>&nbsp;&nbsp;&nbsp;No Backups made!! Make a backup now!</h5>';
                if(await this.bsaber.hasBeatSDFolder('data') || await this.bsaber.hasBeatSDFolder('obb')){
                    dataBackupsContainer.style.display = 'block';
                }else{
                    dataBackupsContainer.style.display = 'none';
                }
                files.forEach(f=>{
                    let child = this.backupTemplate.content.cloneNode(true);
                    child.querySelector('.backup-name').innerText = f;
                    child.querySelector('.restore-backup').addEventListener('click',()=>{
                        this.spinner_loading_message.innerText = 'Restoring Backup, Please wait...';
                        this.backupsModal.close();
                        this.toggleLoader(true);
                        this.setup.installLocalApk(path.join(appData,'bsaber-backups',f))
                            .then(()=>{
                                this.showStatus('Backup restored!!');
                                this.toggleLoader(false)
                            });
                    });
                    backupsContainer.appendChild(child);
                });
                M.Tooltip.init(document.querySelectorAll('.tooltipped'), {});
            });
    }
    getAppSummary(app){
        if(app.summary||app.description){
            return (app.summary||'')
                +(app.summary&&app.description?'<br><br>':'')
                +(app.description||'');
        }else if(app.localized){

            const firstKey = app.localized['en-US']?'en-US':Object.keys(app.localized)[0];
            if(firstKey){
                return (app.localized[firstKey].summary||"")
                    +(app.localized[firstKey].summary&&app.localized[firstKey].description?'<br><br>':'')
                    +(app.localized[firstKey].description||"")
            }else{
                return 'No description...';
            }
        }else {
            return 'No description...';
        }

    }
    getLongMetaData(app){
        let output = '';
        let properties = [
            'packageName',
            'authorEmail',
            'webSite',
            'sourceCode',
            'issueTracker',
            'changelog'
        ];
        let webProperties = properties.filter(p=>p!=='packageName'&&p!=='authorEmail');
        properties.forEach(p=>{
            if(app[p]){
                if(~webProperties.indexOf(p)){
                    output += p+": <span class=\"link\" data-url=\""+app[p]+"\">"+app[p]+"</span><br>";
                }else{
                    output += p+": <b>"+app[p]+"</b><br>";
                }
            }
        });
        return output;
    }
    getAppMetadata(app){
        let output = '';
        let dateProperties = [
            'added',
            'lastUpdated'
        ];
        let properties = [
            'authorName',
            'license'
        ];
        dateProperties.forEach(p=>{
            if(app[p]){
                output += p+": <b>"+(new Date(app[p]).toDateString())+"</b><br>";
            }
        });
        properties.forEach(p=>{
            if(app[p]){
                output += p+": <b>"+app[p]+"</b><br>";
            }
        });
        return output;
    }
    setupWebview(){
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
                background: #009688;
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
        let customJS = `
            [].slice.call(document.querySelectorAll('.bsaber-tooltip.-beatdrop')).forEach(e=>e.style.display = 'none');
            [].slice.call(document.querySelectorAll('.bsaber-tooltip.-download-zip')).forEach(e=>{
                e.style.display = 'none';
                let hrefParts = e.href.split('/');
                let songIdParts = hrefParts[hrefParts.length-1].split('-');
                
                let isAlready = !!e.parentElement.querySelector('.action.post-icon.bsaber-tooltip.-sidequest');
                if(isAlready) return;
                let downloadButton = document.createElement('a');
                downloadButton.className = 'action post-icon bsaber-tooltip -sidequest';
                downloadButton.href='javascript:void(0)';
                downloadButton.addEventListener('click',()=>{
                    window.Bridge.sendMessage(
                        JSON.stringify({
                            beatsaber:'https://beatsaver.com/storage/songs/'+songIdParts[0]+'/'+songIdParts[0]+'-'+songIdParts[1]+'.zip'
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
        let webaddress = document.getElementById('web_address');
        let back_button = document.querySelector('.browser-back-button');
        let forward_button = document.querySelector('.browser-forward-button');
        let send_button = document.querySelector('.browser-send-button');
        let fix_address = ()=>{if(webaddress.value.substr(0,7) !== 'http://'&&webaddress.value.substr(0,8) !== 'https://')webaddress.value = 'http://'+webaddress.value};
        webaddress.addEventListener('keyup',e=>{
            if(e.keyCode === 13){
                fix_address();
                this.beatView.loadURL(webaddress.value);
            }
        });

        this.beatView.addEventListener('did-start-loading', e=>{
            webaddress.value = this.beatView.getURL();
            this.browser_loading.style.display = 'inline-block';
            this.beatView.insertCSS(customCss);
        });
        this.beatView.addEventListener('did-navigate-in-page',()=>{
            setTimeout(()=> {
                this.beatView.executeJavaScript(customJS);
                this.bsaber.getCurrentDeviceSongs();
            },2500);
            setTimeout(()=> {
                this.beatView.executeJavaScript(customJS);
                this.bsaber.getCurrentDeviceSongs();
            },4500);
            setTimeout(()=> {
                this.beatView.executeJavaScript(customJS);
                this.bsaber.getCurrentDeviceSongs();
            },6500);
            setTimeout(()=> {
                this.beatView.executeJavaScript(customJS);
                this.bsaber.getCurrentDeviceSongs();
            },8500);
        });
        this.beatView.addEventListener('did-stop-loading', async e=>{
            webaddress.value = this.beatView.getURL();
            this.browser_loading.style.display = 'none';
            this.beatView.insertCSS(customCss);
            if(this.bsaber){
                this.beatView.executeJavaScript(customJS);
                this.bsaber.getCurrentDeviceSongs();
            }
        });
        send_button.addEventListener('click',()=>{
            fix_address();
            this.beatView.loadURL(webaddress.value);
        });
        back_button.addEventListener('click',()=>{
            if(this.beatView.canGoBack()){
                this.beatView.goBack()
            }
        });
        forward_button.addEventListener('click',()=>{
            if(this.beatView.canGoForward()){
                this.beatView.goForward()
            }
        });
        //this.beatView.openDevTools();
    }
    async showInstalledPackage(child, app,appPackage){
        child.querySelector('.app-meta').innerHTML = this.getAppMetadata(app);
        this.setup.updateConnectedStatus(await this.setup.connectedStatus());
        if(~this.setup.devicePackages.indexOf(app.packageName)){
            let installedVersion = await this.setup.getPackageInfo(app.packageName)
            let hasUpdate = false;
            appPackage.forEach(p=>{
                try{
                    if(semver.lt(installedVersion, p.versionName)){
                        hasUpdate = true;
                    }
                }catch(e){}
            });
            child.querySelector('.uninstall-apk').style.display = 'block';
            child.querySelector('.app-meta').innerHTML += '<br>'+(hasUpdate?'Update Available<br>':'')+'Installed version: '+installedVersion+'<br>';
        }else{
            child.querySelector('.uninstall-apk').style.display = 'none';
        }
    }
    async openAppScreen(app,appPackage){
        this.sync_songs_now.style.display = 'none';
        this.sync_songs.style.display = 'none';
        this.add_repo.style.display = 'none';
        this.container.innerHTML = '';
        this.searchFilterContainer.style.display = 'none';
        this.browser_bar.style.display = 'none';
        this.title.innerHTML = app.name;
        this.beatView.style.left = '-100%';
        let child = this.appItem.content.cloneNode(true);
        child.querySelector('.app-image').src = app.icon;
        child.querySelector('.summary').innerHTML = this.getAppSummary(app)+'<br><br>'+this.getLongMetaData(app)+'<br><br>';
        child.querySelector('.uninstall-apk').addEventListener('click',()=>this.setup.uninstallApk(app.packageName)
            .then(()=>setTimeout(()=>this.searchFilter(),3000)));
        [].slice.call(child.querySelectorAll('.link')).forEach(link=>{
            link.addEventListener('click',()=>this.openExternalLink(link.dataset.url));
        });
        try{
            appPackage.sort((a,b)=>semver.rcompare(a.versionName,b.versionName));
        }catch(e){}
        await this.showInstalledPackage(child, app,appPackage);
        appPackage.forEach((p,i)=>{
            let versionChild = this.appVersion.content.cloneNode(true);
            if(i===0){
                versionChild.querySelector('li').className = 'active';
            }
            versionChild.querySelector('.version-name').innerText = 'V. '+p.versionName;
            versionChild.querySelector('.install-apk').addEventListener('click',()=>{
                this.toggleLoader(true);
                this.spinner_loading_message.innerText = 'Installing APK...';

                this.setup.installApk(p.apkName.substr(0,7)==='http://'||p.apkName.substr(0,8)==='https://'?p.apkName:this.current_data.url+p.apkName)
                    .then(()=>{
                        this.toggleLoader(false);
                        this.showStatus('APK installed!!');
                        return this.showInstalledPackage(this.container, app,appPackage);
                    });
            });
            versionChild.querySelector('.permissions').innerHTML = (p['uses-permission']||[]).map(permission=>{
                return typeof permission === 'string'? permission: permission.filter(p=>p).join('<br>');
            }).join('<br>');
            child.querySelector('.app-versions').appendChild(versionChild);
        });
        this.container.appendChild(child);
        this.setup.getPackageInfo(app.packageName);
        M.Collapsible.init(document.querySelectorAll('.collapsible'), {});
    }
    async openPackageList(){
        this.setup.updateConnectedStatus(await this.setup.connectedStatus());
        this.add_repo.style.display = 'none';
        this.sync_songs_now.style.display = 'none';
        this.sync_songs.style.display = 'none';
        this.container.innerHTML = '';
        this.searchFilterContainer.style.display = 'none';
        this.browser_bar.style.display = 'none';
        this.title.innerHTML = "Installed Packages";
        this.beatView.style.left = '-100%';
        if(!this.setup.status === 'connected'){
            this.container.innerHTML = '<h4 class="grey-text">No device connected...</h4>'
        }else{
            this.setup.devicePackages.filter(p=>!(p.startsWith('com.oculus')||p.startsWith('com.android')||p.startsWith('com.qualcomm')||p.startsWith('android.ext')||p==='android'||p==='oculus.platform')).forEach((p,i)=>{
                let child = this.packageItem.content.cloneNode(true);
                if(i%2===0){
                    [].slice.call(child.querySelectorAll('.package-height')).forEach(ele=>{
                        ele.style.backgroundColor = '#cfcfcf';
                    });
                }
                child.querySelector('.chip').innerText = p;
                child.querySelector('.uninstall-package').addEventListener('click',()=>{
                    this.current_uninstall_package = p;
                    document.getElementById('app-remove-name').innerText = 'Are you sure you want to remove '+p+'?';
                });
                this.container.appendChild(child);
            });
        }
    }
    async openBeat(){
        this.add_repo.style.display = 'none';
        this.sync_songs.style.display = 'none';
        this.sync_songs_now.style.display = 'block';
        this.container.innerHTML = '';
        this.searchFilterContainer.style.display = 'none';
        this.title.innerHTML = "Beast Saber - Custom Songs";
        this.beatView.style.left = '0';
        this.apkInstall.style.display = 'none';
        this.browser_bar.style.display = 'block';
        this.beatView.loadURL('https://bsaber.com')
    }
    getMyBackups(){
        let backupDirectory = path.join(appData,'bsaber-backups');
        return new Promise(resolve=>{
            fs.readdir(backupDirectory,(err,data)=> {
                if (err) {
                    this.showStatus("Error reading backup directory: " + backupDirectory + ", Error:" + err);
                    resolve();
                } else {
                    resolve((data||[]).filter(d=>d.substr(d.length-4)===".apk"));

                }
            });
        });
    }
    getMySongs(){
        let songsDirectory = path.join(appData,'bsaber');
        let songs = [];

        return new Promise(resolve=>{
            fs.readdir(songsDirectory,(err,data)=>{
                if(err) {
                    this.showStatus("Error reading songs directory: "+songsDirectory+", Error:"+err);
                    resolve();
                }else{
                    Promise.all(data.map((folder,i)=>{
                        let song = {id:folder};
                        let songDirectory = path.join(songsDirectory,folder);
                        return new Promise(r=>{
                            fs.readdir(songDirectory,(err,songName)=>{
                                if(err||!songName.length) {
                                    this.showStatus("Error reading songs directory: "+songDirectory+", Error:"+err);
                                }else{
                                    songName = songName[0];
                                    song.name = songName;
                                    song.path = path.join(songDirectory,songName);
                                    song.cover = 'file:///'+path.join(songDirectory,songName,'cover.jpg').replace(/\\/g, '/');
                                    songs.push(song)
                                }
                                r();
                            });
                        });
                    }))
                        .then(()=>{
                            this.songs = songs;
                            resolve();
                        });
                }
            });
        });
    }
    async openCustomLevels() {
        this.add_repo.style.display = 'none';
        this.sync_songs_now.style.display = 'none';
        this.sync_songs.style.display = 'block';
        this.container.innerHTML = '';
        this.searchFilterContainer.style.display = 'none';
        this.title.innerHTML = "Beast Saber Custom Levels";
        this.beatView.style.left = '-100%';
        this.apkInstall.style.display = 'block';
        this.apkInstall.innerHTML = `Special thanks to 
<span class="link" data-url="https://github.com/trishume/QuestSaberPatch">@trishume</span>, 
<span class="link" data-url="https://github.com/emulamer/QuestStopgap">@emulamer</span>,
<span class="link" data-url="https://github.com/ATechAdventurer">@ATechAdventurer</span>
and of course 
<span class="link" data-url="https://bsaber.com/members/elliotttate/">@elliotttate</span> for beat saber efforts.`;
        [].slice.call(this.apkInstall.querySelectorAll('.link')).forEach(link=>{
            link.addEventListener('click',()=>this.openExternalLink(link.dataset.url));
        });
        this.browser_bar.style.display = 'none';
        let songs = (this.songs||[]);
        if(await this.bsaber.isBeatSaberInstalled()){
            this.container.innerHTML = songs.length?'':'<h4>Nothing here yet...</h4>';
            songs.forEach(song=>{
                let child = this.template.content.cloneNode(true);
                child.querySelector('.image').style.backgroundImage = 'url("'+song.cover+'")';
                child.querySelector('.image').style.backgroundColor = randomColor({seed:song.id});
                child.querySelector('.card-title-one').innerHTML = '<i class="material-icons right">more_vert</i>'+song.name;
                child.querySelector('.card-title-two').innerHTML = '<i class="material-icons right">close</i>'+song.name;
                let songIdParts = song.id.split('-');
                child.querySelector('.description').innerHTML = 'Download URL: https://beatsaver.com/storage/songs/'+songIdParts[0]+'/'+songIdParts[0]+'-'+songIdParts[1]+'.zip<br><br><a  href="#" id="delete-song'+song.id+'" class="waves-effect waves-light btn red">Delete</a>';
                child.querySelector('.install-apk').style.display = 'none';
                let syncSwitch = document.createElement('div');
                syncSwitch.className = "switch";
                let syncLabel = document.createElement('label');
                syncSwitch.appendChild(syncLabel);
                song.enabled=true;
                syncLabel.innerHTML = 'Off<input type="checkbox" id="syncSong'+song.id+'" checked="checked"><span class="lever"></span>On';
                child.querySelector('.install-apk').parentElement.appendChild(syncSwitch);
                let switchEle = child.getElementById('syncSong'+song.id);
                switchEle.addEventListener('change',()=>{
                    song.enabled = switchEle.checked;
                });
                child.querySelector('#delete-song'+song.id).addEventListener('click',()=>{
                    this.bsaber.deleteFolderRecursive(path.join(appData,'bsaber',song.id));
                    this.getMySongs()
                        .then(()=>this.bsaber.getCurrentDeviceSongs())
                        .then(()=>this.openCustomLevels());
                });
                this.container.appendChild(child);
            });
        }else{
            this.container.innerHTML = '<h4>Beat saber not installed...</h4>';
        }
    }
    openDeviceSettings() {
        this.add_repo.style.display = 'none';
        this.sync_songs_now.style.display = 'none';
        this.sync_songs.style.display = 'none';
        this.container.innerHTML = '';
        this.searchFilterContainer.style.display = 'none';
        this.title.innerHTML = "Device Settings & Tools";
        this.beatView.style.left = '-100%';
        this.apkInstall.style.display = 'block';
        this.apkInstall.innerHTML = 'Drag an APK file over this window to install. See Setup to get started.';
        this.browser_bar.style.display = 'none';

        let child = this.deviceSettings.content.cloneNode(true);

        this.container.appendChild(child);
        [].slice.call(document.querySelectorAll('.set-ffr')).forEach(ele=> {
            ele.addEventListener('click', () => {
                let value = 0;
                switch (ele.innerText.toLowerCase()) {
                    case "off":
                        value = 0;
                        break;
                    case "low":
                        value = 1;
                        break;
                    case "medium":
                        value = 2;
                        break;
                    case "high":
                        value = 3;
                        break;
                    case "high top":
                        value = 4;
                        break;
                }
                this.spinner_loading_message.innerText = 'Setting FFV...';
                this.toggleLoader(true);
                this.setup.adb.shell(this.setup.deviceSerial, "setprop debug.oculus.foveation.level " + value)
                    .then(adb.util.readAll)
                    .then(res => {
                        console.log(res.toString());
                        this.showStatus("FFR level set to " + value + "!!");
                        this.toggleLoader(false);
                    })
                    .catch(e => {
                        this.showStatus(e.toString(), true, true);
                        this.toggleLoader(false);
                    })
            });
        });
        [].slice.call(document.querySelectorAll('.set-gpu-level')).forEach(ele=> {
            ele.addEventListener('click', () => {
                let value = 2;
                switch (ele.innerText.toLowerCase()) {
                    case "level 2":
                        value = 2;
                        break;
                    case "level 4":
                        value = 4;
                        break;
                }
                this.spinner_loading_message.innerText = 'Setting CPU/GPU Setting...';
                this.toggleLoader(true);
                this.setup.adb.shell(this.setup.deviceSerial, '"setprop debug.oculus.cpuLevel ' + value + ' && setprop debug.oculus.gpuLevel ' + value + '"')
                    .then(adb.util.readAll)
                    .then(res => {
                        console.log(res.toString());
                        this.showStatus("CPU & GPR lock level set to " + value + "!!");
                        this.toggleLoader(false);
                    })
                    .catch(e => {
                        this.showStatus(e.toString(), true, true);
                        this.toggleLoader(false);
                    })
            });
        });
        let pasteText = document.querySelector('.paste-text-button');
        pasteText.addEventListener('click',()=>{
            let characters = devicePaste.value.split('');
            let inputCharacters = ()=>{
                let character = characters.shift();
                return this.setup.adb.shell(this.setup.deviceSerial, 'input text "'+character+'"')
                    .then(adb.util.readAll)
                    .then(res => {
                        if(characters.length){
                            return inputCharacters();
                        }
                    });
            };
            this.spinner_loading_message.innerText = 'Setting Text...';
            this.toggleLoader(true);
            inputCharacters()
                .then(()=>{
                    this.showStatus("Text sent to the device!!");
                    this.toggleLoader(false);
                })
                .catch(e => {
                    this.showStatus(e.toString(), true, true);
                    this.toggleLoader(false);
                })
        });
        let devicePaste = document.getElementById('devicePaste');

        document.getElementById('devicePasteType').addEventListener('change',function(){
            devicePaste.setAttribute('type',this.checked?'password':'text');
        });
        document.querySelector('.open-main-app-folder').addEventListener('click',()=>{
            shell.openItem(appData);
        });

        document.querySelector('.open-adb-folder').addEventListener('click',()=>{
            shell.openItem(path.join(appData,'platform-tools'));
        });
        //
        // document.querySelector('.open-adb-command-window').addEventListener('click',()=>{
        //     switch (os.platform()) {
        //         case 'win32':
        //             spawn(path.join(__dirname,'command.cmd'), [],{cwd: path.join(appData,'platform-tools'), detached: true });
        //             break;
        //         case 'darwin':
        //             this.showStatus('comming to mac soon!');
        //             break;
        //         case 'linux':
        //             this.showStatus('comming to linux soon!');
        //             break;
        //     }
        // });
        document.querySelector('.open-bsaber-folder').addEventListener('click',()=>{
            shell.openItem(path.join(appData,'bsaber'));
        });
        document.querySelector('.open-bsaber-backup-folder').addEventListener('click',()=>{
            shell.openItem(path.join(appData,'bsaber-backups'));
        });
        document.querySelector('.open-bsaber-data-backup-folder').addEventListener('click',()=>{
            shell.openItem(path.join(appData,'bsaber-data-backups'));
        });
        document.querySelector('.open-bsaber-patch-folder').addEventListener('click',()=>{
            shell.openItem(path.join(appData,'saber-quest-patch'));
        });

    }
    openSetupScreen(){
        this.add_repo.style.display = 'none';
        this.sync_songs.style.display = 'none';
        this.sync_songs_now.style.display = 'none';
        this.container.innerHTML = '';
        this.searchFilterContainer.style.display = 'none';
        this.title.innerHTML = "Setup Instructions";
        this.beatView.style.left = '-100%';
        this.apkInstall.style.display = 'block';
        this.apkInstall.innerHTML = 'Drag an APK file over this window to install. See Setup to get started.';
        this.browser_bar.style.display = 'none';

        let child = this.setupInstructions.content.cloneNode(true);
        this.container.appendChild(child);
        [].slice.call(document.querySelectorAll('.link')).forEach(link=>{
            link.addEventListener('click',()=>this.openExternalLink(link.dataset.url));
        });
        this.install_launcher = document.querySelector('.install-launcher');
        this.install_launcher_loader = document.querySelector('.install-launcher-loading');
        this.install_launcher_container = document.querySelector('.install-launcher-container');

        if(~this.setup.devicePackages.indexOf('com.openappstore.wrapper') && ~this.setup.devicePackages.indexOf('com.openappstore.launcher')) {
            this.setup.uninstallApk('com.openappstore.wrapper')
                .then(()=>this.setup.uninstallApk('com.openappstore.launcher'));
        }
        if(~this.setup.devicePackages.indexOf('com.sidequest.wrapper') && ~this.setup.devicePackages.indexOf('com.sidequest.launcher')) {
            this.install_launcher_container.innerHTML = '<span class="chip">SideQuest Launcher Already Installed!</span>';
        }else {
            this.install_launcher.addEventListener('click', () => {
                this.install_launcher.style.display = 'none';
                this.install_launcher_loader.style.display = 'inline-block';
                this.setup.installApk('https://cdn.theexpanse.app/SideQuestWrapper.apk')
                    .then(() => this.setup.installApk('https://cdn.theexpanse.app/SideQuestLauncher.apk'))
                    .then(() => {
                        this.install_launcher_container.innerHTML = '<span class="chip">Done!</span>';
                    })
            });
        }
        this.install_expanse = document.querySelector('.install-expanse');
        this.install_expanse_loader = document.querySelector('.install-expanse-loading');
        this.install_expanse_container = document.querySelector('.install-expanse-container');
        if(~this.setup.devicePackages.indexOf('app.theexpanse.app')) {
            this.install_expanse_container.innerHTML = '<span class="chip">The Expanse Already Installed!</span>';
        }else{
            this.install_expanse.addEventListener('click',()=>{
                this.install_expanse.style.display = 'none';
                this.install_expanse_loader.style.display = 'inline-block';
                this.setup.installApk('https://cdn.theexpanse.app/TheExpanse.apk').then(()=>{
                    this.install_expanse_container.innerHTML = '<span class="chip">Done!</span>';
                })
            });
        }
        M.FormSelect.init(document.querySelectorAll('select'), {});
        M.Tooltip.init(document.querySelectorAll('.tooltipped'), {});
    }
    searchFilter(){
        this.container.innerHTML = '';
        this.current_data.body.apps.filter(d=>{
            let filter_value = this.filter_select.options[this.filter_select.selectedIndex].value;
            let search_value = this.search_box.value;
            let is_filter = (filter_value === d.category || filter_value === "All");
            return (is_filter && !search_value) ||
                (is_filter &&
                    (~d.name.toLowerCase().indexOf(search_value.toLowerCase()) ||
                        ~(d.summary||'').toLowerCase().indexOf(search_value.toLowerCase())));
        }).forEach(d=>{
            let child = this.template.content.cloneNode(true);
            child.querySelector('.image').style.backgroundImage = 'url('+d.icon+')';
            child.querySelector('.image').style.backgroundColor = randomColor({seed:d.packageName});
            child.querySelector('.card-title-one').innerHTML = '<i class="material-icons right">more_vert</i>'+d.name;
            child.querySelector('.card-title-two').innerHTML = '<i class="material-icons right">close</i>'+d.name;
            child.querySelector('.description').innerText = (d.summary||'');
            let installApk = child.querySelector('.install-apk');
            installApk.innerText = 'More';
            installApk.className = 'waves-effect waves-light btn install-apk';
            installApk.addEventListener('click',()=>{
                this.openAppScreen(d,this.current_data.body.packages[d.packageName]);
            });
            if(~this.setup.devicePackages.indexOf(d.packageName)){
                child.querySelector('.is-installed').style.display = 'block';
            }
            this.container.appendChild(child);
        });
    }
}
new App();