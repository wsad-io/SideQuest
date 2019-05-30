class Bsaber{
    constructor(app) {
        this.app = app;
        this.customLevels = '/sdcard/Android/data/com.beatgames.beatsaber/files/CustomLevels/';
        this.beatSaberPackage = 'com.beatgames.beatsaber-1';
        this.beatBackupPath = path.join(appData,this.beatSaberPackage+".apk");
    }
    setExecutable(){
        return new Promise((resolve)=>{
            const ls = spawn('chmod', ['+x',this.converterBinaryPath]);
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
            let isInstalled = false;
            let callback = (data) => {
                resolve(!~data.indexOf("Please install the desired version."));
            };
            ls.stdout.on('data', callback);
            ls.stderr.on('data', callback);

        });
    }
    signAPK(dir){
        return new Promise(resolve=>{
            const ls = spawn('java', ['-jar',this.questUberSignerPath,'','']);
            ls.on('close', (code) => {
                resolve();
            });
        });
    }
    questSaberPatch(dir){
        return new Promise(resolve=>{
            const ls = spawn(this.questSaberBinaryPath, []);
            ls.on('close', (code) => {
                resolve();
            });
        });
    }
    async patchAPK() {
        return new Promise((resolve,reject)=>{
            fs.copyFile(this.beatBackupPath, this.beatBackupPath+"_patched.apk", (err) => {
                if (err) return reject(err);
                this.questSaberPatch(dir)
                    .then(()=>this.signAPK(dir));
            });
        })
    }
    downloadAppSigner(){
        let url = 'https://github.com/patrickfav/uber-apk-signer/releases/download/v1.0.0/uber-apk-signer-1.0.0.jar';
        let urlParts = url.split('/');
        let downloadPath = path.join(appData, urlParts[urlParts.length - 1]);
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
        let url = 'https://github.com/trishume/QuestSaberPatch/releases/download/v0.2.0/questsaberpatch-v0.2-';
        let name = 'windows.zip';
        switch (os.platform()) {
            case 'win32':
                name = 'app.exe';
                break;
            case 'darwin':
                name = 'app';
                break;
            case 'linux':
                name = 'app';
                break;
        }
        let downloadPath = path.join(appData, 'saber-quest-patch',name);
        if(this.app.setup.doesFileExist(downloadPath)) return Promise.resolve();
        return new Promise((resolve,reject)=> {
            this.app.setup.downloadFile(url + 'windows.zip', url + 'linux.tar.gz', url + 'osx.tar.gz', downloadUrl => {
                let urlParts = downloadUrl.split('/');
                return path.join(appData,urlParts[urlParts.length - 1]);
            })
                .then(_path => {
                    let callback = error => {
                        if(error) return reject(error);
                        this.questSaberBinaryPath = _path;
                        fs.unlink(_path, err => {
                            if(err) return reject(err);
                            return resolve();
                        });
                    };
                    if (os.platform() === 'darwin' || os.platform() === 'linux') {
                        targz.decompress({
                            src: _path,
                            dest: path.join(appData, 'saber-quest-patch')
                        }, callback);
                        return this.setExecutable()
                            .then(() => resolve());
                    }else{
                        extract(_path, {dir: path.join(appData, 'saber-quest-patch')}, callback);
                    }
                });
        });
    }
    downloadConverterBinary(){
        let url = 'https://github.com/lolPants/songe-converter/releases/download/v0.4.2/songe-converter';
        let name = 'windows.zip';
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
        if(this.app.setup.doesFileExist(downloadPath)) return Promise.resolve();
        return new Promise((resolve,reject)=> {
            this.app.setup.downloadFile(url + '.exe', url, url + '-mac', downloadUrl => {
                let urlParts = downloadUrl.split('/');
                return path.join(appData, urlParts[urlParts.length - 1]);
            })
                .then(path => {
                    this.converterBinaryPath = path;
                    if (os.platform() === 'darwin' || os.platform() === 'linux') {
                        return this.setExecutable()
                            .then(() => resolve());
                    } else {
                        return resolve()
                    }
                });
        });
    }
    removeSong(id){
        return this.app.setup.adb.shell(this.app.setup.deviceSerial,'rm -r '+path.posix.join(this.customLevels,id));
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
    async backUpBeatSaberBinary(){
        if(this.app.setup.doesFileExist(this.beatBackupPath)) return Promise.reject("File already exists");
        if(!~this.app.setup.devicePackages.indexOf(this.beatSaberPackage)) return Promise.reject("Not installed");
        return this.app.setup.adb.shell(this.app.setup.deviceSerial,'pm path '+this.beatSaberPackage)
            .then(adb.util.readAll)
            .then(res=>res.toString().trim())
            .then(apkPath=>this.app.setup.adb.pull(this.app.setup.deviceSerial,apkPath))
            .then(transfer=>new Promise((resolve, reject)=>{
                    transfer.on('progress', function(stats) {});
                    transfer.on('end', resolve);
                    transfer.on('error', reject);
                    transfer.pipe(fs.createWriteStream(this.beatBackupPath));
                }));
    }
    async isBeatSaberInstalled(){
        // await this.app.setup.getPackages();
        // return ~this.app.setup.devicePackages.indexOf(this.beatSaberPackage);
        return this.app.setup.adb.shell(this.app.setup.deviceSerial,'ls /sdcard/Android/data/')
            .then(adb.util.readAll)
            .then(res=>!!~res.toString().split('\n').map(d=>d.trim()).indexOf('com.beatgames.beatsaber'));
    }
    makeCustomDirectory(){
        return this.app.setup.makeDirectory(this.customLevels);
    }
    getCurrentDeviceSongs(forceUpdate) {
        if (this.currentSongs && !forceUpdate) return Promise.resolve(this.currentSongs);
        this.currentSongs = [];
        return this.currentSongs;
    }
    getCurrentDeviceSongsNew(forceUpdate){
        if(this.currentSongs&&!forceUpdate)return Promise.resolve(this.currentSongs);
        return this.app.setup.adb.shell(this.app.setup.deviceSerial,'ls '+this.customLevels)
            .then(adb.util.readAll)
            .then(res=>{
                this.currentSongs = res.toString().split(' ').map(d=>d.trim()).filter(d=>d);
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
                return this.currentSongs;
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
                                    resolve({dir,name});
                                });
                            }
                        });
                    });
                });
        })
    }
}