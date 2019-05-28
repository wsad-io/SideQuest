class Bsaber{
    constructor(app) {
        this.app = app;
        this.customLevels = '/sdcard/Android/data/com.beatgames.beatsaber/files/CustomLevels/';
    }
    convertSong(dir){
        return new Promise((resolve,reject)=>{
            const { spawn } = require('child_process');
            const ls = spawn(this.converterBinaryPath, [path.join(dir,'info.json')]);
            ls.stdout.on('data', (data) => {
               // console.log(`stdout: ${data}`);
            });

            ls.stderr.on('data', (data) => {
               // console.log(`stderr: ${data}`);
            });

            ls.on('close', (code) => {
                resolve();
                //console.log(`child process exited with code ${code}`);
            });
        });
    }
    downloadConverterBinary(){
        const requestOptions = {timeout: 30000, 'User-Agent': this.app.setup.getUserAgent()};
        let song_converter_LIN = 'https://github.com/lolPants/songe-converter/releases/download/v0.4.2/songe-converter';
        let song_converter_MAC = 'https://github.com/lolPants/songe-converter/releases/download/v0.4.2/songe-converter-mac';
        let song_converter_WIN = 'https://github.com/lolPants/songe-converter/releases/download/v0.4.2/songe-converter.exe';
        let downloadUrl = song_converter_LIN;
        switch (os.platform()) {
            case 'win32':
                downloadUrl = song_converter_WIN;
                break;
            case 'darwin':
                downloadUrl = song_converter_MAC;
                break;
            case 'linux':
                downloadUrl = song_converter_LIN;
                break;
        }
        let urlParts = downloadUrl.split('/');
        this.converterBinaryPath = path.join(appData,urlParts[urlParts.length-1]);
        return new Promise((resolve,reject)=>{
            request(downloadUrl, requestOptions)
                .on('error', (error)  => {
                    debug(`Request Error ${error}`);
                    reject(error);
                })
                .pipe(fs.createWriteStream(this.converterBinaryPath))
                .on('finish', ()=>resolve());
        })
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