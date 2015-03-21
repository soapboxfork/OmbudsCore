# OmbudsCore
This is a desktop client that provides a frontend to create and read bulletins that are stored in Bitcoin's blockchain. 
At the moment, Bitcoin's testnet is used by default. An overview of how the various pieces interact is explained in the image below.

![Imgur](http://i.imgur.com/p9NIa7R.jpg)

Components
============
There are several components of this project that need individual explanation. They are ombcli, ombfullnode, ombwallet, ahimsarest, and launcher.py. 
These are all subcomponents of what makes up OmbudsCore.

### ombudscli
[ombcli](https://github.com/soapboxsys/OmbudsCore/tree/master/src/ombcli)
is a qml fronted that lets a user read and publish bulletins. 
It is the GUI that sits on top of several pieces of software that handle the heavy lifting.

### ombfullnode
[ombfullnode]() is a modified version of Conformal's full node [btcd](http://github.com/btcsuite/btcd). 
It also creates a sqlite database (referred to as the pubrecord.db above) that seperately stores every bulletin it finds in the blockchain or it sees on the network.

### ombwallet
[ombwallet]() is a forked version of Conformal's wallet software [btcwallet](http://github.com/btcsuite/btcwallet).
The forked wallet has extra rpc commands that exposes bulletin creation and transmission in a simple format. 
The GUI of OmbudsCore uses these rpc commands to send bulletins into the Bitcoin network.
The sendbulletin rpc command can also be used from the command line using ombctl.

### ahimsarest
[ahimsarest](http://github.com/NSkelsey/ahimsarest) 
is a web frontend for the bulletins stored in the pubrecord.db. 
It exposes topics, authors and bulletins via a json api and in an angular web application.
The GUI of OmbudsCore uses as a built in browser for easy access.
It can also be used as a standalone website.

### launcher.py
[launcher.py](https://github.com/soapboxsys/OmbudsCore/blob/master/src/launcher.py) 
is a python script that launches all of these processes at once. 
When the project is build using make, the first process that really gets launched is launcher.py.
It is responsible for cleanly starting all and stopping of the necessary processes that were described above.
In essence it is the entry point for the whole application.
