class Bsaber{
    constructor(app) {
        this.app = app;
        this.customLevels = '/sdcard/Android/data/com.beatgames.beatsaber/files/CustomLevels/'
    }
    isBeatSaberInstalled(){
        return this.app.setup.adb.shell(this.app.setup.deviceSerial,'ls /sdcard/Android/data/')
            .then(adb.util.readAll)
            .then(res=>!!~res.toString().split('\n').map(d=>d.trim()).indexOf('com.beatgames.beatsaber'));
    }
    makeCustomDirectory(){
        return this.app.setup.makeDirectory(this.customLevels);
    }
    getCurrentDeviceSongs(forceUpdate){
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
                        let alreadyInstalled = e.parentElement.querySelector('.beat-already-installed');
                        if(~window.beatInstalled.indexOf(hrefParts[hrefParts.length-1])){
                            if(downloadButton) downloadButton.style.display = 'none';
                            if(alreadyInstalled) alreadyInstalled.style.display = 'inline-block';
                        }else{
                            if(downloadButton) downloadButton.style.display = 'inline-block';
                            if(alreadyInstalled) alreadyInstalled.style.display = 'none';
                        }
                    });
                `);
                return this.currentSongs;
            });
    }
    pushSongToDevice(beatsaber){
        return new Promise((resolve, reject)=>{
            fs.readdir(beatsaber.dir, (err,name)=>{
                if(err||!name.length) return reject(err||"Song directory empty! - "+beatsaber.dir);
                let innerDir = path.join(beatsaber.dir,name[0]),
                    deviceInnerName = path.posix.join(this.customLevels,beatsaber.name,name[0]);
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
                                                console.log('[%s] Push complete', this.app.setup.deviceSerial);
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