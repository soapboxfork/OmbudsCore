package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"

	"github.com/btcsuite/btcd/btcjson"
	"github.com/btcsuite/btcrpcclient"
	"github.com/microcosm-cc/bluemonday"
	"github.com/russross/blackfriday"
	"github.com/soapboxsys/ombudslib/rpcexten"
	"gopkg.in/qml.v1"
)

// The id handed to the rpcwallet
const id string = "Ombudscore"

// A markdown window for the send window
type MarkdownText struct {
	//	Raw string
}

// Interprets the markdown and then aggressively scrubs the provided raw text
func (m *MarkdownText) GetHtml(raw string) string {
	unsafe := blackfriday.MarkdownCommon([]byte(raw))
	html := bluemonday.UGCPolicy().SanitizeBytes(unsafe)
	return string(html)
}

type BulletinReq struct {
	rpcCfg  *btcrpcclient.ConnConfig
	setCtrl *SettingCtrl
}

// Updates the internal state of the application while sending the bulletin.
// The function first authenticates to the wallet and then it will try to send bulletins.
func (r *BulletinReq) Send(passphrase, board, msg string) (bool, string) {

	// Create a five second window to send the bulletin
	timeout := int64(5)
	unlockCmd, err := btcjson.NewWalletPassphraseCmd(id, passphrase, timeout)
	if err != nil {
		return false, err.Error()
	}
	_, err = sendCommand(r.rpcCfg, unlockCmd)
	if err != nil {
		return false, err.Error()
	}

	addr := r.setCtrl.settings.Address
	cmd := rpcexten.NewSendBulletinCmd(id, addr, board, msg)

	res, err := sendCommand(r.rpcCfg, cmd)

	// TODO store results of send in settings
	if err != nil {
		log.Println(err)
		return false, err.Error()
	} else {
		txid := res.(string)
		log.Printf("rpcwallet reported success: %s\n", txid)
		return true, txid
	}
}

// Handles the passphrase creation process for a given wallet
type WalletPassphrase struct {
	Secret  string
	rpcConn *btcrpcclient.Client
	setCtrl *SettingCtrl
}

// Creates a wallet and returns the address that all bulletins will come from.
// If wallet creation fails for any reason the function will return an empty
// string.
func (w *WalletPassphrase) CreateWallet() string {
	if !w.setCtrl.settings.HasWallet {
		err := w.rpcConn.CreateEncryptedWallet(w.Secret)
		if err != nil {
			fmt.Println(err)
			return ""
		}
		addr, err := w.rpcConn.GetAccountAddress("")
		if err != nil {
			fmt.Println(err)
			return ""
		}

		w.setCtrl.settings.HasWallet = true
		w.setCtrl.settings.Address = addr.EncodeAddress()
		// Stores the address used to create bulletins to disk
		w.setCtrl.Commit()

		return addr.EncodeAddress()
	}

	return ""
}

// Reports to the gui whether or not the application has been configured with a
// wallet and an address yet.
func (w *WalletPassphrase) HasWallet() bool {
	return w.setCtrl.settings.HasWallet
}

func main() {
	if err := qml.Run(run); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, _, err := loadConfig()
	if err != nil {
		log.Fatal(err)
	}

	certs, err := ioutil.ReadFile(cfg.CAFile)
	if err != nil {
		log.Fatal(err)
	}

	rpccfg := &btcrpcclient.ConnConfig{
		Host:         cfg.RPCConnect,
		User:         cfg.Username,
		Pass:         cfg.Password,
		Certificates: certs,
		Endpoint:     "ws",
	}

	fmt.Println(cfg.CAFile)
	rpcConn, err := btcrpcclient.New(rpccfg, nil)
	if err != nil {
		log.Fatal(err)
	}
	err = rpcConn.Ping()
	if err != nil {
		log.Fatal(err)
	}

	settingCtrl, err := NewSettingCtrl("settings.json")
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
				v.rpcCfg = rpccfg
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
