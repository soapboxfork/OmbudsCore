package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/btcsuite/btcutil"
)

// This functions as the type from which go exposes information to the qml layer
// for rendering.
type AppController struct {
	gui    *SettingCtrl
	wallet *WalletCtrl
}

func (app *AppController) init(gui *SettingCtrl, wallet *WalletCtrl) {
	app.gui = gui
	app.wallet = wallet
}

func (app *AppController) Address() string {
	return app.gui.settings.Address
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
