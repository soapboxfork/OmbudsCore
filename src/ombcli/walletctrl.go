package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/btcsuite/btcd/wire"
	"github.com/btcsuite/btcrpcclient"
	"github.com/btcsuite/btcutil"
	"github.com/soapboxsys/ombudslib/ombjson"
	"gopkg.in/qml.v1"
)

// Handles interaction with the rpc based wallet
type WalletCtrl struct {
	app    *AppController
	Client *btcrpcclient.Client
	Root   qml.Object
	update chan struct{}
}

func NewWalletCtrl(client *btcrpcclient.Client, app *AppController) (*WalletCtrl, error) {
	ctrl := &WalletCtrl{
		Client: client,
		app:    app,
		update: make(chan struct{}, 100),
	}

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

	for _, bltn := range authorResp.Bulletins {
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

	//log.Println("Marshalling pendingJson")
	pendB, err := json.Marshal(pendingBltns)
	if err != nil {
		return "", "", nil
	}

	//log.Println("Marshalling confirmedJson")
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

// Listen live updates all of the data stored in the wallet. It must be run
// in a seperate go routine for it to function properly.
func (ctrl *WalletCtrl) Listen(window *qml.Window) {
	for {
		<-ctrl.update

		walletData, err := ctrl.fetchWalletData()
		if err != nil {
			err = fmt.Errorf("Constructing wallet data threw: %s", err)
			log.Println(err)
			walletData.Message = WalletMessage{
				Type: MWarn,
				Body: err.Error(),
			}
		}
		window.Call("updateWallet", walletData)
	}
}

type messageType string

const (
	MWarn messageType = "WARN"
	MInfo messageType = "INFO"
)

type WalletMessage struct {
	Type messageType `json:"type"`
	Body string      `json:"body"`
}

// Handles passing all relevant and formatted data to the gui
type qmlWalletData struct {
	SpendableBalance string

	// Information for the user that might be actionable.
	Message WalletMessage

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
