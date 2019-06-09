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
                        this.toggleLoader(true);
                        this.spinner_loading_message.innerText = 'Downloading Map'
                        this.bsaber.downloadSong(url[1]).then(id=>{
                            this.getMySongs()
                                .then(()=>this.toggleLoader(false))
                                .then(()=>this.showStatus('Level Downloaded Ok!!'))
                                .then(()=>this.bsaber.getCurrentDeviceSongs(true))
                                .then(()=>{
                                    this.jSon.packs.forEach(p=>{
                                        if(p.id==="__default_pack"){
                                            (this.songs||[]).forEach(song=>{
                                                if(song.id === id){
                                                    p.levelIDs.push(song)
                                                }
                                            })
                                        }
                                    });
                                    this.bsaber.saveJson(this.jSon);
                                });
                        })
                            .catch(e=>{
                                this.showStatus(e.toString(),true,true);
                                this.toggleLoader(false);
                            })
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
                            .then(id=>{
                                return this.getMySongs()
                                    .then(()=>this.toggleLoader(false))
                                    .then(()=>this.showStatus('Level Downloaded Ok!!'))
                                    .then(()=>this.bsaber.getCurrentDeviceSongs(true))
                                    .then(()=>{
                                        this.jSon.packs.forEach(p=>{
                                            if(p.id==="__default_pack"){
                                                (this.songs||[]).forEach(song=>{
                                                    if(song.id === id){
                                                        p.levelIDs.push(song)
                                                    }
                                                })
                                            }
                                        });
                                        this.bsaber.saveJson(this.jSon);
                                    });
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
                this.getMySongs().then(()=>{
                    this.setupWebview();
                    this.jSon = this.bsaber.getAppJson()
                });
                this.repos.setupRepos();
                this.bsaber = new Bsaber(this);
                this.bsaber.downloadConverterBinary();
                this.spinner_loading_message.innerText = 'Downloading, This might take some time on first launch please wait...';
                this.bsaber.downloadQuestSaberPatch();
                this.bsaber.setBeatVersion()
                    .catch(e=>{});
            });
    }
    async mkdir(path){
        return new Promise(resolve=>{
            fs.mkdir(path,resolve);
        })
    }
    resetBase(){
        this.backupsModal.close()
        this.toggleLoader(true);
        this.spinner_loading_message.innerText = 'Getting Master Backup...';
        this.bsaber.resetBase()
            .then(()=>{
                this.toggleLoader(false);
                this.bsaber.resetPatched();
            });
    }
    setupMenu(){
        document.querySelector('.add-pack-cover-image').addEventListener('click',()=>{
            dialog.showOpenDialog({
                properties: ['openFile'],
                defaultPath: appData,
                filters:[
                    { name: 'Cover Images ( JPG,PNG )', extensions: ['png','jpg'] }
                ]
            }, (files)=> {
                if (files !== undefined && files.length===1) {
                    this.packCoverPath = files[0];
                    document.querySelector('.cover-image-path').innerHTML = files[0];
                }
            });
        });
        document.querySelector('.refresh-songs-one').addEventListener('click',()=>{
            this.refreshMySongs()
        });
        document.querySelector('.delete-pack').addEventListener('click',()=>{
            if(this.jSon&&this.currentPack){
                this.jSon.packs = this.jSon.packs.filter(p=>p!==this.currentPack);
                this.bsaber.saveJson(this.jSon);
                this.refreshMySongs();
                this.packEditModal.close();
            }
        });
        let defaultImage = path.join(__dirname,'default-pack-cover.png');
        document.querySelector('.cover-image-path').innerHTML = defaultImage;
        this.packCoverPath = defaultImage;
        document.querySelector('.add-pack-button').addEventListener('click',()=>{
            if(this.jSon){
                if(this.currentPack){
                    this.currentPack.name = document.getElementById('packName').value;
                    this.currentPack.coverImagePath = this.packCoverPath||defaultImage;
                    delete this.currentPack;
                }else{
                    this.jSon.packs.push({id:this.jSon.packs.length,name: document.getElementById('packName').value,coverImagePath:this.packCoverPath||defaultImage,levelIDs:[]})
                }
                this.bsaber.saveJson(this.jSon);
                document.querySelector('.cover-image-path').innerHTML = defaultImage;
                this.packCoverPath = defaultImage;
                document.getElementById('packName').value = '';
                document.querySelector('.delete-pack').style.display = 'none';
                this.openCustomLevels();
            }
        });
        document.querySelector('.reset-new-backup').addEventListener('click',()=>{
            this.backupsModal.close();
            this.resetBase()
        });
        document.querySelector('.backup-new-master-modal').addEventListener('click',()=>{
            this.resetInstructions.close();
            this.resetBase()
        });
        document.querySelector('.select-new-base').addEventListener('click',()=>{
            dialog.showOpenDialog({
                properties: ['openFile'],
                defaultPath: appData,
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
            let songs = (this.songs||[]);//.filter(d=>d.enabled);
            let questSaberPatchContainer = document.getElementById('questSaberPatchContainer');
            if(this.patch_beatsaber.style.display !== 'none' || !songs.length){
                questSaberPatchContainer.innerHTML = '<br><br><div style="text-align: center"><div class="loader-initial"></div><br>Patching now, <br>this should take 40 - 60 seconds...</div>';
                this.patch_beatsaber.style.display = 'none';
                let dataBackupFolder;
                return this.bsaber.makeDataBackup()
                    .then(folder=>dataBackupFolder = folder)
                    .then(()=>this.bsaber.runQuestSaberPatch(songs))
                    .then(result=>{
                        if(result&&result.error){
                            return Promise.reject(result.error);
                        }
                        let skipped = Object.keys(result&&result.installSkipped?result.installSkipped:{}).map(d=>{
                            return "&nbsp;&nbsp;<b>"+d+"</b>:"+result.installSkipped[d];
                        });
                        questSaberPatchContainer.innerHTML = `<br><h6>Patch Results</h6>
                            <a class="waves-effect waves-light btn install-beat-patch">Install APK to Headset</a><br><br>
                            <b>Current Levels</b>: `+(result&&result.presentLevels?result.presentLevels:[]).join(', ')+`<br><br>
                            <b>Just Installed</b>: `+(result&&result.installedLevels?result.installedLevels:[]).join(', ')+`<br><br>
                            <b>Skipped</b>: <br>`+(skipped.length?skipped.join('<br>'):'none')+`<br><br>`;
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
                    .then(()=>this.setup.uninstallApk('com.beatgames.beatsaber'))
                    .then(()=>this.setup.installLocalApk(path.join(appData,'bsaber-base_patched.apk'),true))
                    .then(()=>this.bsaber.restoreDataBackup(dataBackupFolder))
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
                this.showStatus('Something went wrong, do you have songs selected?',true,true);
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
        document.querySelector('.open-songs-main-one').addEventListener('click',()=>{
            shell.openItem(path.join(appData,'bsaber'));
        });
        document.querySelector('.re-download-patcher').addEventListener('click',()=>{
            this.backupsModal.close();
            this.bsaber.deleteFolderRecursive(path.join(appData,'saber-quest-patch'));
            this.mkdir(path.join(appData,'saber-quest-patch'));
            this.spinner_loading_message.innerText = 'Downloading and Extracting QuestSaberPatch';
            this.toggleLoader(true)
            this.bsaber.downloadQuestSaberPatch()
                .then(()=>{
                    this.toggleLoader(false);
                    this.resetInstructions.open();
                    this.openCustomLevels();
                })
                .catch(e=>{
                    this.toggleLoader(false);
                    this.showStatus(e.toString(),true,true);
                });
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
        this.resetInstructions = M.Modal.getInstance(document.querySelector('#modal6'));
        this.backupsModal = M.Modal.getInstance(document.querySelector('#modal5'));
        this.patchModal = M.Modal.getInstance(document.querySelector('#modal4'));
        this.packEditModal = M.Modal.getInstance(document.querySelector('#modal7'));

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
        let jSon = this.jSon;
        this.getMyBackups()
            .then(async files=> {
                this.patch_beatsaber.style.display = files.length?'inline-block':'none';
                this.patch_make_data_backup.style.display = files.length?'none':'inline-block';
                let questSaberPatchContainer = document.getElementById('questSaberPatchContainer');
                if(files.length){
                    let page = document.getElementById('syncSelected').content.cloneNode(true);
                    questSaberPatchContainer.innerHTML = '';
                    questSaberPatchContainer.appendChild(page);
                    let replaceTexts = Object.keys(jSon.replaceText);
                    console.log(jSon.replaceText);
                    replaceTexts.forEach(replace=>{
                        let child = document.getElementById('replaceItem').content.cloneNode(true);
                        child.querySelector('.add-replace-key').innerText = replace;
                        child.querySelector('.add-replace-value').innerText = jSon.replaceText[replace];
                        child.querySelector('.remove-replace').addEventListener('click',()=>{
                            delete jSon.replaceText[replace];
                            this.bsaber.saveJson(jSon);
                            this.openSyncSelected();
                        });
                        questSaberPatchContainer.querySelector('#replaceTextValues').appendChild(child);
                    });
                    questSaberPatchContainer.querySelector('.add-replace').addEventListener('click',()=>{
                        jSon.replaceText[questSaberPatchContainer.querySelector('#add-replace-key').value] =
                            questSaberPatchContainer.querySelector('#add-replace-value').value;
                        console.log(JSON.stringify(jSon.replaceText));
                        console.log(questSaberPatchContainer.querySelector('#add-replace-key').value,
                            questSaberPatchContainer.querySelector('#add-replace-value').value);
                        this.bsaber.saveJson(jSon);
                        this.openSyncSelected();
                    });
                    let colorA = jSon.colors.colorA||{r:240.0/255.0,g:48.0/255.0,b:48.0/255.0,a:1};
                    let colorB = jSon.colors.colorB||{r:48.0/255.0,g:158.0/255.0,b:1,a:1};

                    Pickr.create({
                        el: '.color-a-pick',
                        default:'rgba('+Math.round(colorA.r*255)+','+Math.round(colorA.g*255)+','+Math.round(colorA.b*255)+','+colorA.a+')',
                        defaultRepresentation: 'RGBA',
                        components: {
                            // Main components
                            preview: true,
                            opacity: true,
                            hue: true,
                            // Input / output Options
                            interaction: {
                                hex: true,
                                rgba: true,
                                hsla: true,
                                hsva: true,
                                cmyk: true,
                                input: true,
                                clear: true,
                                save: true
                            }
                        }
                    }).on('save', (...args) => {
                        let c = args[0].toRGBA();
                        jSon.colors.colorA = {r:c[0]/255,g:c[1]/255,b:c[2]/255,a:c[3]};
                        this.bsaber.saveJson(jSon);
                    });
                    Pickr.create({
                        el: '.color-b-pick',
                        default:'rgba('+Math.round(colorB.r*255)+','+Math.round(colorB.g*255)+','+Math.round(colorB.b*255)+','+colorB.a+')',
                        defaultRepresentation: 'RGBA',
                        components: {
                            // Main components
                            preview: true,
                            opacity: true,
                            hue: true,
                            // Input / output Options
                            interaction: {
                                hex: true,
                                rgba: true,
                                hsla: true,
                                hsva: true,
                                cmyk: true,
                                input: true,
                                clear: true,
                                save: true
                            }
                        }
                    }).on('save', (...args) => {
                        let c = args[0].toRGBA();
                        jSon.colors.colorB = {r:c[0]/255,g:c[1]/255,b:c[2]/255,a:c[3]};
                        this.bsaber.saveJson(jSon);
                    });
                }else{
                    questSaberPatchContainer.innerHTML = '<br><h5>&nbsp;&nbsp;&nbsp;No Backups made!! Make a backup now!</h5>';
                }
            });
    }
    openBackups(){
        this.getMyBackups()
            .then(async files=>{
                this.bsaber.setBeatVersion(true);
                let backupsContainer = document.getElementById('backupsContainer');
                backupsContainer.innerHTML = files.length?'':'<br><h5>&nbsp;&nbsp;&nbsp;No Backups made!! Make a backup now!</h5>';

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

        this.getMyDataBackups()
            .then(async dirs=>{
                let dataBackupsContainer = document.getElementById('dataBackupsContainerInner');
                dirs.forEach(f=>{
                    let child = this.backupTemplate.content.cloneNode(true);
                    child.querySelector('.backup-name').innerText = f;
                    child.querySelector('.restore-backup').addEventListener('click',()=>{
                        this.spinner_loading_message.innerText = 'Restoring Data Backup, Please wait...';
                        this.backupsModal.close();
                        this.toggleLoader(true);
                        this.bsaber.restoreDataBackup(f)
                            .then(()=>{
                                this.showStatus('Data Backup restored!!');
                                this.toggleLoader(false)
                            });
                    });
                    dataBackupsContainer.appendChild(child);
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
        //[].slice.call(document.querySelectorAll('.bsaber-tooltip.-beatsaver-viewer')).forEach(e=>e.style.display = 'none');
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
        if(!this.beatLoaded){
            this.beatView.loadURL('https://bsaber.com');
            this.beatLoaded = true;
        }
    }
    getMyDataBackups(){
        let backupDirectory = path.join(appData,'bsaber-data-backups');
        return new Promise(resolve=>{
            fs.readdir(backupDirectory,(err,data)=> {
                if (err) {
                    this.showStatus("Error reading backup directory: " + backupDirectory + ", Error:" + err);
                    resolve();
                } else {
                    resolve((data||[]).filter(d=>fs.lstatSync(path.join(backupDirectory,d)).isDirectory()&&fs.existsSync(path.join(backupDirectory,d,'PlayerData.dat'))));

                }
            });
        });
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
    cleanSongName(songName,songDirectory){
        let name = songName.replace(/\(.+?\)/g, '');
        name = name.replace(/[^a-z0-9]+/gi, '');
        if(name !== songName){
            fs.renameSync(path.join(songDirectory,songName),path.join(songDirectory,name))
        }
        return name;
    }
    getMySongs(){
        let songsDirectory = path.join(appData,'bsaber');
        let songs = [];
        return this.mkdir(songsDirectory).then(()=>new Promise(resolve=>{
            fs.readdir(songsDirectory,(err,data)=>{
                if(err) {
                    this.showStatus("Error reading songs directory: "+songsDirectory+", Error:"+err);
                    resolve();
                }else{
                    Promise.all(data.map((folder,i)=>{
                        let song = {id:folder};
                        let songDirectory = path.join(songsDirectory,folder);
                        if(!fs.lstatSync(songDirectory).isDirectory()) return Promise.resolve();
                        return new Promise(r=>{
                            fs.readdir(songDirectory,(err,songName)=>{
                                if(err) {
                                    this.showStatus("Error reading songs directory: "+songDirectory+", Error:"+err);
                                    r();
                                }else{
                                    songName = songName.filter(d=>fs.lstatSync(path.join(songDirectory,d)).isDirectory());
                                    if(!songName.length){
                                        this.showStatus("Error, song is empty: "+path.join(songDirectory));
                                        return r();
                                    }
                                    if(songName.length>1){
                                        this.showStatus("Error, song has multiple folders: "+path.join(songDirectory));
                                        return r();
                                    }
                                    songName = songName[0];
                                    songName = this.cleanSongName(songName,songDirectory);
                                    fs.readdir(path.join(songDirectory, songName),async (err2,fileNames)=> {
                                        if(err||!fileNames.length) {
                                            this.showStatus("Error reading songs directory: "+path.join(songDirectory, songName)+", Error:"+err2);
                                            r();
                                        }else {
                                            if(~fileNames.indexOf('info.json')){
                                                let innerDir = path.join(songDirectory, songName);
                                                if(fs.existsSync(path.join(innerDir,'info.json'))){
                                                    await this.bsaber.convertSong(innerDir);
                                                }
                                            }
                                            if(!~fileNames.indexOf('info.dat')){
                                                this.showStatus("Error, song has no info.dat: "+path.join(songDirectory, songName)+", Error:"+err2);
                                                return r();
                                            }
                                            if(!~fileNames.indexOf('cover.jpg')&&!~fileNames.indexOf('cover.png')){
                                                fs.copyFileSync(path.join(__dirname,'default-cover.jpg'),path.join(songDirectory, songName,'cover.jpg'));
                                            }
                                            let covername = ~fileNames.indexOf('cover.jpg') ? 'cover.jpg' :
                                                ~fileNames.indexOf('cover.png') ? 'cover.png' :'cover.jpg';
                                            song.name = songName;
                                            song.path = path.join(songDirectory, songName);
                                            song.cover = 'file:///' + path.join(songDirectory, songName, covername).replace(/\\/g, '/');
                                            song.created = fs.statSync(path.join(songDirectory, songName, covername)).mtime.getTime()
                                            songs.push(song);
                                            r();
                                        }
                                    });
                                }
                            });
                        });
                    }))
                        .then(()=>{
                            this.songs = songs;
                            this.orderSongs('date');
                            console.log(this.songs);
                            resolve();
                        });
                }
            });
        }));
    }
    orderSongs(type){
        if(type === "date"){
            this.songs = this.songs.sort((a,b)=>{
                return (a.created < b.created) ? -1 : (a.created > b.created) ? 1 : 0;
            }).reverse();
        }else{
            this.songs = this.songs.sort((a,b)=>{
                let textA = a.name.toUpperCase();
                let textB = b.name.toUpperCase();
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            });
        }
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
        let isBeatSaberInstalled = await this.bsaber.isBeatSaberInstalled().catch(e=>true);
        let isQuestSaberPatch = this.setup.doesFileExist(path.join(appData,'saber-quest-patch','questsaberpatch'));
        if(isBeatSaberInstalled&&isQuestSaberPatch){
            if(!songs.length){
                this.container.innerHTML = '<h4>Nothing here yet...</h4>';
            }else{
                this.container.innerHTML = `
                    <div class="col s4 side-packs ">
                        <div class="side-packs-fixed">
                            <a href="#modal7" class="modal-trigger btn waves-effect waves-green right ">Add Pack</a>
                            <h4 class="no-margin-top">Level Packs</h4>
                            <div class="row pack-container">
                            </div>
                        
                        </div>
                    </div>
                    <div class="col s8">
                        <div class="sort-songs">Sort: <span class="sort-link sort-link-name">Name</span> | <span class="sort-link sort-link-recent">Recent</span></div>
                        <h4 class="no-margin-top">My Levels</h4>
                        <ul class="collection song-container">
                        
                        </ul>
                    </div>`;
                document.querySelector('.sort-link-name').addEventListener('click',()=>{
                    this.orderSongs('name');
                    this.openCustomLevels();
                });
                document.querySelector('.sort-link-recent').addEventListener('click',()=>{
                    this.orderSongs('date');
                    this.openCustomLevels();
                });
                let songContainer = this.container.querySelector('.song-container');
                let packContainer = this.container.querySelector('.pack-container');


                let songsDrake = dragula([songContainer,packContainer],{
                    copy: function (el, source) {
                        return source === songContainer
                    },
                    accepts: function (el, target) {
                        return target !== songContainer && (target !== packContainer || el.parentElement === packContainer)
                    },
                    moves: function (el, source, handle, sibling) {
                        return !~el.className.indexOf('add-to-drag'); // elements are always draggable by default
                    },
                    mirrorContainer: document.querySelector('.temp-move-container')
                });
                let resetDrop = (pack_song_container)=>{
                    let current = pack_song_container.querySelector('.add-to-drag');
                    if(current)current.parentElement.removeChild(current);
                    let add_song_here = document.createElement('li');
                    add_song_here.className = 'add-to-drag';
                    add_song_here.innerText = 'Drop Song Here!';
                    pack_song_container.appendChild(add_song_here);
                };
                let setPacksFromEles = ()=>{
                    this.jSon.packs = [].slice.call(this.container.querySelector('.pack-container').querySelectorAll('.packOuter'))
                        .map(ele=>{
                            let pack_song_container_el = ele.querySelector('.pack-song-container');
                            resetDrop(pack_song_container_el);
                            return {
                                name:ele.querySelector('.name').dataset.name,
                                coverImagePath:ele.querySelector('.name').dataset.coverImagePath,
                                levelIDs:[].slice.call(pack_song_container_el.querySelectorAll('.circle'))
                                    .map(ele=>{
                                        return {
                                            id:ele.dataset.id,
                                            name:ele.dataset.name,
                                            cover:ele.dataset.cover,
                                            path:ele.dataset.path,
                                        }
                                    })
                            }
                        });
                }
                songsDrake.on('cloned',(clone, original, type)=>{
                    if(type === 'copy'){
                        clone.querySelector('.delete-song').addEventListener('click',()=>{
                            clone.parentElement.removeChild(clone);
                            setPacksFromEles();
                            this.bsaber.saveJson(this.jSon);
                        });
                    }
                });
                songsDrake.on('drop',()=>{
                    setPacksFromEles();
                    this.bsaber.saveJson(this.jSon);
                });
                let addSong = (song,container,deleteCallback)=>{
                    let child = document.getElementById('songItem').content.cloneNode(true);
                    child.querySelector('.circle').src = song.cover;
                    child.querySelector('.title').innerHTML = song.name;
                    child.querySelector('.circle').dataset.id = song.id;
                    child.querySelector('.circle').dataset.name = song.name;
                    child.querySelector('.circle').dataset.cover = song.cover;
                    child.querySelector('.circle').dataset.path = song.path;
                    container.appendChild(child);
                    child = container.lastElementChild;
                    child.querySelector('.delete-song').addEventListener('click',()=>deleteCallback(child));
                };
                this.jSon.packs.forEach((pack,i)=>{
                    let child = document.getElementById('packContainer').content.cloneNode(true);
                    child.querySelector('.name').innerHTML = '&nbsp;&nbsp;'+pack.name;
                    child.querySelector('.name').dataset.name = pack.name;
                    child.querySelector('.name').dataset.coverImagePath = pack.coverImagePath;
                    let pack_song_container = child.querySelector('.pack-song-container');
                    let show_pack = child.querySelector('.show-pack');
                    show_pack.addEventListener('click',()=>{
                        let isOpen = show_pack.innerText !== 'expand_more';
                        if(isOpen){
                            show_pack.innerText = 'expand_more';
                            pack_song_container.style.display = 'none';
                        }else{
                            show_pack.innerText = 'expand_less';
                            pack_song_container.style.display = 'block';
                        }
                    });
                    if(i===0){
                        show_pack.click();
                    }
                    let edit_pack = child.querySelector('.edit-pack');
                    edit_pack.addEventListener('click',()=>{
                        this.currentPack = pack;
                        document.querySelector('.delete-pack').style.display = 'inline-block';
                        this.packEditModal.open();
                        document.getElementById('packName').value = pack.name;
                        document.querySelector('.cover-image-path').innerHTML = this.packCoverPath = pack.coverImagePath;
                    });
                    songsDrake.containers.push(pack_song_container);
                    packContainer.appendChild(child);
                    pack.levelIDs.forEach((song,i)=>addSong(song,pack_song_container,ele=>{
                        pack.levelIDs.splice(i,1);
                        ele.parentElement.removeChild(ele);
                        this.bsaber.saveJson(this.jSon);
                    }));
                    resetDrop(pack_song_container);
                });
                songs.forEach(song=>addSong(song,songContainer,()=>{
                    this.bsaber.deleteFolderRecursive(path.join(appData,'bsaber',song.id));
                    this.refreshMySongs();
                }));
            }
        }else if(!isBeatSaberInstalled){
            this.container.innerHTML = '<h4>Beat saber not installed...</h4>';
        }else if(!isQuestSaberPatch){
            this.container.innerHTML = '<h4>Still downloading files please wait and try again...</h4>';
        }
    }
    refreshMySongs(){
        return this.getMySongs()
            .then(()=>this.bsaber.getCurrentDeviceSongs())
            .then(()=>this.openCustomLevels());
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
                        this.showStatus("CPU & GPR lock level set to " + value + "!!");
                        this.toggleLoader(false);
                    })
                    .catch(e => {
                        this.showStatus(e.toString(), true, true);
                        this.toggleLoader(false);
                    })
            });
        });
        [].slice.call(document.querySelectorAll('.set-ca')).forEach(ele=> {
            ele.addEventListener('click', () => {
                let value = 1;
                switch (ele.innerText.toLowerCase()) {
                    case "on":
                        value = 1;
                        break;
                    case "off":
                        value = 0;
                        break;
                }
                this.spinner_loading_message.innerText = 'Setting Chromatic Aberration Setting...';
                this.toggleLoader(true);
                this.setup.adb.shell(this.setup.deviceSerial, '"setprop debug.oculus.forceChroma ' + value + '"')
                    .then(adb.util.readAll)
                    .then(res => {
                        this.showStatus("Chromatic Aberration set to " + value + "!!");
                        this.toggleLoader(false);
                    })
                    .catch(e => {
                        this.showStatus(e.toString(), true, true);
                        this.toggleLoader(false);
                    })
            });
        });
        [].slice.call(document.querySelectorAll('.set-sso')).forEach(ele=> {
            ele.addEventListener('click', () => {
                let value = 512;
                switch (ele.innerText.toLowerCase()) {
                    case "512":
                        value = 512;
                        break;
                    case "768":
                        value = 768;
                        break;
                    case "1280":
                        value = 1280;
                        break;
                    case "1536":
                        value = 1536;
                        break;
                    case "2048":
                        value = 2048;
                        break;
                    case "2560":
                        value = 2560;
                        break;
                    case "3072":
                        value = 3072;
                        break;
                }
                this.spinner_loading_message.innerText = 'Setting Texture Size Setting...';
                this.toggleLoader(true);
                this.setup.adb.shell(this.setup.deviceSerial, '"setprop debug.oculus.textureWidth ' + value + ' && setprop debug.oculus.textureHeight ' + value + '"')
                    .then(adb.util.readAll)
                    .then(res => {
                        this.showStatus("Texture Size set to " + value + "!!");
                        this.toggleLoader(false);
                    })
                    .catch(e => {
                        this.showStatus(e.toString(), true, true);
                        this.toggleLoader(false);
                    })
            });
        });
        [].slice.call(document.querySelectorAll('.set-svb')).forEach(ele=> {
            ele.addEventListener('click', () => {
                let value = 5000000;
                switch (ele.innerText.toLowerCase()) {
                    case "5mbps":
                        value = 5000000;
                        break;
                    case "15mbps":
                        value = 15000000;
                        break;
                    case "25mbps":
                        value = 25000000;
                        break;
                }
                this.spinner_loading_message.innerText = 'Setting Video Bitrate Setting...';
                this.toggleLoader(true);
                this.setup.adb.shell(this.setup.deviceSerial, '"setprop debug.oculus.videoBitrate ' + value + '"')
                    .then(adb.util.readAll)
                    .then(res => {
                        this.showStatus("Video Bitrate set to " + value + "!!");
                        this.toggleLoader(false);
                    })
                    .catch(e => {
                        this.showStatus(e.toString(), true, true);
                        this.toggleLoader(false);
                    })
            });
        });
        [].slice.call(document.querySelectorAll('.set-svr')).forEach(ele=> {
            ele.addEventListener('click', () => {
                let value = 1024;
                switch (ele.innerText.toLowerCase()) {
                    case "1024":
                        value = 1024;
                        break;
                    case "1536":
                        value = 1536;
                        break;
                }
                this.spinner_loading_message.innerText = 'Setting Video Resolution Setting...';
                this.toggleLoader(true);
                this.setup.adb.shell(this.setup.deviceSerial, '"setprop debug.oculus.videoResolution ' + value + '"')
                    .then(adb.util.readAll)
                    .then(res => {
                        this.showStatus("Video Resolution set to " + value + "!!");
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
        document.querySelector('.grant-pavlov-permission').addEventListener('click',()=>{
            this.setup.adb.shell(this.setup.deviceSerial,'pm grant com.davevillz.pavlov android.permission.RECORD_AUDIO')
                .then(adb.util.readAll)
                .then(res=>{
                    this.showStatus('Set permission OK!');
                })
                .catch(e=>{
                    this.showStatus(e.toString(),true,true);
                });
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
        if(~this.setup.devicePackages.indexOf('com.sidequest.wrapper2') && ~this.setup.devicePackages.indexOf('com.sidequest.wrapper') && ~this.setup.devicePackages.indexOf('com.sidequest.launcher')) {
            this.install_launcher_container.innerHTML = '<span class="chip">SideQuest Launcher Already Installed!</span>';
        }else {
            this.install_launcher.addEventListener('click', () => {
                this.install_launcher.style.display = 'none';
                this.install_launcher_loader.style.display = 'inline-block';
                this.setup.installApk('https://cdn.theexpanse.app/SideQuestWrapper.apk')
                    .then(() => this.setup.installApk('https://cdn.theexpanse.app/SideQuestWrapper2.apk'))
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