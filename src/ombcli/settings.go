package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/btcsuite/btcrpcclient"
)

type SettingCtrl struct {
	settings settings
	filepath string
}

type settings struct {
	Address string `json:"address"`
}

func (h *SettingCtrl) Commit() error {
	return writefile(h.filepath, h.settings)
}

func NewSettingCtrl(fpath string, walletConn *btcrpcclient.Client) (*SettingCtrl, error) {
	if !fileExists(fpath) {
		s := &settings{}
		err := writefile(fpath, *s)
		if err != nil {
			return nil, err
		}
	}

	g, err := readfile(fpath)
	if err != nil {
		return nil, err
	}

	h := &SettingCtrl{
		filepath: fpath,
		settings: *g,
	}

	// The wallet's sending address has not been set. Use the walletConn to fix that.
	if h.settings.Address == "" {
		// Get a new address. This will forever be the wallet's send from address.
		addr, err := walletConn.GetNewAddress()
		if err != nil {
			err = fmt.Errorf("Getting wallet address failed with: %s", err)
			return nil, err
		}
		h.settings.Address = addr.String()
		if err != h.Commit() {
			return nil, err
		}
	}

	return h, nil
}

func writefile(fpath string, g settings) error {
	f, err := os.Create(fpath)
	defer f.Close()
	if err != nil {
		return err
	}

	b, err := json.Marshal(&g)
	if err != nil {
		return err
	}

	if _, err = f.Write(b); err != nil {
		return err
	}

	return nil
}

func readfile(fpath string) (*settings, error) {

	f, err := os.Open(fpath)
	defer f.Close()
	if err != nil {
		return nil, err
	}

	b, err := ioutil.ReadAll(f)
	if err != nil {
		return nil, err
	}

	var g settings
	if err = json.Unmarshal(b, &g); err != nil {
		return nil, err
	}

	return &g, nil
}

type AppSettings struct {
	gui *SettingCtrl
}

func (app *AppSettings) Address() string {
	return app.gui.settings.Address
}
