package main

import (
	"encoding/json"
	"fmt"
	"time"

	blkdb "github.com/soapboxsys/ombudslib/blockchaindb"
)

// Handles interaction with the rpc based wallet
type walletCrtl struct {
}

// Handles passes all relevant and formatted data to the gui
type QmlWalletData struct {
	AvailTxOuts   string
	PendingTxOuts string
	AvailFuel     string
	AvailCoin     string
	ConfirmedBltn string

	// A JSON list of BltnListElements
	bltnList []BltnListElem
	// Converted into a json string
	BltnListJson string

	// A JSON list of FuelOuts to use.
	fuelOutList []blkdb.FuelOut
	// Converted into a json string for qml
	FuelOutListJson string
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
		BltnListElem{"deadbeef", now, "ahimsa-dev", "10"},
		BltnListElem{"beefbeef", now, "haimsa-dev", "95"},
		BltnListElem{"shredbeef", now, `console.log("iran"); haimsa-dev`, "95"},
	}

	bltnListJson, err := json.Marshal(lst)
	if err != nil {
		fmt.Println(err)
	}

	// Get the list of available txout's from the wallet.
	fuelOuts := []blkdb.FuelOut{
		blkdb.NewFuelOut(),
		blkdb.NewFuelOut(),
		blkdb.NewFuelOut(),
		blkdb.NewFuelOut(),
	}

	fuelOutJson, err := json.Marshal(fuelOuts)
	if err != nil {
		fmt.Println(err)
	}

	s := &QmlWalletData{
		AvailTxOuts:   "10",
		PendingTxOuts: "5",

		BltnListJson:    string(bltnListJson),
		FuelOutListJson: string(fuelOutJson),
	}

	return s
}
