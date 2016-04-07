# delockyfier for Google Drive

Simple webapp which scans for files called .locky and restores the previous good version and also patches the renamed metadata.
Uses https://github.com/pinoyyid/ngDrive for the heavy lifting.

A working version of this app is available at https://delockyfier.appspot.com and I expect the majority of lockyfied users will be able to do all they need by simply visiting that url. This hosted copy is subject to Google's billing restrictions, so will fail if it becomes too popular. You would then look into a local installation with your own credentials.

## Timing is critical!
This app works by deleting the most recent, ie. encrypted, revision, thus making the prior revision the current one. This will only work if there is a prior revision available. Google Drive will automatically delete prior revisions without warning, sometimes as quickly as 30 days after modification. Therefore, if you intend to delockyfy your Google Drive, I recommend you do it within 30 days of the infection.

## Local installation
If you want to do your own installation. The steps are roughly:-
* register a new project on the Google dev console, and note the client ID. You'll need to configure the JavaScript origin to match wherever you'll be serving the app from.
* git clone
* bower install
* typings install # Optional
* create a config.js file with __your__ registered client ID, thus:-
```
window.ngdrive_clientid = '29232968-MYCLIENTID.apps.googleusercontent.com';
```

## Disclaimer
This app is provided under an MIT license. There is no warranty whatsoever and the authors accept no liability for any damage, direct or consequential, caused by the use of this app.
