package main

import (
	"log"

	"github.com/btcsuite/btcd/btcjson"
	"github.com/btcsuite/btcrpcclient"
	"github.com/microcosm-cc/bluemonday"
	"github.com/russross/blackfriday"
	"github.com/soapboxsys/ombudslib/rpcexten"
)

// The id handed to the rpcwallet
const id string = "OmbudsCore"

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
