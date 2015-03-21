package main

import (
	"encoding/json"
	"io/ioutil"
	"os"
)

type SettingCtrl struct {
	settings settings
	filepath string
}

type settings struct {
	Address   string `json:"address"`
	HasWallet bool   `json:"hasWallet"`
}

func (h *SettingCtrl) Commit() error {
	return writefile(h.filepath, h.settings)
}

func NewSettingCtrl(fpath string) (*SettingCtrl, error) {
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

func (a *AppSettings) HasWallet() bool {
	return a.gui.settings.HasWallet
}

type AppSettings struct {
	gui *SettingCtrl
}
