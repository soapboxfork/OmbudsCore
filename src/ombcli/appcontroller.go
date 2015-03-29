package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/NSkelsey/ahimsarest"
	"github.com/btcsuite/btcutil"
)

// A type to expose the AppController in qml
type AppFactory struct {
	app *AppController
}

func (a *AppFactory) init(app *AppController) {
	a.app = app
}

func (a AppFactory) Ctrl() *AppController {
	return a.app
}

// This functions as the type from which go exposes information to the qml layer
// for rendering.
type AppController struct {
	gui    *SettingCtrl
	wallet *WalletCtrl
	webcli *ahimsarest.Client
}

func (app *AppController) SetWallet(w *WalletCtrl) {
	app.wallet = w
}

func (app *AppController) SetSetting(s *SettingCtrl) {
	app.gui = s
}

func (app *AppController) Address() btcutil.Address {
	addrstr := app.gui.settings.Address
	addr, err := btcutil.DecodeAddress(addrstr, activeNet.Params)
	if err != nil {
		log.Println(err)
	}
	return addr
}

func (app *AppController) AddressStr() string {
	return app.Address().String()
}

// AddressQrPath returns the path to the qrcode created for the user's address.
// If no image file exists address qr path creates one.
func (app *AppController) AddressQrPath() string {
	qrpath := filepath.Join(app.gui.dirPath, qrFileName)

	if _, err := os.Stat(qrpath); os.IsNotExist(err) {
		// Generate the addresses qr code
		addr, err := btcutil.DecodeAddress(app.gui.settings.Address, activeNet.Params)
		if err != nil {
			log.Printf("New Qr failed with: %s\n", err)
			return qrpath
		}

		qrcode, err := createQrCode(addr)
		if err != nil {
			log.Printf("New Qr failed with: %s\n", err)
			return qrpath
		}
		err = storeQrCode(qrcode, app.gui.dirPath)
		if err != nil {
			log.Printf("New Qr failed with: %s\n", err)
		}
	}

	return qrpath
}
