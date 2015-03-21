package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

	"github.com/btcsuite/btcrpcclient"
	"gopkg.in/qml.v1"
)

func main() {
	if err := qml.Run(run); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}

func setupRpcConn(cfg *config) (*btcrpcclient.Client, *btcrpcclient.ConnConfig) {

	certs, err := ioutil.ReadFile(cfg.CAFile)
	if err != nil {
		log.Print(err)
		return nil, nil
	}

	rpcCfg := &btcrpcclient.ConnConfig{
		Host:         cfg.RPCConnect,
		User:         cfg.Username,
		Pass:         cfg.Password,
		Certificates: certs,
		Endpoint:     "ws",
	}

	fmt.Println(cfg.CAFile)
	rpcConn, err := btcrpcclient.New(rpcCfg, nil)
	if err != nil {
		log.Print(err)
		return nil, nil
	}
	err = rpcConn.Ping()
	if err != nil {
		log.Print(err)
		return nil, nil
	}

	return rpcConn, rpcCfg
}

func run() error {
	cfg, _, err := loadConfig()
	if err != nil {
		log.Fatal(err)
	}

	// TODO handle case when rpcConn is nil
	rpcConn, rpcCfg := setupRpcConn(cfg)

	settingpath := filepath.Join(guiHomeDir, "settings.json")
	settingCtrl, err := NewSettingCtrl(settingpath)
	if err != nil {
		log.Fatal(err)
	}

	// Register types and use closure to bring in application variables
	qml.RegisterTypes("OmbExtensions", 1, 0, []qml.TypeSpec{
		{
			Init: func(v *WalletPassphrase, obj qml.Object) {
				v.rpcConn = rpcConn
				v.setCtrl = settingCtrl
			},
		},
		{
			Init: func(v *MarkdownText, obj qml.Object) {
			},
		},
		{
			Init: func(v *BulletinReq, obj qml.Object) {
				v.rpcCfg = rpcCfg
				v.setCtrl = settingCtrl
			},
		},
		{
			Init: func(v *AppSettings, obj qml.Object) {
				v.gui = settingCtrl
			},
		},
		{
			Init: func(v *QmlWalletData, obj qml.Object) {
			},
		},
	})

	engine := qml.NewEngine()

	engine.On("quit", func() { os.Exit(0) })

	component, err := engine.LoadFile("qml/MainWindow.qml")
	if err != nil {
		return err
	}

	context := engine.Context()
	context.SetVar("myAddress", settingCtrl.settings.Address)

	window := component.CreateWindow(nil)

	// Pass in wallet data to MainWindow.qml
	window.Call("updateWallet", NewQmlWalletData())

	window.Show()
	window.Wait()
	return nil
}

type WalletBulletin struct {
	Txid  string
	Depth int
}
