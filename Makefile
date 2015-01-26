
APPNAME=OmbudsCore
APP=$(APPNAME).app
BINPATH=build/$(APP)/Contents/MacOS
RESPATH=build/$(APP)/Contents/Resources

pkg: 
	mkdir -p $(BINPATH)
	mkdir -p $(RESPATH)

$(PKG): pkg
	echo $(PKG)
	
# TODO switch to btcd to NSkelsey
external: $(pkg)
	go get -v github.com/conformal/btcd/...
	go get -v github.com/NSkelsey/btcwallet/...
	cp $(GOPATH)/bin/btcd $(BINPATH)
	cp $(GOPATH)/bin/btcwallet $(BINPATH)

internal: $(PKG)
	cp src/launcher.py $(BINPATH)/$(APPNAME)

clean:
	rm -rf build/$(APP)

all: pkg internal external

.PHONY: pkg external internal clean all
