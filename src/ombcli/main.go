package main

// Use go generate to pack the qrc resources into the binary.
//go:generate genqrc qml

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"

	"github.com/NSkelsey/ahimsarest"
	"github.com/btcsuite/btcrpcclient"
	"gopkg.in/qml.v1"
)

var cfg *config

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
		Host:                cfg.RPCConnect,
		User:                cfg.Username,
		Pass:                cfg.Password,
		Certificates:        certs,
		Endpoint:            "ws",
		DisableConnectOnNew: true,
	}

	rpcConn, err := btcrpcclient.New(rpcCfg, nil)
	if err != nil {
		log.Print(err)
		return nil, nil
	}

	// Make a few attempts at connecting to the websocket.
	tries := 15
	err = rpcConn.Connect(tries)
	if err != nil {
		log.Printf("Failed to connect after %d with err: %s\n", tries, err)
		return nil, nil
	}

	return rpcConn, rpcCfg
}

func run() error {
	var err error
	cfg, _, err = loadConfig()
	if err != nil {
		log.Fatal(err)
	}

	// TODO handle case when rpcConn is nil
	walletConn, rpcCfg := setupRpcConn(cfg)

	settingCtrl, err := NewSettingCtrl(guiHomeDir, walletConn)
	if err != nil {
		log.Fatal(err)
	}

	appCtrl := &AppController{
		webcli: ahimsarest.NewClient(cfg.WebAppURL),
	}

	// Initialize the wallet controller
	walletCtrl, err := NewWalletCtrl(walletConn, appCtrl)
	if err != nil {
		log.Fatal(err)
	}

	appCtrl.SetWallet(walletCtrl)
	appCtrl.SetSetting(settingCtrl)

	// Register types and use closure to bring in application variables
	qml.RegisterTypes("OmbExtensions", 1, 0, []qml.TypeSpec{
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
			Init: func(v *AppFactory, obj qml.Object) {
				v.init(appCtrl)
			},
		},
		{
			Init: func(v *AppController, obj qml.Object) {
			},
		},
	})

	engine := qml.NewEngine()

	engine.On("quit", func() { os.Exit(0) })

	//component, err := engine.LoadFile("qrc:///qml/MainWindow.qml")
	component, err := engine.LoadFile("qml/MainWindow.qml")
	if err != nil {
		return err
	}

	context := engine.Context()
	context.SetVar("myAddress", settingCtrl.settings.Address)

	window := component.CreateWindow(nil)

	go walletCtrl.Listen(window)

	window.Show()
	walletCtrl.Update()

	window.Wait()
	return nil
}

type WalletBulletin struct {
	Txid  string
	Depth int
}
