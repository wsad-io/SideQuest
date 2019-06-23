import { ApplicationRef, Injectable } from '@angular/core';
import { AppService } from './app.service';
import { LoadingSpinnerService } from './loading-spinner.service';
import { RepoBody, RepoItem } from './repo-item/repo-item.component';

@Injectable({
    providedIn: 'root',
})
export class RepoService {
    repos: RepoItem[] = [];
    currentRepo: RepoItem;
    allApps: any = {};
    indexUrl: string = 'https://the-expanse.github.io/SideQuestRepos/';
    constructor(private appService: AppService, private spinnerService: LoadingSpinnerService, private appRef: ApplicationRef) {
        this.getAppIndex();
        this.appService.seedSources();
        this.getRepos();
    }
    getAppIndex() {
        this.appService.request(this.indexUrl);
        return new Promise((resolve, reject) => {
            this.appService.request(this.indexUrl + 'app-index.json', (error, response, body) => {
                if (error) {
                    return reject(error);
                } else {
                    try {
                        let body = JSON.parse(response.body);
                        Object.keys(body).forEach(packageName => {
                            this.allApps[packageName] = body[packageName];
                            this.allApps[packageName].icon = this.indexUrl + this.allApps[packageName].icon;
                        });
                        resolve();
                    } catch (e) {
                        return reject('JSON parse Error');
                    }
                }
            });
        });
    }
    setCurrent(index: number) {
        if (this.repos.length && this.repos[index]) {
            this.currentRepo = this.repos[index];
            return this.currentRepo;
        } else {
            return { name: '', body: { apps: [] } };
        }
    }
    getRepos() {
        this.appService.fs.readFile(this.appService.appData + '/sources.txt', 'utf8', (err, data) => {
            if (!err) {
                this.repos.length = 0;
                this.spinnerService.showLoader();
                Promise.all(
                    data
                        .split('\n')
                        .filter(d => d)
                        .map((url, i) => this.addRepo(url, i))
                )
                    .then(() => this.repos.sort((a, b) => a.order - b.order))
                    .then(() => setTimeout(() => this.appRef.tick()))
                    .then(() => {
                        this.repos
                            .reduce((a, repo) => {
                                a = a.concat(
                                    repo.body.apps.map(app => {
                                        app.__package = repo.body.packages[app.packageName];
                                        return app;
                                    })
                                );
                                return a;
                            }, [])
                            .forEach(app => {
                                this.allApps[app.packageName] = { name: app.name, icon: app.icon };
                            });
                    });
            }
        });
    }
    saveRepos() {
        this.appService.fs.writeFile(this.appService.appData + '/sources.txt', this.repos.map(d => d.url).join('\n'), err => {
            if (err) alert('Failed to write sources.txt:' + err);
        });
    }
    deleteRepo(index) {
        const cachePath = this.appService.path.join(
            this.appService.appData,
            'sources',
            this.appService.md5(this.repos[index].url) + '.json'
        );
        if (this.appService.fs.existsSync(cachePath)) {
            this.appService.fs.unlinkSync(cachePath);
        }
        this.repos.splice(index, 1);
    }
    addRepo(url: string, i?: number) {
        this.spinnerService.setMessage(`Loading ${url}`);
        url = url.trim();
        if (url[url.length - 1] !== '/') {
            url += '/';
        }

        let index = i || this.repos.length;
        return new Promise(async (resolve, reject) => {
            if (~this.repos.map(d => d.url).indexOf(url)) {
                reject('Repo already added!');
            }
            const jsonUrl = url + 'index-v1.json';
            this.appService.request(jsonUrl, (error, response, body) => {
                if (error) {
                    return reject(error);
                } else {
                    try {
                        let repo_body: RepoBody = JSON.parse(body);
                        console.log(repo_body);
                        if (!this.isValidRepo(repo_body)) {
                            reject('Repo not valid or unsupported version!');
                        } else {
                            resolve(repo_body);
                        }
                    } catch (e) {
                        return reject('JSON parse Error');
                    }
                }
            });
        }).then((repo: RepoBody) => {
            this.repos.push({
                name: repo.repo.name,
                icon: repo.repo.icon,
                url: url,
                order: index,
                body: repo,
                categories: repo.apps
                    .reduce((a, b) => {
                        b.icon = url + 'icons/' + b.icon;
                        return a.concat(b.categories);
                    }, [])
                    .filter((v, i, self) => self.indexOf(v) === i),
            });
        });
    }
    isValidRepo(repo: RepoBody) {
        if (!repo) return false;
        if (!repo.repo) return false;
        if (!repo.repo.version || !(repo.repo.version > 17 && repo.repo.version < 24)) return false;
        return true;
    }
}
