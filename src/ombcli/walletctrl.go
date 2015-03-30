package main

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"github.com/btcsuite/btcd/btcjson"
	"github.com/btcsuite/btcd/btcjson/btcws"
	"github.com/btcsuite/btcd/wire"
	"github.com/btcsuite/btcrpcclient"
	"github.com/btcsuite/btcutil"
	"github.com/btcsuite/websocket"
	"github.com/soapboxsys/ombudslib/ombjson"
	"gopkg.in/qml.v1"
)

// Handles interaction with the rpc based wallet
type WalletCtrl struct {
	app       *AppController
	Client    *btcrpcclient.Client
	Root      qml.Object
	webSocket *websocket.Conn
	update    chan struct{}
	message   chan WalletMessage
}

func NewWalletCtrl(client *btcrpcclient.Client, app *AppController) (*WalletCtrl, error) {
	ctrl := &WalletCtrl{
		Client:  client,
		app:     app,
		update:  make(chan struct{}, 100),
		message: make(chan WalletMessage, 20),
	}

	cert, err := ioutil.ReadFile(cfg.CAFile)
	if err != nil {
		return nil, err
	}
	pool := x509.NewCertPool()
	pool.AppendCertsFromPEM(cert)

	tlsCfg := &tls.Config{
		RootCAs:    pool,
		MinVersion: tls.VersionTLS12,
	}

	dialer := websocket.Dialer{TLSClientConfig: tlsCfg}

	login := cfg.Username + ":" + cfg.Password
	auth := "Basic " + base64.StdEncoding.EncodeToString([]byte(login))
	requestHeader := make(http.Header)
	requestHeader.Add("Authorization", auth)

	url := fmt.Sprintf("wss://%s/ws", cfg.RPCConnect)
	ws, _, err := dialer.Dial(url, requestHeader)
	if err != nil {
		return nil, err
	}

	ctrl.webSocket = ws

	return ctrl, nil
}

// The qml wallet's representation of a bulletin sent from the wallet
type BltnListElem struct {
	Txid  string `json:"txid"`
	Unix  int64  `json:"unix"`
	Board string `json:"board"`
	Depth string `json:"depth"`
}

func makeBltnElem(bltn *ombjson.JsonBltn, depth uint64) *BltnListElem {
	elem := &BltnListElem{
		Txid:  bltn.Txid,
		Unix:  bltn.Timestamp,
		Board: bltn.Board,
		Depth: fmt.Sprintf("%d", depth),
	}
	return elem
}

func (ctrl *WalletCtrl) getBulletinJson() (string, string, error) {

	authorResp, err := ctrl.app.webcli.GetJsonAuthor(ctrl.app.Address())
	pendingBltns := []*BltnListElem{}
	confirmedBltns := []*BltnListElem{}

	for i := len(authorResp.Bulletins) - 1; i > 0; i-- {
		bltn := authorResp.Bulletins[i]
		if bltn.Block == "" {
			elem := makeBltnElem(bltn, 0)
			pendingBltns = append(pendingBltns, elem)
		} else {
			// We must deduce the height of the given block
			hash, _ := wire.NewShaHashFromStr(bltn.Block)
			block, err := ctrl.app.webcli.GetJsonBlockHead(hash)
			if err != nil {
				return "", "", err
			}
			h := block.Height
			elem := makeBltnElem(bltn, h)
			confirmedBltns = append(confirmedBltns, elem)
		}
	}

	pendB, err := json.Marshal(pendingBltns)
	if err != nil {
		return "", "", nil
	}

	confdB, err := json.Marshal(confirmedBltns)
	if err != nil {
		return "", "", nil
	}

	return string(pendB), string(confdB), nil
}

// fetchWalletData requests information from information from ombwallet
// and from ombwebapp about bulletins that have been sent from the wallet's
// address.
func (ctrl *WalletCtrl) fetchWalletData() (*qmlWalletData, error) {

	balance, err := ctrl.Client.GetBalance("")
	if err != nil {
		return nil, err
	}

	mbtc := balance.ToUnit(btcutil.AmountMilliBTC)

	pendingJson, confirmedJson, terr := ctrl.getBulletinJson()
	if err == nil {
		err = terr
	}

	qmlWalletData := &qmlWalletData{
		SpendableBalance:  fmt.Sprintf("%6.2f", mbtc),
		PendingListJson:   pendingJson,
		ConfirmedListJson: confirmedJson,
	}

	return qmlWalletData, err
}

// Update prompts the wallet to update itself.
func (ctrl *WalletCtrl) Update() {
	ctrl.update <- struct{}{}
}

func (ctrl *WalletCtrl) Message(msg WalletMessage) {
	ctrl.message <- msg
}

// handleNtfnMsg deals with pushed notification sent by the wallet
// about relevant events pertaining to the wallet and the gui.
func (ctrl WalletCtrl) handleNtfnMsg(req btcjson.Cmd) {

	switch cmd := req.(type) {
	case *btcws.BlockConnectedNtfn:
		log.Println("Relevant event was fired")
		ctrl.Update()
	case *btcws.BlockDisconnectedNtfn:
		// Update gui and send message something funky is up
		ctrl.Update()
		m := WalletMessage{MWarn, "A block was disconnected. That is odd."}
		ctrl.Message(m)

	case *btcws.AccountBalanceNtfn:
		if !cmd.Confirmed && cmd.Balance > 0 {
			// Send a Wallet Message
			txt := fmt.Sprintf("You have %.4f unconfirmed bitcoin", cmd.Balance)
			m := WalletMessage{MInfo, txt}
			ctrl.Message(m)

		} else {
			// if the confirmed balance has changed update the gui
			if cmd.Confirmed {
				ctrl.Update()
			}
			if cmd.Balance == 0 {
				//m := WalletMessage{MWarn, "You cannot send any bulletins. Get more coin."}
				//ctrl.Message(m)
			}
		}

	case *btcws.TxNtfn:
		// Maybe do nothing here.
	default:
		log.Printf("Ignoring wallet cmd: %s", cmd.Method())
	}
}

// Listen live updates all of the data stored in the wallet. It must be run
// in a seperate go routine for it to function properly.
func (ctrl *WalletCtrl) Listen(window *qml.Window) {

	// Start the qml updater
	go func() {
		for {
			select {
			case <-ctrl.update:
				walletData, err := ctrl.fetchWalletData()
				if err != nil {
					err = fmt.Errorf("Constructing wallet data threw: %s", err)
					log.Println(err)
					walletData.Message = WalletMessage{
						Type: MWarn,
						Body: err.Error(),
					}.Json()
				}
				window.Call("updateWallet", walletData)
			case msg := <-ctrl.message:
				window.Call("updateWalletAlert", msg.Json())
			}
		}
	}()

	// Listen to the websocket forever and respond appropriately.
	for {
		_, msg, err := ctrl.webSocket.ReadMessage()
		if err != nil {
			log.Fatal(err)
		}
		if req, err := btcjson.ParseMarshaledCmd(msg); err == nil {
			if req.Id() != nil {
				continue
			}
			fmt.Printf("%s : %v\n", req.Method(), req)
			ctrl.handleNtfnMsg(req)
		} else {
			log.Printf(err.Error())
		}
	}
}

func (w WalletMessage) Json() string {
	s, _ := json.Marshal(w)
	return string(s)
}

type messageType string

const (
	MWarn messageType = "WARN"
	MInfo messageType = "INFO"
	MGood messageType = "GOOD"
	MDang messageType = "DANG"
)

type WalletMessage struct {
	Type messageType `json:"type"`
	Body string      `json:"body"`
}

// Handles passing all relevant and formatted data to the gui
type qmlWalletData struct {
	SpendableBalance string

	// Information for the user that might be actionable.
	Message string

	// A JSON list of Pendling BltnListElements
	PendingListJson string

	// A JSON list of BltnListElements
	ConfirmedListJson string
}

func NewQmlWalletData() *qmlWalletData {

	// Get the list of sent bulletins from the wallet.
	now := time.Now().Unix()
	lst := []BltnListElem{
		BltnListElem{"a38e1b9e7212", now, "Ombuds Dev", "10"},
	}

	pendingListJson, _ := json.Marshal(lst)
	confirmedListJson, _ := json.Marshal(lst)

	s := &qmlWalletData{
		SpendableBalance: "575",

		PendingListJson:   string(pendingListJson),
		ConfirmedListJson: string(confirmedListJson),
	}

	return s
}
