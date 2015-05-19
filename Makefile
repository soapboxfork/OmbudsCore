
APPNAME=OmbudsCore
APP=$(APPNAME).app
BINPATH=build/$(APP)/Contents/MacOS
RESPATH=build/$(APP)/Contents/Resources

pkg: 
	mkdir -p $(BINPATH)
	mkdir -p $(RESPATH)

$(PKG): pkg
	echo $(PKG)

	
external: $(PKG)
	cp $(GOPATH)/bin/ombfullnode $(BINPATH)
	cp $(GOPATH)/bin/ombwallet $(BINPATH)

	# bring in the qml binary
	cp $(GOPATH)/bin/ombcli $(BINPATH)

	# bring in ombwebapp dependencies
	cp $(GOPATH)/bin/ombwebapp $(BINPATH)
	cp -r $(GOPATH)/src/github.com/NSkelsey/ahimsarest/webapp $(RESPATH)/

internal: $(PKG)
	#cp src/launcher.py $(BINPATH)/$(APPNAME)
	cp src/launcher.py $(BINPATH)/launcher

	# move elements into app
	cp build/OSX_Extras/Info.plist build/$(APP)/Contents
	cp build/OSX_EXtras/PkgInfo build/$(APP)/Contents
	cp build/OSX_Extras/res/* $(RESPATH)
	cp build/OSX_Extras/OmbudsCore $(BINPATH)

clean:
	rm -rf build/$(APP)

compile: $(PKG)
	go build -o $(BINPATH)/ombfullnode github.com/soapboxsys/ombfullnode 
	go build -o $(BINPATH)/ombwallet github.com/soapboxsys/ombwallet 
	go build -o $(BINPATH)/ombwebapp github.com/NSkelsey/ahimsarest/ombwebapp
	go build -o $(BINPATH)/ombcli github.com/soapboxsys/OmbudsCore/src/ombcli
	mkdir -p $(RESPATH)/webapp
	cp -r $(GOPATH)/src/github.com/NSkelsey/ahimsarest/webapp $(RESPATH)/webapp

install: $(PKG)
	go get -u -v -o $(BINPATH)/ombfullnode github.com/soapboxsys/ombfullnode
	go get -u -v -o $(BINPATH)/ombwallet github.com/soapboxsys/ombwallet
	go get -u -v -o $(BINPATH)/ombwebapp github.com/NSkelsey/ahimsarest/ombwebapp
	go get -u -v -o $(BINPATH)/ombcli github.com/soapboxsys/OmbudsCore/src/ombcli

all: clean compile pkg internal 

.PHONY: pkg external internal clean all
