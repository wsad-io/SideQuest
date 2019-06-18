import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { AdbClientService } from './adb-client.service';
import { StatusBarService } from './status-bar.service';
import { SongItem } from './song-pack-manager/song-pack-manager.component';
declare let __dirname;
enum OrderType{
  NAME,DATE
}
interface QuestSaberPatchLevel {
  r: number;
  g:number;
  b:number;
  a:number;
}
interface QuestSaberPatchColor {
  r: number;
  g:number;
  b:number;
  a:number;
}
interface QuestSaberPatchColors {
  colorA: QuestSaberPatchColor;
  colorB: QuestSaberPatchColor;
}
interface QuestSaberPatchPack {
  id: string;
  name: string;
  coverImagePath: string;
  levelIDs: string[]|SongItem[];
  isOpen?:boolean;
}
export interface QuestSaberPatchJson {
  apkPath:string;
  sign: boolean;
  patchSignatureCheck: boolean;
  ensureInstalled?:any;
  levels:any;
  packs: QuestSaberPatchPack[];
  exitAfterward: boolean;
  colors: QuestSaberPatchColors;
  replaceText: any;
}
@Injectable({
  providedIn: 'root',
})
export class BsaberService {
  customLevels: string = '/sdcard/Android/data/com.beatgames.beatsaber/files/CustomLevels/';
  beatSaberPackage: string = 'com.beatgames.beatsaber';
  beatBackupPath: string;
  supportedBeatSaberVersions: string[] = ['1.1.0', '1.0.2', '1.0.1', '1.0.0'];
  questSaberPatchVersion: string = localStorage.getItem('quest-saber-patch-version') || 'v0.7.0';
  questSaberBinaryPath: string;
  converterBinaryPath: string;
  beatSaberVersion: string;
  beatSaberVersionMessage: string;
  orderType:OrderType;
  songs:SongItem[] = [];
  jSon:QuestSaberPatchJson;
  constructor(private appService: AppService, private adbService: AdbClientService, private statusService: StatusBarService) {
    this.beatBackupPath = appService.path.join(appService.appData, 'bsaber-backups', this.beatSaberPackage);

    let bsVersions = localStorage.getItem('beat-saber-version');
    try {
      this.supportedBeatSaberVersions = bsVersions ? JSON.parse(bsVersions) : this.supportedBeatSaberVersions;
    } catch (e) {
      localStorage.setItem('beat-saber-version', JSON.stringify(this.supportedBeatSaberVersions));
    }
    this.downloadQSP()
      .then(() => <Promise<void>>this.downloadConverterBinary())
      .then(()=>this.jSon = this.getAppJson());
  }
  async getBSandQSPVersions() {
    const jsonUrl = 'https://raw.githubusercontent.com/the-expanse/SideQuest/master/vendor_versions.txt';
    return new Promise((resolve, reject) => {
      this.appService.request(jsonUrl, (error, response, body) => {
        if (error) {
          return reject(error);
        } else {
          try {
            let repo_body = JSON.parse(body);
            resolve(repo_body);
          } catch (e) {
            return reject('JSON parse Error');
          }
        }
      });
    })
      .then(resp => {
        if (resp['beat-saber'] && resp['beat-saber'].length) {
          this.supportedBeatSaberVersions = resp['beat-saber'];
          localStorage.setItem('beat-saber-version', JSON.stringify(resp['beat-saber']));
        }
        if (resp['quest-saber-patch']) {
          this.questSaberPatchVersion = resp['quest-saber-patch'];
          localStorage.setItem('quest-saber-patch-version', resp['quest-saber-patch']);
        }
        if (resp['sidequest']) {
          this.appService.updateAvailable = resp['sidequest'] !== this.appService.versionName;
        }
      })
      .catch(e => {
        console.warn(e);
      });
  }
  async downloadQSP() {
    await this.getBSandQSPVersions();
    let url =
      'https://github.com/trishume/QuestSaberPatch/releases/download/' + this.questSaberPatchVersion + '/questsaberpatch-';
    let name = 'questsaberpatch/jsonApp2.exe';
    switch (this.appService.os.platform()) {
      case 'win32':
        name = 'questsaberpatch/jsonApp2.exe';
        break;
      case 'darwin':
        name = 'questsaberpatch/jsonApp2';
        break;
      case 'linux':
        name = 'questsaberpatch/jsonApp2';
        break;
    }
    let downloadPath = this.appService.path.join(this.appService.appData, 'saber-quest-patch', name);
    this.questSaberBinaryPath = downloadPath;
    if (this.appService.doesFileExist(downloadPath)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      this.appService
        .downloadFile(url + 'windows.zip', url + 'linux.zip', url + 'osx.zip', downloadUrl => {
          let urlParts = downloadUrl.split('/');
          return this.appService.path.join(this.appService.appData, urlParts[urlParts.length - 1]);
        })
        .then(_path => {
          let callback = error => {
            if (error) return reject(error);
            this.appService.fs.unlink(_path, err => {
              // if(err) return reject(err);
              if (this.appService.os.platform() === 'darwin' || this.appService.os.platform() === 'linux') {
                this.appService.setExecutable(this.questSaberBinaryPath).then(() => resolve());
              } else {
                return resolve();
              }
            });
          };

          this.appService.extract(
            _path,
            { dir: this.appService.path.join(this.appService.appData, 'saber-quest-patch') },
            callback
          );
        });
    });
  }
  downloadConverterBinary() {
    let url = 'https://github.com/lolPants/songe-converter/releases/download/v0.4.3/songe-converter';
    let name = '.exe';
    switch (this.appService.os.platform()) {
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
    let urlParts = (url + name).split('/');
    let downloadPath = this.appService.path.join(this.appService.appData, urlParts[urlParts.length - 1]);
    if (this.appService.doesFileExist(downloadPath)) {
      this.converterBinaryPath = downloadPath;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.appService
        .downloadFile(url + '.exe', url, url + '-mac', downloadUrl => {
          let urlParts = downloadUrl.split('/');
          return this.appService.path.join(this.appService.appData, urlParts[urlParts.length - 1]);
        })
        .then(path => {
          this.converterBinaryPath = path.toString();
          if (this.appService.os.platform() === 'darwin' || this.appService.os.platform() === 'linux') {
            return this.appService.setExecutable(this.converterBinaryPath).then(() => resolve());
          } else {
            return resolve();
          }
        });
    });
  }
  setBeatVersion(skipCheck) {
    return this.adbService.getPackageInfo(this.beatSaberPackage).then(version => {
      this.beatSaberVersion = (version || '').trim();
      if (!~this.supportedBeatSaberVersions.indexOf(this.beatSaberVersion)) {
        this.beatSaberVersionMessage =
          '<span style="background-color:red;color:white">WRONG BEAT SABER VERSION: ' + this.beatSaberVersion + '</span>';
        if (!skipCheck) throw new Error('Wrong beat saber version installed!');
      } else {
        this.beatSaberVersionMessage = 'Beat Saber Version: ' + this.beatSaberVersion;
      }
    });
  }
  saveJson(jSon) {
    let _jSon = {
      apkPath: jSon.apkPath,
      sign: true,
      patchSignatureCheck: true,
      levels: {},
      packs: [],
      exitAfterward: true,
      colors: {
        colorA: jSon.colors.colorA,
        colorB: jSon.colors.colorB,
      },
      replaceText: jSon.replaceText,
    };
    jSon.packs.forEach((p, i) => {
      let pack = {
        id: p.id === '__default_pack' ? p.id : 'pack_' + i,
        name: p.name,
        coverImagePath: p.coverImagePath,
        levelIDs: p.levelIDs.map(l => {
          _jSon.levels[l.id + '_' + l.name] = l.path;
          return l.id + '_' + l.name;
        }),
      };
      _jSon.packs.push(pack);
    });
    this.appService.fs.writeFileSync(this.appService.path.join(this.appService.appData, '__json.json'), JSON.stringify(_jSon));
  }
  getAppJson() {
    let patched_file = this.appService.path.join(this.appService.appData, 'bsaber-base_patched.apk');
    let songKeys = this.songs.map(s => s.id + '_' + s.name);
    let defaultJSON:QuestSaberPatchJson = {
      apkPath: patched_file,
      sign: true,
      patchSignatureCheck: true,
      ensureInstalled: {},
      levels: {},
      packs: [
        {
          // Must be unique between packs but doesn't need to be consistent
          id: '__default_pack',
          // Display name of the pack
          name: 'Custom Songs',
          // Image file for the cover that will be displayed for the pack
          coverImagePath: this.appService.path.join(__dirname, 'default-pack-cover.png'),
          // List of level IDs in the pack in the order you want them displayed.
          // Each levelID can be in multiple packs if you want.
          levelIDs: [], //this.app.songs,
        },
      ],
      exitAfterward: true,
      colors: {
        // A is the red/left hand by default, but left-handed people might use the setting to switch hands
        colorA: null,
        // null for either resets to the default color for that saber
        colorB: null,
      },
      replaceText: {
        // See https://github.com/sc2ad/QuestModdingTools/blob/master/BeatSaberLocale.txt for
        //"BUTTON_PLAY": "GO!",
      },
    };
    this.songs.forEach(song => {
      defaultJSON.levels[song.id + '_' + song.name] = song.path;
    });
    let jsonFile = this.appService.path.join(this.appService.appData, '__json.json');
    let data = defaultJSON;
    if (this.appService.fs.existsSync(jsonFile)) {
      try {
        let dataString = this.appService.fs.readFileSync(jsonFile, 'utf8');
        data = JSON.parse(dataString);
        if (data.ensureInstalled) {
          data.levels = data.ensureInstalled;
          delete data.ensureInstalled;
        }
        if (!data.colors) {
          data.colors = defaultJSON.colors;
        }
        if (!data.replaceText) {
          data.replaceText = defaultJSON.replaceText;
        }
        if (!data.packs) {
          data.packs = [defaultJSON.packs[0]];
        }
        data.packs.forEach((d,i) => {
          d.isOpen = i === 0;
          d.levelIDs = (<string[]>d.levelIDs)
            .map(l => {
              let index = songKeys.indexOf(l);
              if (index > -1) {
                return this.songs[index];
              } else {
                return null;
              }
            })
            .filter(l => l);
        });
      } catch (e) {
        console.log(e);
        this.statusService.showStatus('Error Loading JSON file; __json.json', true);
      }
    } else {
      this.appService.fs.writeFileSync(
        this.appService.path.join(this.appService.appData, '__json.json'),
        JSON.stringify(data)
      );
    }
    return data;
  }
  getMySongs() {
    let songsDirectory = this.appService.path.join(this.appService.appData, 'bsaber');
    let songs = [];
    return this.appService.mkdir(songsDirectory).then(
      () =>
        new Promise(resolve => {
          this.appService.fs.readdir(songsDirectory, (err, data) => {
            if (err) {
              this.statusService.showStatus(
                'Error reading songs directory: ' +
                songsDirectory +
                ', Error:' +
                err
              );
              resolve();
            } else {
              Promise.all(
                data
                  .filter(d => d !== '.DS_Store')
                  .map(async folder => {
                    await this.getSong(folder, songs);
                  })
              ).then(() => {
                this.songs = songs;
                resolve();
              });
            }
          });
        })
    );
  }
  migrateSong(fullpath, files, rootpath) {
    if (files.length) {
      let _files = this.appService.fs.readdirSync(this.appService.path.join(fullpath, files[0]));
      if (!~_files.indexOf('info.dat') && !~_files.indexOf('info.json')) {
        return this.migrateSong(
          this.appService.path.join(fullpath, files[0]),
          _files.filter(
            f =>
              this.appService.fs
                .lstatSync(this.appService.path.join(fullpath, files[0], f))
                .isDirectory() &&
              f !== '.DS_Store' &&
              f !== 'autosaves'
          ),
          rootpath
        );
      } else {
        _files.forEach(f => {
          this.appService.fs.renameSync(
            this.appService.path.join(fullpath, files[0], f),
            this.appService.path.join(rootpath, f)
          );
        });
        return this.appService.fs.readdirSync(rootpath);
      }
    } else {
      return false;
    }
  }
  convertSong(dir) {
    return new Promise(resolve => {
      const ls = this.appService.spawn(this.converterBinaryPath, [
        this.appService.path.join(dir, 'info.json'),
      ]);
      ls.on('close', code => {
        resolve();
      });
    });
  }
  getSong(folderName, songs) {
    let fullpath = this.appService.path.join(this.appService.appData, 'bsaber', folderName);
    return new Promise(resolve => {
      this.appService.fs.readdir(fullpath, async (err, files) => {
        if (err) {
          this.statusService.showStatus(
            'Error reading songs directory: ' +
            fullpath +
            ', Error:' +
            err
          );
          return resolve();
        } else {
          let directories = files.filter(
            f =>
              this.appService.fs
                .lstatSync(this.appService.path.join(fullpath, f))
                .isDirectory() &&
              f !== '.DS_Store' &&
              f !== 'autosaves'
          );
          if (!~files.indexOf('info.dat')) {
            files =
              this.migrateSong(fullpath, directories, fullpath) ||
              files;
          }
          if (~files.indexOf('info.json')) {
            await this.convertSong(fullpath);
          }
          if (!~files.indexOf('info.dat')) {
            this.statusService.showStatus(
              'Error, song has no info.dat: ' + fullpath
            );
            return resolve();
          }
          // if (
          //     !~files.indexOf('cover.jpg') &&
          //     !~files.indexOf('cover.png')
          // ) {
          //     fs.copyFileSync(
          //         path.join(__dirname, 'default-cover.jpg'),
          //         path.join(fullpath, 'cover.jpg')
          //     );
          // }
          try {
            let songData = JSON.parse(
              this.appService.fs.readFileSync(
                this.appService.path.join(fullpath, 'info.dat'),
                'utf8'
              )
            );
            let covername = songData._coverImageFilename;

            let song:SongItem = {
              id: folderName,
              name: directories.length
                ? directories[0]
                : songData._songName +
                ' - ' +
                songData._songAuthorName,
              path: fullpath,
              cover: 'file://' +
              this.appService.path.join(fullpath, covername).replace(/\\/g, '/'),
              created:this.appService.fs
                .statSync(this.appService.path.join(fullpath, covername))
                .mtime.getTime()
            };
            song.name = song.name.replace(/\(.+?\)/g, '');
            song.name = song.name.replace(/[^a-z0-9 -]+/gi, '');
            songs.push(song);
            resolve();
          } catch (e) {
            return this.statusService.showStatus(
              'Error, cant parse info.dat file: ' + fullpath
            );
          }
        }
      });
    });
  }
  orderSongs(type) {
    this.orderType = type;
  }
}
