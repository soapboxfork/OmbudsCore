package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"code.google.com/p/rsc/qr"
	"github.com/btcsuite/btcrpcclient"
	"github.com/btcsuite/btcutil"
)

var qrFileName = "qrcode.png"

type SettingCtrl struct {
	settings settings
	file     string
	dirPath  string
}

type settings struct {
	Address string `json:"address"`
}

func (h *SettingCtrl) Commit() error {
	return writefile(h.file, h.settings)
}

func NewSettingCtrl(dirpath string, walletConn *btcrpcclient.Client) (*SettingCtrl, error) {
	fpath := filepath.Join(dirpath, "settings.json")
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
		file:     fpath,
		dirPath:  dirpath,
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
		// Generate the addresses qr code
		qrcode, err := createQrCode(addr)
		if err != nil {
			return nil, err
		}
		err = storeQrCode(qrcode, dirpath)
		if err != nil {
			return nil, err
		}

		if err != h.Commit() {
			return nil, err
		}
	}

	return h, nil
}

func storeQrCode(qrcode []byte, dirpath string) error {
	path := filepath.Join(dirpath, qrFileName)
	err := ioutil.WriteFile(path, qrcode, 0600)

	if err != nil {
		return err
	}

	return nil
}

func createQrCode(addr btcutil.Address) ([]byte, error) {
	code, err := qr.Encode(addr.String(), qr.M)
	if err != nil {
		return []byte{}, err
	}
	return code.PNG(), nil
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
