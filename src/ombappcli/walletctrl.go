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

	"github.com/btcsuite/btcd/btcjson"
	"github.com/btcsuite/btcd/btcjson/btcws"
	"github.com/btcsuite/btcrpcclient"
	"github.com/btcsuite/websocket"
	"github.com/soapboxsys/ombudslib/rpcexten"
)

type walletCtrl struct {
	s      *server
	ws     *websocket.Conn
	rpcCfg *btcrpcclient.ConnConfig
}

func newWalletCtrl(s *server, cfg *config) (*walletCtrl, error) {
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

	rpcCfg, err := setupRpcCfg(cfg)
	if err != nil {
		return nil, err
	}

	wc := &walletCtrl{
		ws:     ws,
		s:      s,
		rpcCfg: rpcCfg,
	}

	return wc, nil
}

// Listens for notifications from the wallet
func (wc *walletCtrl) notificationListener() {
	for {
		_, msg, err := wc.ws.ReadMessage()
		if err != nil {
			log.Fatal(err)
		}
		if req, err := btcjson.ParseMarshaledCmd(msg); err == nil {
			if req.Id() != nil {
				continue
			}

			fmt.Printf("%s : %v\n", req.Method(), req)
			switch cmd := req.(type) {
			case *btcws.BlockConnectedNtfn:
				// new block
			case *btcws.BlockDisconnectedNtfn:
				// Update gui and send message something funky is up
				//m := WalletMessage{MWarn, "A block was disconnected. That is odd."}
			case *btcws.AccountBalanceNtfn:
				// New balance
			case *btcws.TxNtfn:
				// provides details JSON
			default:
				log.Printf("Ignoring wallet cmd: %s", cmd.Method())
			}
		} else {
			log.Printf(err.Error())
		}
	}

	<-wc.s.quit
}

// send sends a JSON-RPC command to the specified RPC server and examines the
// results for various error conditions.  It either returns a valid result or
// an appropriate error.
func send(cfg *btcrpcclient.ConnConfig, msg []byte) (interface{}, error) {
	var reply btcjson.Reply
	var err error

	reply, err = btcjson.TlsRpcCommand(cfg.User,
		cfg.Pass, cfg.Host, msg, cfg.Certificates,
		false)

	if err != nil {
		return nil, err
	}

	if reply.Error != nil {
		return nil, reply.Error
	}

	return reply.Result, nil
}

// sendCommand sends btcjson cmds along to the rpcclient specified in ConnConfig.  A prefix is added to any errors that occur indicating
// what step failed.
func sendCommand(cfg *btcrpcclient.ConnConfig, command btcjson.Cmd) (interface{}, error) {
	msg, err := json.Marshal(command)
	if err != nil {
		return nil, fmt.Errorf("createMessage: %v", err.Error())
	}

	reply, err := send(cfg, msg)
	if err != nil {
		return nil, fmt.Errorf("rpcCommand: %v", err.Error())
	}

	return reply, nil
}

// Updates the internal state of the application while sending the bulletin.
// The function first authenticates to the wallet and then it will try to send bulletins.
func (wc *walletCtrl) SendBulletin(board, msg string) (bool, string) {

	// Create a five second window to send the bulletin
	timeout := int64(5)

	//TODO change passphrase
	passphrase := "nalgene"
	id := "ombwebapp"

	unlockCmd, err := btcjson.NewWalletPassphraseCmd(id, passphrase, timeout)
	if err != nil {
		return false, err.Error()
	}
	/*_, err = sendCommand(wc.rpcCfg, unlockCmd)
	if err != nil {
		return false, err.Error()
	}*/
	err = wc.ws.WriteJSON(unlockCmd)
	if err != nil {
		return false, err.Error()
	}

	addr := "mxNtgU2vUrD4pbJUxTRUi4iEtBthTAF1ta"
	sendCmd := rpcexten.NewSendBulletinCmd(id, addr, board, msg)

	//	res, err := sendCommand(wc.rpcCfg, cmd)

	err = wc.ws.WriteJSON(sendCmd)
	if err != nil {
		return false, err.Error()
	}
	// TODO store results of send in settings
	if err != nil {
		log.Println(err)
		return false, err.Error()
	} else {
		//txid := res.(string)
		//log.Printf("rpcwallet reported success: %s\n", txid)
		return true, "success!"
	}
}

func setupRpcCfg(cfg *config) (*btcrpcclient.ConnConfig, error) {

	certs, err := ioutil.ReadFile(cfg.CAFile)
	if err != nil {
		return nil, err
	}

	rpcCfg := &btcrpcclient.ConnConfig{
		Host:                cfg.RPCConnect,
		User:                cfg.Username,
		Pass:                cfg.Password,
		Certificates:        certs,
		Endpoint:            "ws",
		DisableConnectOnNew: true,
	}
	return rpcCfg, nil
}
