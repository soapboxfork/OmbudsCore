
APPNAME=OmbudsCore
APP=$(APPNAME).app
BINPATH=build/$(APP)/Contents/MacOS
RESPATH=build/$(APP)/Contents/Resources

pkg: 
	mkdir -p $(BINPATH)
	mkdir -p $(RESPATH)

$(PKG): pkg
	echo $(PKG)

	
# TODO fix release building toolchain.
external: $(pkg)
	cp $(GOPATH)/bin/ombfullnode $(BINPATH)
	cp $(GOPATH)/bin/ombwallet $(BINPATH)

	# bring in the qml binary
	cp $(GOPATH)/bin/ombcli $(BINPATH)

	# bring in ombwebapp dependencies
	cp $(GOPATH)/bin/ombwebapp $(BINPATH)
	cp -r $(GOPATH)/src/github.com/NSkelsey/ahimsarest/webapp $(RESPATH)/

internal: $(PKG)
	cp src/launcher.py $(BINPATH)/$(APPNAME)

	# move elements into app
	cp build/OSX_Extras/Info.plist build/$(APP)/Contents
	cp build/OSX_EXtras/PkgInfo build/$(APP)/Contents
	cp build/OSX_Extras/res/* $(RESPATH)

clean:
	rm -rf build/$(APP)

install:
	go get -u -v github.com/soapboxsys/ombfullnode/...
	go get -u -v github.com/soapboxsys/ombwallet/...
	go get -u -v github.com/NSkelsey/ahimsarest/ombwebapp
	go get -u -v github.com/soapboxsys/OmbudsCore/src/ombcli/...

all: clean pkg internal external

.PHONY: pkg external internal clean all
