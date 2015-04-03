package main

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/btcsuite/btcd/btcjson"
	"github.com/btcsuite/btcd/btcjson/btcws"
	"github.com/btcsuite/btcutil"
	"github.com/btcsuite/websocket"
)

func main() {

	cert, _ := ioutil.ReadFile(btcutil.AppDataDir("Ombudscore", false) + "/rpc.cert")
	pool := x509.NewCertPool()
	pool.AppendCertsFromPEM(cert)

	tlsCfg := &tls.Config{
		RootCAs:    pool,
		MinVersion: tls.VersionTLS12,
	}

	dialer := websocket.Dialer{TLSClientConfig: tlsCfg}

	login := "rpcuser:d2xjccknb8fbfn68487xtmaw59twod727qq83k5814ag8yafrlj7n7ef9omf8ic9szae8r"
	auth := "Basic " + base64.StdEncoding.EncodeToString([]byte(login))
	requestHeader := make(http.Header)
	requestHeader.Add("Authorization", auth)

	url := fmt.Sprintf("wss://%s/ws", "localhost:18332")
	ws, _, err := dialer.Dial(url, requestHeader)
	if err != nil {
		log.Fatal(err)
	}

	for {
		_, msg, err := ws.ReadMessage()
		if err != nil {
			log.Fatal(err)
		}
		if req, err := btcjson.ParseMarshaledCmd(msg); err == nil {
			if req.Id() != nil {
				continue
			}
			fmt.Printf("%s : %v\n", req.Method(), req)
			handleNtfnMsg(req)
		} else {
			log.Printf(err.Error())
		}
	}
}

func handleNtfnMsg(req btcjson.Cmd) {

	switch cmd := req.(type) {

	case *btcws.BlockConnectedNtfn:
	case *btcws.BlockDisconnectedNtfn:
	case *btcws.TxNtfn:
	case *btcws.AccountBalanceNtfn:
		log.Println("Relevant event was fired")

	default:
		log.Printf("Ignoring wallet cmd: %s", cmd.Method())
	}
}
