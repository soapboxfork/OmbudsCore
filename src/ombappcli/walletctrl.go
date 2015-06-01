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
	"github.com/btcsuite/btcd/wire"
	"github.com/btcsuite/btcrpcclient"
	"github.com/btcsuite/websocket"
	"github.com/soapboxsys/ombudslib/rpcexten"
)

type walletCtrl struct {
	s                      *server
	ws                     *websocket.Conn
	acceptedFrontendCmds   map[string]struct{} // Commands that the frontend can send to the wallet
	acceptedWalletForwards map[string]struct{} // Commands from the wallet that are sent to the frontend
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

	wc := &walletCtrl{
		ws: ws,
		s:  s,
		acceptedFrontendCmds: map[string]struct{}{
			"sendbulletin":     struct{}{},
			"composebulletin":  struct{}{},
			"sendtoaddress":    struct{}{},
			"listtransactions": struct{}{},
			"walletpassphrase": struct{}{},
		},
		acceptedWalletForwards: map[string]struct{}{
			"accountbalance": struct{}{},
		},
	}

	return wc, nil
}

// Listens for notifications from the wallet
func (wc *walletCtrl) notificationListener() {
	for {
		_, msg, err := wc.ws.ReadMessage()
		if err != nil {
			// TODO handle reinitalization
			//log.Printf("Wallet WS broke with: $s\n", err)
			continue
		}

		cmd, perr := btcjson.ParseMarshaledCmd(msg)
		if perr == nil {
			// Unmarshaled a btcjson.cmd
			if !wc.approvedForFrontend(cmd) {
				log.Printf("Dropping cmd: [%s]\n", cmd.Method())
				continue
			}
		}

		reply := btcjson.Reply{}
		rerr := json.Unmarshal(msg, &reply)
		if rerr == nil {
			// Unmarshaled a btcjson.Reply, check to see if it has a good id.
			if reply.Id != nil {
				s := fmt.Sprintf("%v", *reply.Id)
				if s[:8] != "frontend" {
					log.Printf("Bad reply id: [%s]\n", *reply.Id)
					continue
				}
			} else {
				log.Printf("Bad reply: [%v]\n", reply)
				continue
			}
		}

		if perr != nil && rerr != nil {
			log.Printf("Wallet sent bad json: %s\n", perr)
			continue
		}

		wc.s.frontend.allMessages <- msg
	}
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
func (wc *walletCtrl) SendBulletin(board, msg string) (*wire.ShaHash, error) {

	// Create a five second window to send the bulletin
	timeout := int64(5)

	//TODO change passphrase
	passphrase := "nalgene"
	id := "ombwebapp"

	unlockCmd, err := btcjson.NewWalletPassphraseCmd(id, passphrase, timeout)
	if err != nil {
		return nil, err
	}

	err = wc.ws.WriteJSON(unlockCmd)
	if err != nil {
		return nil, err
	}

	addr := "n37T77JKnFFZJN4udvyasZUwVhpidvq9gb"
	sendCmd := rpcexten.NewSendBulletinCmd(id, addr, board, msg)

	err = wc.ws.WriteJSON(sendCmd)
	if err != nil {
		return nil, err
	}

	// TODO store results of send in settings
	if err != nil {
		log.Println(err)
		return nil, err
	}
	/*

		txid, err := wire.NewShaHashFromStr(res.(string))
		if err != nil {
			return nil, err
		}*/

	return nil, nil
}

// Check to see if the passed rpc command is approved to be sent to the
// the wallet.
func (wc *walletCtrl) approvedForWallet(cmd btcjson.Cmd) bool {
	_, ok := wc.acceptedFrontendCmds[cmd.Method()]
	return ok
}

// fowardCmd accepts btcjson cmds and forwards them to the wallet.
func (wc *walletCtrl) forwardCmd(cmd btcjson.Cmd) error {
	if !wc.approvedForWallet(cmd) {
		return fmt.Errorf("Cmd [%s] not approved", cmd.Method())
	}
	err := wc.ws.WriteJSON(cmd)
	if err != nil {
		return err
	}
	return nil
}

func (wc *walletCtrl) approvedForFrontend(cmd btcjson.Cmd) bool {
	_, ok := wc.acceptedWalletForwards[cmd.Method()]
	return ok
}
