import { Injectable } from '@angular/core';
import { LoadingSpinnerService } from './loading-spinner.service';
import { HttpClient } from '@angular/common/http';
import { ProcessBucketService } from './process-bucket.service';
import { StatusBarService } from './status-bar.service';
import { AppService } from './app.service';

@Injectable({
    providedIn: 'root',
})
export class SynthriderService {
    constructor(
        private http: HttpClient,
        private spinnerService: LoadingSpinnerService,
        private statusService: StatusBarService,
        private appService: AppService,
        private processService: ProcessBucketService
    ) {}

    downloadSong(downloadUrl, adbService) {
        return this.processService.addItem('song_download', async task => {
            let parts = downloadUrl.split('/');
            let zipPath = this.appService.path.join(this.appService.appData, this.appService.uuidv4() + '.zip');
            let ws = this.appService.fs.createWriteStream(zipPath);
            //let name = parts[parts.length - 1].split('.')[0];
            const requestOptions = {
                timeout: 30000,
                'User-Agent': this.appService.getUserAgent(),
            };
            task.status = 'Saving to CustomSongs...';
            return new Promise((resolve, reject) => {
                let request = this.appService
                    .progress(this.appService.request(downloadUrl, requestOptions), { throttle: 50 })
                    .on('error', error => {
                        task.failed = true;
                        task.status = 'Failed to save song... ' + error.toString();
                        reject(error);
                    })
                    .on('progress', state => {
                        task.status = 'Saving to CustomSongs... ' + Math.round(state.percent * 100) + '%';
                    })
                    .on('response', response => {
                        var regexp = /filename=\"(.*)\"/gi;
                        zipPath = this.appService.path.join(
                            this.appService.appData,
                            regexp.exec(response.headers['content-disposition'])[1]
                        );
                        request.pipe(this.appService.fs.createWriteStream(zipPath));
                    })
                    .on('end', async () => {
                        let ext = this.appService.path.extname(zipPath).toLowerCase();
                        let basename = this.appService.path.basename(zipPath);
                        console.log(zipPath, ext, basename);
                        switch (ext) {
                            case '.synth':
                                await adbService.uploadFile(
                                    [
                                        {
                                            name: zipPath,
                                            savePath: '/sdcard/Android/data/com.kluge.SynthRiders/files/CustomSongs/' + basename,
                                        },
                                    ],
                                    task
                                );
                                task.status = 'Saved! ' + basename;
                                resolve();
                                break;
                        }
                    });
                //.pipe(ws);
            });
        });
    }
}
