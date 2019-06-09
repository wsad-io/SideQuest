# SideQuest

Credit to http://reddit.com/u/NoBullet for the name!

[Latest Download](https://github.com/the-expanse/SideQuest/releases)

## Discord

[Join us on Discord](https://discord.gg/Q2a5BkZ)

## Video Tutorial

[![video Tutorial](https://img.youtube.com/vi/HspVa4i9rPg/0.jpg)](https://www.youtube.com/watch?v=HspVa4i9rPg)

![Image](https://i.imgur.com/qXeQPpi.png)

SideQuest is designed to simplify sideloading apps onto your standalone android based headset. It should include everything you need to get started. When you first open the app it is best to open the setup screen and follow the instructions on screen to get setup.

It is important to follow the instructions in the setup screen before you start - particularily installing the OpenStore Launcher app to be able to find the apps on your device once they are installed.

## SideQuest Features

-   Automatic download of ADB platform-tools for your platform - win/mac/linux.
-   Setup instructions for enabling developer mode on your device.
-   On device launcher app to be able to open the apps once installed.
-   Drag and drop support for installing arbitrary apps.
-   Repository seeding via sources.txt file to preload your own repos for distribution.
-   Add custom fdroid based repositories to get more apps.

## Setup

When you first launch SideQuest it will download the repositories and also download the ADB tools. Once this is done you should go to the Setup menu option and follow through the one time setup to get your device ready to install apps.

If you have any problems you can hit the debugger icon to capture any errors - these will really help to find and fix bugs.

![Image](https://i.imgur.com/mHiKK7l.png)

## Apps

I will be adding more apps to the repos and I will be notifying of repo updates on my [discord server](https://discord.gg/Q2a5BkZ) - you can then manually update the repos in the repos section to get the new app listings.

## Browser Extensions

[@ATechAdventurer](https://github.com/ATechAdventurer) was kind enough to make some browser extensions:

My SideQuest Chrome and Firefox extensions as of v0.1.0 support Bsaber.com and Beatsaver.com.

Chrome-> https://chrome.google.com/webstore/detail/fmifajifkgfamekjpeanjmjjiimfhbjl/

Firefox-> https://addons.mozilla.org/en-US/firefox/addon/sidequest-bsaber-extension/

## Important

Check your antivirus hasn't blocked some parts of the ADB download - this has happened for some with Avast antivirus in particular. Also some users reported issues with k9 web filter, if you use this then you might need to unblock `http://keepsummersafe.x10host.com/` and `http://showmewhatyougot.x10host.com/` - these are the default repo urls, then only have json index files on them and are totally safe.

## More Info:

[Oculus Go ADB Driver](https://developer.oculus.com/downloads/package/oculus-go-adb-drivers/)

[Device Setup - Oculus Go - Developer Mode](https://developer.oculus.com/documentation/mobilesdk/latest/concepts/mobile-device-setup-go/)

[OculusQuest subreddit](https://www.reddit.com/r/OculusQuest/)

[OculusGo subreddit](https://www.reddit.com/r/OculusGo)

[Oculus TV subreddit](https://www.reddit.com/r/oculustv/)

[Guide: Launching Android apps in vrshell.desktop instead of Oculus TV](https://www.reddit.com/r/OculusGo/comments/ba6ul9/guide_launching_android_apps_in_vrshelldesktop/)

[Android Subreddit Curated Apps](https://www.reddit.com/r/android/wiki/apps)

[Games that can now be played with Oculus TV as of 1.1.17](https://www.reddit.com/comments/9uney8)

[Oculus TV media app compatibility list](https://www.reddit.com/comments/9x07yj)

## Credits

This program uses code not created by the SideQuest Team these include:

-   [Songe Converter](https://github.com/lolPants/songe-converter) By [@lolPants](https://github.com/lolPants) Licenses can be found [here](https://github.com/the-expanse/SideQuest/blob/master/licenses/songe-converter-license)
-   [QuestSaberPatch](https://github.com/trishume/QuestSaberPatch) By [@trishume](https://github.com/trishume) Licenses can be found [here](https://github.com/the-expanse/SideQuest/blob/master/licenses/QuestSaberPatch-license)
