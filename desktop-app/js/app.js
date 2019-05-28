class App{
    constructor(){
        ipcRenderer.on('info' , (event , data)=>{
            try{
                data = JSON.parse(data);
                if(data.beatsaber){
                    if(this.bsaber){
                        this.spinner_loading_message.innerText = 'Sideloading Beatsaber Song...';
                        this.toggleLoader(true);
                        this.bsaber.downloadSong(data.beatsaber)
                            .then(path=>{
                                this.bsaber.pushSongToDevice(path)
                                    .then(()=>this.toggleLoader(false))
                                    .then(()=>this.bsaber.getCurrentDeviceSongs(true));
                            })
                            .catch(e=>{
                                alert(e);
                                this.toggleLoader(false);
                            })
                    }
                }
                if(data.beatsaberRemove){
                    if(this.bsaber) {
                        this.spinner_loading_message.innerText = 'Removing Beatsaber Song...';
                        this.toggleLoader(true);
                        this.bsaber.removeSong(data.beatsaberRemove)
                            .then(()=>new Promise(r=>setTimeout(r,500)))
                            .then(() => this.toggleLoader(false))
                            .then(() => this.bsaber.getCurrentDeviceSongs(true))
                            .catch(e => {
                                alert(e);
                                this.toggleLoader(false);
                            });
                    }
                }
            }catch(e){

            }
        });
        M.AutoInit();
        fs.mkdir(appData,()=>{
            fs.mkdir(path.join(appData,'sources'),()=>{
                fs.mkdir(path.join(appData,'bsaber'),()=>{});
                if(!fs.existsSync(path.join(appData,'sources.txt'))){
                    fs.createReadStream(path.join(__dirname,'sources.txt')).pipe(fs.createWriteStream(path.join(appData,'sources.txt')));
                }
                this.current_data = [];
                this.setupMenu();
                this.repos = new Repos(this);
                this.bsaber = new Bsaber(this);
                this.setup = new Setup(this,()=>{});
                this.bsaber.downloadConverterBinary();
            });
        });
    }
    setupMenu(){
        this.spinner_drag = document.querySelector('.spinner-drag');
        this.spinner_background = document.querySelector('.spinner-background');
        this.add_repo = document.querySelector('.add-repo');
        this.add_repo_button = document.querySelector('.add-repo-button');
        this.add_repo_url = document.querySelector('#repoUrl');
        this.menu_container = document.querySelector('.menu-items');
        this.filter_select = document.querySelector('#filterDropdown');
        this.filter_select.addEventListener('change',()=>this.searchFilter());
        this.spinner_loading_message = document.querySelector('.spinner-loading-message');
        this.apkInstall = document.querySelector('.apk-install')
        this.search_box = document.querySelector('#searchBox');
        this.search_box.addEventListener('keyup',()=>this.searchFilter());
        this.browser_bar = document.getElementById('browser-bar');
        this.container = document.querySelector('#container');
        this.browser_loading = document.querySelector('.browser-loading');
        this.beatView = document.getElementById('beatView');
        this.setupInstructions = document.querySelector('#setupInstructions');
        this.appItem = document.querySelector('#appItem');
        this.template = document.querySelector('#listItem');
        this.appVersion = document.querySelector('#appVersion');
        this.packageItem = document.querySelector('#packageItem');

        this.title = document.querySelector('.header-title');
        this.searchFilterContainer = document.querySelector('#searchFilterContainer');

        this.setup_menu = document.querySelector('.setup-menu');
        this.setup_menu.addEventListener('click',()=>this.openSetupScreen());

        this.add_menu = document.querySelector('.add-menu');
        this.add_menu.addEventListener('click',()=>this.repos.openRepos());

        this.enable_wifi = document.querySelector('#enable-wifi');
        this.enable_wifi.addEventListener('click',()=>this.setup.enableWifiMode());
        document.getElementById('close-app').addEventListener('click',()=>remote.getCurrentWindow().close());
        document.getElementById('open-debugger').addEventListener('click',()=>remote.getCurrentWindow().toggleDevTools());
        document.getElementById('installed-apps').addEventListener('click',()=>this.openPackageList());
        document.querySelector('.confirm-uninstall-app').addEventListener('click',()=>{
            if(this.current_uninstall_package){
                this.setup.uninstallApk(this.current_uninstall_package)
                    .then(()=>this.openPackageList());
            }
        });
        document.querySelector('.beat-menu').addEventListener('click',()=>{
            this.openBeat();
        });
        document.addEventListener('DOMContentLoaded', function() {
            let elems = document.querySelectorAll('.modal');
            M.Modal.init(elems, {});
        });
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
            for (let f of e.dataTransfer.files) {
                this.spinner_loading_message.innerText = 'Installing APK, Please wait...';
                this.toggleLoader(true);
                this.setup.installLocalApk(f.path)
                    .then(()=>this.toggleLoader(false));
            }
            return false;
        };
        this.setupWebview();
    }
    toggleLoader(show){
        document.querySelector('.spinner').style.display =
        this.spinner_background.style.display = show ? 'block' : 'none';
    }
    openExternalLink(url){
        opn(url);
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
                content: "Install now with SideQuest";
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
        this.beatView.addEventListener('did-stop-loading', async e=>{
            webaddress.value = this.beatView.getURL();
            this.browser_loading.style.display = 'none';
            this.beatView.insertCSS(customCss);

            let isBeatSaberInstalled = await this.bsaber.isBeatSaberInstalled();
            if(isBeatSaberInstalled){
                this.beatView.executeJavaScript(customJS);
                this.bsaber.makeCustomDirectory()
                    .then(()=>this.bsaber.getCurrentDeviceSongs());
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
        this.add_repo.style.display = 'none';
        this.container.innerHTML = '';
        this.searchFilterContainer.style.display = 'none';
        this.browser_bar.style.display = 'none';
        this.title.innerHTML = app.name;
        this.beatView.style.left = '-100%';
        this.apkInstall.style.display = 'block';
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
                console.log(p.apkName.substr(0,7)==='http://'||p.apkName.substr(0,8)==='https://'?p.apkName:this.current_data.url+p.apkName);
                this.setup.installApk(p.apkName.substr(0,7)==='http://'||p.apkName.substr(0,8)==='https://'?p.apkName:this.current_data.url+p.apkName)
                    .then(()=>{
                        this.toggleLoader(false);
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
        this.container.innerHTML = '';
        this.searchFilterContainer.style.display = 'none';
        this.browser_bar.style.display = 'none';
        this.apkInstall.style.display = 'block';
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
        this.container.innerHTML = '';
        this.searchFilterContainer.style.display = 'none';
        this.title.innerHTML = "Beast Saber - Custom Songs";
        this.beatView.style.left = '0';
        this.apkInstall.style.display = 'none';
        this.browser_bar.style.display = 'block';
    }
    openSetupScreen(){
        this.add_repo.style.display = 'none';
        this.container.innerHTML = '';
        this.searchFilterContainer.style.display = 'none';
        this.title.innerHTML = "Setup Instructions";
        this.beatView.style.left = '-100%';
        this.apkInstall.style.display = 'block';
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
            this.install_launcher_container.innerHTML = 'Already Installed!';
        }else {
            this.install_launcher.addEventListener('click', () => {
                this.install_launcher.style.display = 'none';
                this.install_launcher_loader.style.display = 'inline-block';
                this.setup.installApk('https://cdn.theexpanse.app/SideQuestWrapper.apk')
                    .then(() => this.setup.installApk('https://cdn.theexpanse.app/SideQuestLauncher.apk'))
                    .then(() => {
                        this.install_launcher_container.innerHTML = 'Done!';
                    })
            });
        }
        this.install_expanse = document.querySelector('.install-expanse');
        this.install_expanse_loader = document.querySelector('.install-expanse-loading');
        this.install_expanse_container = document.querySelector('.install-expanse-container');
        if(~this.setup.devicePackages.indexOf('app.theexpanse.app')) {
            this.install_expanse_container.innerHTML = 'Already Installed!';
        }else{
            this.install_expanse.addEventListener('click',()=>{
                this.install_expanse.style.display = 'none';
                this.install_expanse_loader.style.display = 'inline-block';
                this.setup.installApk('https://cdn.theexpanse.app/TheExpanse.apk').then(()=>{
                    this.install_expanse_container.innerHTML = 'Done!';
                })
            });
        }
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