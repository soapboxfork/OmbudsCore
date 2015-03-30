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

func setupRpcConn(cfg *config) (*btcrpcclient.Client, *btcrpcclient.ConnConfig, error) {

	certs, err := ioutil.ReadFile(cfg.CAFile)
	if err != nil {
		return nil, nil, err
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
		return nil, nil, err
	}

	// Make a few attempts at connecting to the websocket.
	tries := 15
	err = rpcConn.Connect(tries)
	if err != nil {
		return nil, nil, err
	}

	return rpcConn, rpcCfg, nil
}

func run() error {
	var err error
	cfg, _, err = loadConfig()
	if err != nil {
		log.Fatal(err)
	}

	walletConn, rpcCfg, err := setupRpcConn(cfg)
	if err != nil {
		log.Fatal(err)
	}

	// Initialize the settings controller
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
	walletCtrl.Message(WalletMessage{MInfo, "Everything started up ok!"})

	window.Wait()
	return nil
}

type WalletBulletin struct {
	Txid  string
	Depth int
}
