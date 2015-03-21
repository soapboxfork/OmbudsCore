
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

internal: $(PKG)
	cp src/launcher.py $(BINPATH)/$(APPNAME)

clean:
	rm -rf build/$(APP)

install:
	go get -u -v github.com/soapboxsys/ombfullnode/...
	go get -u -v github.com/soapboxsys/ombwallet/...
	go get -u -v github.com/NSkelsey/ahimsarest/...

all: pkg internal external

.PHONY: pkg external internal clean all
