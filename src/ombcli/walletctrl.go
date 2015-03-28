package main

import (
	"encoding/json"
	"time"

	"github.com/btcsuite/btcrpcclient"
	"gopkg.in/qml.v1"
)

// Handles interaction with the rpc based wallet
type WalletCtrl struct {
	Client *btcrpcclient.Client
	Root   qml.Object
}

func NewWalletCtrl(client *btcrpcclient.Client) (*WalletCtrl, error) {
	ctrl := &WalletCtrl{
		Client: client,
	}

	return ctrl, nil
}

func (ctrl *WalletCtrl) updateBalance() {

}

func (ctrl *WalletCtrl) updateBulletins() {

}

// Starts a goroutine that live updates all of the data stored in the wallet.
func (ctrl *WalletCtrl) Watch() {

	go func() {
		for {

		}
	}()
}

// Handles passing all relevant and formatted data to the gui
type QmlWalletData struct {
	AvailBalance string

	// A JSON list of BltnListElements
	bltnList []BltnListElem
	// Converted into a json string
	PendingListJson string

	// A JSON list of BltnListElements
	ConfirmedListJson string
}

// The qml wallet's representation of a bulletin sent from the wallet
type BltnListElem struct {
	Txid  string `json:"txid"`
	Unix  int64  `json:"unix"`
	Board string `json:"board"`
	Depth string `json:"depth"`
}

func NewQmlWalletData() *QmlWalletData {

	// Get the list of sent bulletins from the wallet.
	now := time.Now().Unix()
	lst := []BltnListElem{
		BltnListElem{"a38e1b9e7212", now, "Ombuds Dev", "10"},
	}

	pendingListJson, _ := json.Marshal(lst)
	confirmedListJson, _ := json.Marshal(lst)

	s := &QmlWalletData{
		AvailBalance: "575",

		PendingListJson:   string(pendingListJson),
		ConfirmedListJson: string(confirmedListJson),
	}

	return s
}
