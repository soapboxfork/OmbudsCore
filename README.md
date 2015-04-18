# OmbudsCore
This is a desktop client that provides a frontend to create and read bulletins that are stored in Bitcoin's blockchain. 
At the moment, Bitcoin's testnet is used by default. An overview of how the various pieces interact is explained in the image below.

![Overview](http://i.imgur.com/SrMVaYN.png?1)

Components
============
There are several components of this project that need individual explanation. They are ombcli, ombfullnode, ombwallet, ahimsarest, and launcher.py. 
These are all subcomponents of what makes up OmbudsCore.

### ombcli
[ombcli](https://github.com/soapboxsys/OmbudsCore/tree/master/src/ombcli)
is a qml fronted that lets a user read and publish bulletins. 
It is the GUI that sits on top of several pieces of software that handle the heavy lifting.

### ombfullnode
[ombfullnode](https://github.com/soapboxsys/ombfullnode) is a modified version of Conformal's full node [btcd](http://github.com/btcsuite/btcd). 
It also creates a sqlite database (referred to as the pubrecord.db above) that seperately stores every bulletin it finds in the blockchain or it sees on the network.

### ombwallet
[ombwallet](https://github.com/soapboxsys/ombwallet) is a forked version of Conformal's wallet software [btcwallet](http://github.com/btcsuite/btcwallet).
The forked wallet has extra rpc commands that exposes bulletin creation and transmission in a simple format. 
The GUI of OmbudsCore uses these rpc commands to send bulletins into the Bitcoin network.
The sendbulletin rpc command can also be used from the command line using ombctl.

### ombwebapp
[ombwebapp](http://github.com/NSkelsey/ahimsarest/tree/master/ombwebapp) 
is a web frontend for the bulletins stored in the pubrecord.db. 
It exposes topics, authors and bulletins via a json api and in an angular web application.
The GUI of OmbudsCore uses this as a built in browser.
It can also be used as a standalone website.

(ahimsa is the name of our proof-of-concept, if you were wondering.)

### launcher.py
[launcher.py](https://github.com/soapboxsys/OmbudsCore/blob/master/src/launcher.py) 
is a python script that launches all of these processes at once. 
When the project is build using make, the first process that really gets launched is launcher.py.
It is responsible for cleanly starting all and stopping of the necessary processes that were described above.
It serves as the entry point for the entire application.


Build from source
====================

To build this application you need go, python, git, and patience since this is the first draft of these instructions. **Please read the instructions before you dive into this.** If you do run into problems please create issues in this repository. We will try to get to them as soon as possible.

### Mac OS X

Make sure that you have a functioning copy of [homebrew](http://brew.sh/).

##### Install the dependencies. 

Follow the [official instructions](https://golang.org/doc/install) to install go. Make sure to configure a GOPATH environment variable.

Next install the [dependencies for go-qml](https://github.com/go-qml/qml#requirements-on-mac-os-x). 
This is the hardest part.

##### Download and build the dependent binaries.

With go and git installed this should just work.

```bash
> go get -v github.com/soapboxsys/ombfullnode/...
> go get -v github.com/soapboxsys/ombwallet/...
> go get -v github.com/NSkelsey/ahimsarest/ombwebapp
```

##### Build OmbudsCore.

The go-qml bindings are required at this point. This will create the ombcli binary.

```bash
> go get -v github.com/soapboxsys/OmbudsCore/src/ombcli
```

##### Test each binary.

The binaries that you just downloaded rely on one another. 
You should test to see each one works independently before trying to launch then all at once with launcher.py.

```bash
> ombfullnode
> ombwallet
> ombwebapp
> ombcli
```

##### Check the configuration.

These binaries depend on configuration that lives in `~/Library/Application Support/Ombudscore`. There are a few files that need to be there, but launcher.py should create them for you the first time you run it. My Application data dir looks like this (the files that should be created are highlighted in gray).

<img src="http://i.imgur.com/T1k2wVN.png" alt="Ombudscore directory" width="300px">

##### Sync the node

Your ombfullnode will need to download the blockchain from its Bitcoin peers. This can a few hours. Start it with:

```bash
> ombfullnode
```

##### You made it!

Run launcher.py to run the whole system at once. Make sure to kill any other instances of subprocesses to prevent headaches.

```bash
> python /path/to/OmbudsCore/src/launcher.py
```

If you actually got this far for god sakes let us know or even read this far. Send me an email (`nskelsey@gmail.com`) or hop on freenode and visit #lalalala. We want to help.
