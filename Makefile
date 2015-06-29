
APPNAME=OmbudsCore
APP=$(APPNAME).app
BINPATH=build/$(APP)/Contents/MacOS
RESPATH=build/$(APP)/Contents/Resources

OMBCOREPATH=$(GOPATH)/src/github.com/soapboxsys/OmbudsCore


pkg: 
	cp -a build/Electron.app build/$(APP)

$(PKG): pkg
	echo $(PKG)

	
external: $(PKG)
	cp $(GOPATH)/bin/ombfullnode $(BINPATH)
	cp $(GOPATH)/bin/ombwallet $(BINPATH)

	# bring in the ombappserv (which was compiled outside of the project dir)
	cp $(GOPATH)/bin/ombappserv $(BINPATH)


internal: $(PKG)
	cp src/launcher.py $(BINPATH)/launcher.py

	# move frontend files into the resource dir.
	mkdir -p $(RESPATH)/frontend
	cp -r $(OMBCOREPATH)/src/frontend $(RESPATH)/frontend

	# move the atom app into place
	mkdir -p $(RESPATH)/app
	cp $(OMBCOREPATH)/src/atom-app/main.js $(RESPATH)/app

	# move elements into app
	cp -f build/OSX_Extras/Info.plist build/$(APP)/Contents
	cp -f build/OSX_Extras/res/* $(RESPATH)

clean:
	rm -rf build/$(APP)

compile: $(PKG)
	go build -o $(BINPATH)/ombfullnode github.com/soapboxsys/ombfullnode 
	go build -o $(BINPATH)/ombwallet github.com/soapboxsys/ombwallet 
	go build -o $(BINPATH)/ombappserv github.com/soapboxsys/OmbudsCore/src/ombappserv

install: $(PKG)
	go get -u -v -o $(BINPATH)/ombfullnode github.com/soapboxsys/ombfullnode
	go get -u -v -o $(BINPATH)/ombwallet github.com/soapboxsys/ombwallet
	go get -u -v -o $(BINPATH)/ombappserv github.com/soapboxsys/OmbudsCore/src/ombappserv

all: clean pkg compile internal 

.PHONY: pkg external internal clean all
