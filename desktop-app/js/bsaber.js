class Bsaber{
    constructor(app) {
        this.app = app;
        this.customLevels = '/sdcard/Android/data/com.beatgames.beatsaber/files/CustomLevels/';
        this.beatSaberPackage = 'com.beatgames.beatsaber';
        this.beatBackupPath = path.join(appData,'bsaber-backups',this.beatSaberPackage);
        this.supportedBeatSaberVersion = '1.0.0';
    }
    setExecutable(path){
        return new Promise((resolve)=>{
            const ls = spawn('chmod', ['+x',path]);
            ls.on('close', (code) => {
                resolve();
            });
        });
    }
    convertSong(dir){
        return new Promise((resolve)=>{
            const ls = spawn(this.converterBinaryPath, [path.join(dir,'info.json')]);
            ls.on('close', (code) => {
                resolve();
            });
        });
    }
    checkJava64(){
        return new Promise(resolve=>{
            const ls = spawn('java', ['-d64','-version']);//,{env: process.env}
            let callback = (data) => {
                resolve(!~data.indexOf("Please install the desired version."));
            };
            ls.stdout.on('data', callback);
            ls.stderr.on('data', callback);

        });
    }
    signAPK(dir){
        return new Promise(resolve=>{
            const ls = spawn('java', ['-jar',this.questUberSignerPath,'-a','"'+dir+'"','--overwrite']);
            ls.on('close', (code) => {
                resolve();
            });
            let callback = (data) => {
                document.getElementById('patch-loading-message').innerHTML = 'Installing now,<br>'+(data.toString().length?'<span class="chip">'+data.toString()+'</span>':'');
            };
            ls.stdout.on('data', callback);
            ls.stderr.on('data', callback);
        });
    }
    questSaberPatch(json){
        return new Promise((resolve,reject)=>{
            console.log("Starting QuestSaberPatch: ",json);
            fs.writeFileSync(path.join(appData,'__json.json'),JSON.stringify(json));
            const exec = require('child_process').exec;
            exec('"'+this.questSaberBinaryPath+'" < "'+path.join(appData,'__json.json')+'"', function(err, stdout, stderr) {
                if (err) {
                    return reject(err);
                }
                try{
                    stdout = JSON.parse(stdout);
                    console.log("QuestSaberPatch Response: ",stdout);
                }catch(e){
                    console.warn("QuestSaberPatch Failure: ",stdout);
                    return reject('JSON parse error from jsonApp.exe');
                }
                if(stderr)return reject(stderr);
                return resolve(stdout);
            });
        });
    }
    async patchAPK(songs) {
        return new Promise((resolve,reject)=>{
            let patched_file = path.join(appData,'bsaber-base_patched.apk');
            if(!this.app.setup.doesFileExist(patched_file)){
                if(!this.resetPatched()){
                    return reject('Could not copy base file, Does not exist!');
                }
            }
            let json = {
                "apkPath":patched_file,
                "sign":true,
                "patchSignatureCheck":true,
                "ensureInstalled":{
                //    "BUBBLETEA":"testdata/bubble_tea_song"
                },
                "exitAfterward":true
            };
            songs.forEach(song=>{
                let name = song.name.replace(/\(.+?\)/g, '');
                    name = name.replace(/[^a-z0-9]+/gi, '');
                json.ensureInstalled[song.id+"_"+name] = song.path;
            });
            this.questSaberPatch(json)
                .then(resolve)
                .catch(reject);
        });
    }
    downloadAppSigner(){
        let url = 'https://github.com/patrickfav/uber-apk-signer/releases/download/v1.0.0/uber-apk-signer-1.0.0.jar';
        let urlParts = url.split('/');
        let downloadPath = path.join(appData, urlParts[urlParts.length - 1]);
        this.questUberSignerPath = downloadPath;
        if(this.app.setup.doesFileExist(downloadPath)) return Promise.resolve();
        return new Promise((resolve,reject)=> {
            this.app.setup.downloadFile(url, url, url, () => downloadPath)
                .then(path => {
                    this.questUberSignerPath = path;
                    return resolve();
                });
        });
    }
    downloadQuestSaberPatch(){
        let url = 'https://github.com/trishume/QuestSaberPatch/releases/download/v0.4.0/questsaberpatch-';
        let name = 'app.exe';
        switch (os.platform()) {
            case 'win32':
                name = 'questsaberpatch/jsonApp.exe';
                break;
            case 'darwin':
                name = 'questsaberpatch/jsonApp';
                break;
            case 'linux':
                name = 'questsaberpatch/jsonApp';
                break;
        }
        let downloadPath = path.join(appData, 'saber-quest-patch',name);
        this.questSaberBinaryPath = downloadPath;
        if(this.app.setup.doesFileExist(downloadPath)) return Promise.resolve();
        return new Promise((resolve,reject)=> {
            this.app.setup.downloadFile(url + 'windows.zip', url + 'linux.zip', url + 'osx.zip', downloadUrl => {
                let urlParts = downloadUrl.split('/');
                return path.join(appData,urlParts[urlParts.length - 1]);
            })
                .then(_path => {
                    let callback = error => {
                        if(error) return reject(error);
                        fs.unlink(_path, err => {
                            if(err) return reject(err);
                            if (os.platform() === 'darwin' || os.platform() === 'linux') {
                                this.setExecutable(this.questSaberBinaryPath)
                                    .then(() => resolve());
                            }else{
                                return resolve();
                            }
                        });
                    };

                    extract(_path, {dir: path.join(appData, 'saber-quest-patch')}, callback);
                });
        });
    }
    downloadConverterBinary(){
        let url = 'https://github.com/lolPants/songe-converter/releases/download/v0.4.2/songe-converter';
        let name = '.exe';
        switch (os.platform()) {
            case 'win32':
                name = '.exe';
                break;
            case 'darwin':
                name = '-mac';
                break;
            case 'linux':
                name = '';
                break;
        }
        let urlParts = (url+name).split('/');
        let downloadPath = path.join(appData, urlParts[urlParts.length - 1]);
        if(this.app.setup.doesFileExist(downloadPath)) {
            this.converterBinaryPath = downloadPath;
            return Promise.resolve();
        }
        return new Promise((resolve,reject)=> {
            this.app.setup.downloadFile(url + '.exe', url, url + '-mac', downloadUrl => {
                let urlParts = downloadUrl.split('/');
                return path.join(appData, urlParts[urlParts.length - 1]);
            })
                .then(path => {
                    this.converterBinaryPath = path;
                    if (os.platform() === 'darwin' || os.platform() === 'linux') {
                        return this.setExecutable(this.converterBinaryPath)
                            .then(() => resolve());
                    } else {
                        return resolve()
                    }
                });
        });
    }
    removeSong(id){
        //return this.app.setup.adb.shell(this.app.setup.deviceSerial,'rm -r '+path.posix.join(this.customLevels,id));
        this.deleteFolderRecursive(path.join(appData,'bsaber',id));
        return Promise.resolve();
    }
    deleteFolderRecursive(path) {
        if( fs.existsSync(path) ) {
            fs.readdirSync(path).forEach(file=>{
                let curPath = path + "/" + file;
                if(fs.lstatSync(curPath).isDirectory()) { // recurse
                    this.deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }
    setBeatVersion(skipCheck){
        return this.app.setup.getPackageInfo(this.beatSaberPackage)
            .then(version=>{
                this.beatSaberVersion = (version||"").trim();
                let visualVersion = document.querySelector('.beat-saber-version');
                if(this.beatSaberVersion !== this.supportedBeatSaberVersion){
                    visualVersion.innerHTML = '<span style="background-color:red;color:white">WRONG BEAT SABER VERSION: '+this.beatSaberVersion+'</span>';
                    if(!skipCheck)throw new Error('Wrong beat saber version installed!');
                }else{
                    visualVersion.innerHTML = 'Beat Saber Version: '+this.beatSaberVersion;
                }
            })
    }
    resetPatched(){
        if(this.app.setup.doesFileExist(path.join(appData,'bsaber-base.apk'))){
            fs.copyFileSync(path.join(appData,'bsaber-base.apk'),path.join(appData,'bsaber-base_patched.apk'));
            return true;
        }
    }
    async backUpBeatSaberBinary(){
        if(!~this.app.setup.devicePackages.indexOf(this.beatSaberPackage)) return Promise.reject("Not installed");
        this.app.toggleLoader(true);
        this.beatSaberVersion = '0.0.0.0';
        this.app.spinner_loading_message.innerText = 'Backing Up - 0MB';
        return this.setBeatVersion(true)
            .then(()=>this.app.setup.adb.shell(this.app.setup.deviceSerial,'pm path '+this.beatSaberPackage))
            .then(adb.util.readAll)
            .then(res=>res.toString().trim().substr(8))
            .then(apkPath=>this.app.setup.adb.pull(this.app.setup.deviceSerial,apkPath))
            .then(transfer=>new Promise((resolve, reject)=>{
                let backup_save_path = this.beatBackupPath+this.beatSaberVersion.trim()+"_"+(JSON.stringify(new Date()).split('"').join('').split(':').join('-').trim())+'.apk'
                transfer.on('progress', (stats)=> {
                    this.app.spinner_loading_message.innerText = 'Backing Up - '+(Math.round(stats.bytesTransferred/1024/1024))+'MB';
                });
                transfer.on('end', ()=>{
                    if(!this.app.setup.doesFileExist(path.join(appData,'bsaber-base.apk'))){
                        fs.copyFileSync(backup_save_path,path.join(appData,'bsaber-base.apk'));
                    }
                    return resolve();
                });
                transfer.on('error', reject);
                transfer.pipe(fs.createWriteStream(backup_save_path));
            }))
            .then(()=>{
                this.app.showStatus('Backup made successfully!');
                this.app.toggleLoader(false);
            })
            .catch(e=>{
                this.app.showStatus(e.toString(),true,true);
                this.app.toggleLoader(false);
            });
    }
    async runQuestSaberPatch(songs){
        if(!~this.app.setup.devicePackages.indexOf(this.beatSaberPackage)) return Promise.reject("Not installed");
        if(!songs.length) return Promise.reject("No songs selected");
        return this.setBeatVersion(true)
            .then(()=>this.patchAPK(songs))
            .catch(e=>{
                this.app.showStatus(e.toString(),true,true);
            })
    }
    async restoreDataBackup(folderName){
        if(!this.app.setup.doesFileExist(path.join(appData,'bsaber-data-backups',folderName))){
            return;
        }
        if(!await this.hasBeatSDFolder('data')){
            await this.app.setup.makeDirectory('/sdcard/Android/data/com.beatgames.beatsaber/');
            await this.app.setup.makeDirectory('/sdcard/Android/data/com.beatgames.beatsaber/files/');
        }
        if(!await this.hasBeatSDFolder('obb')){
            await this.app.setup.makeDirectory('/sdcard/Android/obb/com.beatgames.beatsaber/');
        }
        let backupDirectory = path.join(appData,'bsaber-data-backups',folderName,'obb');
        return this.app.setup.adb.push(this.app.setup.deviceSerial,path.join(appData,'bsaber-data-backups',folderName,'PlayerData.dat'),
            '/sdcard/Android/data/com.beatgames.beatsaber/files/PlayerData.dat')
            .then(()=>this.app.setup.doesFileExist(path.join(appData,'bsaber-data-backups',folderName,'settings.cfg'))?
                this.app.setup.adb.push(this.app.setup.deviceSerial,path.join(appData,'bsaber-data-backups',folderName,'settings.cfg'),
                '/sdcard/Android/data/com.beatgames.beatsaber/files/settings.cfg'):
                Promise.resolve())
            .then(()=> new Promise((resolve,reject)=>{
                fs.readdir(backupDirectory,(err,data)=> {
                    if (err) {
                        reject("Error reading backup directory: " + backupDirectory + ", Error:" + err);
                    } else {
                        resolve((data||[]).filter(d=>d.substr(d.length-4)===".obb"));
                    }
                });
            }))
            .then(obbFiles=>Promise.all(obbFiles.map(obb=>{
                return this.app.setup.adb.push(this.app.setup.deviceSerial,path.join(appData,'bsaber-data-backups',folderName,'obb',obb),
                    '/sdcard/Android/obb/com.beatgames.beatsaber/'+obb)
            })))

    }
    async makeDataBackup(){
        let folderName = new Date().getTime().toString();
        if(await this.hasBeatSDFolder('data')){
            this.app.mkdir(path.join(appData,'bsaber-data-backups',folderName));
            await this.app.setup.adb.pull(this.app.setup.deviceSerial,'/sdcard/Android/data/com.beatgames.beatsaber/files/PlayerData.dat')
                .then(transfer=>new Promise((resolve, reject)=>{
                    transfer.on('end', resolve);
                    transfer.on('error', reject);
                    transfer.pipe(fs.createWriteStream(path.join(appData,'bsaber-data-backups',folderName,'PlayerData.dat')));
                })).then(()=>this.app.setup.adb.pull(this.app.setup.deviceSerial,'/sdcard/Android/data/com.beatgames.beatsaber/files/settings.cfg'))
                .then(transfer=>new Promise((resolve, reject)=>{
                    let settingsPath = path.join(appData,'bsaber-data-backups',folderName,'settings.cfg')
                    transfer.on('end', resolve);
                    transfer.on('error', err=>{
                        if(this.app.setup.doesFileExist(settingsPath)){
                            fs.unlinkSync(settingsPath)
                        }
                        resolve();
                    });
                    transfer.pipe(fs.createWriteStream(settingsPath));
                }));
        }
        if(await this.hasBeatSDFolder('obb')){
            this.app.mkdir(path.join(appData,'bsaber-data-backups',folderName));
            this.app.mkdir(path.join(appData,'bsaber-data-backups',folderName,'obb'));
            let folders = await this.app.setup.getFolders('/sdcard/Android/obb/com.beatgames.beatsaber/');
            await (folders||[]).forEach(async folder=>{
                await this.app.setup.adb.pull(this.app.setup.deviceSerial,'/sdcard/Android/obb/com.beatgames.beatsaber/'+folder)
                    .then(transfer=>new Promise((resolve, reject)=>{
                        transfer.on('end', resolve);
                        transfer.on('error', reject);
                        transfer.pipe(fs.createWriteStream(path.join(appData,'bsaber-data-backups',folderName,'obb',folder)));
                    }))
            });
        }
        return folderName;
    }
    async hasBeatSDFolder(name){
        let folders = await this.app.setup.getFolders('/sdcard/Android/'+name+'/');
        return !!~folders.indexOf('com.beatgames.beatsaber');
    }
    async isBeatSaberInstalled(){
        await this.app.setup.getPackages();
        return ~this.app.setup.devicePackages.indexOf(this.beatSaberPackage);
    }
    makeCustomDirectory(){
        return this.app.setup.makeDirectory(this.customLevels);
    }
    getCurrentDeviceSongs() {
        //this.app.setup.adb.shell(this.app.setup.deviceSerial,'ls '+this.customLevels)
        //             .then(adb.util.readAll)
        this.currentSongs = (this.app.songs||[]).map(d=>d.id);
        this.app.beatView.executeJavaScript(`
            window.beatInstalled = ['`+this.currentSongs.join('\',\'')+`'];
            [].slice.call(document.querySelectorAll('.bsaber-tooltip.-download-zip')).forEach(e=>{
                let hrefParts = e.href.split('/');
                let downloadButton = e.parentElement.querySelector('.bsaber-tooltip.-sidequest');
                let removeButton = e.parentElement.querySelector('.bsaber-tooltip.-sidequest-remove');
                let alreadyInstalled = e.parentElement.querySelector('.beat-already-installed');
                if(~window.beatInstalled.indexOf(hrefParts[hrefParts.length-1])){
                    if(downloadButton) downloadButton.style.display = 'none';
                    if(alreadyInstalled) alreadyInstalled.style.display = 'inline-block';
                    if(removeButton) removeButton.style.display = 'inline-block';
                }else{
                    if(downloadButton) downloadButton.style.display = 'inline-block';
                    if(alreadyInstalled) alreadyInstalled.style.display = 'none';
                    if(removeButton) removeButton.style.display = 'none';
                }
            });
        `);
        return Promise.resolve(this.currentSongs);
    }
    convertSongCheck(beatsaber){
        return new Promise((resolve, reject)=> {
            fs.readdir(beatsaber.dir, async (err,name)=>{
                if(err||!name.length) return reject(err||"Song directory empty! - "+beatsaber.dir);
                let innerDir = path.join(beatsaber.dir,name[0]);
                if(fs.existsSync(path.join(innerDir,'info.json'))){
                    await this.convertSong(innerDir);
                }
                resolve();
            });
        });
    }
    pushSongToDevice(beatsaber){
        return new Promise((resolve, reject)=>{
            fs.readdir(beatsaber.dir, async (err,name)=>{
                if(err||!name.length) return reject(err||"Song directory empty! - "+beatsaber.dir);
                let innerDir = path.join(beatsaber.dir,name[0]),
                    deviceInnerName = path.posix.join(this.customLevels,beatsaber.name,name[0]);
                if(fs.existsSync(path.join(innerDir,'info.json'))){
                    await this.convertSong(innerDir);
                }
                this.app.setup.makeDirectory(path.posix.join(this.customLevels,beatsaber.name))
                    .then(()=>this.app.setup.makeDirectory())
                    .then(()=>{
                        fs.readdir(innerDir, (err,names)=>{
                            if(err||!names.length) return reject(err||"Song directory empty! - "+innerDir);
                            Promise.all(names.map(n=>{
                                return this.app.setup.adb.push(this.app.setup.deviceSerial, path.join(innerDir,n), path.posix.join(deviceInnerName,n))
                                    .then((transfer) =>{
                                        return new Promise((_resolve, _reject)=> {
                                            transfer.on('progress', (stats) => {
                                                // console.log('[%s] Pushed %d bytes so far',
                                                //     this.app.setup.deviceSerial,
                                                //     stats.bytesTransferred)
                                            });
                                            transfer.on('end', () => {
                                               // console.log('[%s] Push complete', this.app.setup.deviceSerial);
                                               // this.deleteFolderRecursive(beatsaber.dir);
                                                _resolve()
                                            });
                                            transfer.on('error', _reject);
                                        });
                                    });
                            }))
                                .then(resolve)
                                .catch(reject);
                        });
                    });
            });
        })
            .catch(e=>{
                console.log(e);
            });
    }
    downloadSong(downloadUrl){
        let parts = downloadUrl.split('/');
        let zipPath = path.join(appData,parts[parts.length-1]);
        let name = parts[parts.length-1].split('.')[0];
        const requestOptions = {timeout: 30000, 'User-Agent': this.app.setup.getUserAgent()};
        return new Promise((resolve,reject)=>{
            request(downloadUrl, requestOptions)
                .on('error', (error)  => {
                    debug(`Request Error ${error}`);
                    reject(error);
                })
                .pipe(fs.createWriteStream(zipPath))
                .on('finish', ()  => {
                    let dir = path.join(appData,'bsaber',name);
                    fs.mkdir(dir,()=>{
                        extract(zipPath, {dir: dir},(error) => {
                            if(error) {
                                reject(error);
                            }else{
                                fs.unlink(zipPath, (err) => {
                                    this.convertSongCheck({dir,name})
                                        .then(resolve);
                                });
                            }
                        });
                    });
                });
        })
    }
}