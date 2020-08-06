
## finds all your uncategorized torent in qbittorrent and adds them to a set category

## install
install node.js
run `npm install`

## config
inside the `index.js` file, you need to set your qbittorrent url, username, and password. 
These are all set to the defaults values when installing qbittorrent.
Under that, is a bunch of category names with a list of partial urls they correspond to

example:
`hdtorrents: ["hd-torrents", "hdts-announce"],`

This means that for any torrent that has a tracker matching `hd-torrents` or `hdts-announce`, it will be given a category of `hdtorrents`
You dont need to enter the entire tracker url (to avoid entering passkeys) only a partial match.
Note, you don't need to create all the categories used in the settings, but if a torrent is set to a category (for example `hdtorrents`), that category needs to alread yexist in qbittorrent. 
This script doesnt create categories, it only sets ones that already exist.

## run
once you've double checked the client credentials and tracker settings, run `npm start`