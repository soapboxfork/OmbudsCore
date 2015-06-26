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
	"github.com/btcsuite/btcrpcclient"
	"github.com/btcsuite/websocket"
)

type walletCtrl struct {
	s                      *server
	ws                     *websocket.Conn
	rpcCfg                 *btcrpcclient.ConnConfig
	connected              bool                // Flag for a valid wallet connection
	acceptedFrontendCmds   map[string]struct{} // Commands that the frontend can send to the wallet
	acceptedWalletForwards map[string]struct{} // Commands from the wallet that are sent to the frontend
}

func newWalletCtrl(s *server, cfg *config) (*walletCtrl, error) {
	certs, err := ioutil.ReadFile(cfg.CAFile)
	if err != nil {
		return nil, err
	}
	pool := x509.NewCertPool()
	pool.AppendCertsFromPEM(certs)

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

	rpcCfg := &btcrpcclient.ConnConfig{
		Host:         cfg.RPCConnect,
		User:         cfg.Username,
		Pass:         cfg.Password,
		Certificates: certs,
		Endpoint:     "ws",
	}

	wc := &walletCtrl{
		ws:        ws,
		connected: true,
		rpcCfg:    rpcCfg,
		s:         s,
		acceptedFrontendCmds: map[string]struct{}{
			"sendbulletin":     struct{}{},
			"composebulletin":  struct{}{},
			"sendtoaddress":    struct{}{},
			"listtransactions": struct{}{},
			"walletpassphrase": struct{}{},
			"getbalance":       struct{}{},
			"getinfo":          struct{}{},
		},
		acceptedWalletForwards: map[string]struct{}{
			"accountbalance": struct{}{},
			"blockconnected": struct{}{},
		},
	}

	return wc, nil
}

func (wc *walletCtrl) Start() {
	go wc.notificationListener()
}

func (wc *walletCtrl) IsConnected() bool {
	return wc.connected
}

// Listens for notifications from the wallet
func (wc *walletCtrl) notificationListener() {
	for {
		_, msg, err := wc.ws.ReadMessage()
		if err != nil {
			// TODO handle reinitalization
			if wc.connected {
				wc.connected = false
				log.Printf("Wallet WS broke with: $s\n", err)
			}
			continue
		}

		cmd, perr := btcjson.ParseMarshaledCmd(msg)
		if perr == nil {
			// Unmarshaled a btcjson.cmd, drop the cmd if it is not of interest to us.
			if !wc.approvedForFrontend(cmd) {
				continue
			}
			log.Printf("Forwarding cmd: [%s]\n", cmd.Method())
		}

		reply := btcjson.Reply{}
		rerr := json.Unmarshal(msg, &reply)
		if rerr == nil {
			// Unmarshaled a btcjson.Reply, check to see if it has a good id.
			s := fmt.Sprintf("%v", reply.Result)
			log.Printf("Saw Resp: [%s]", s)
			if reply.Id != nil {
				s := fmt.Sprintf("%v", *reply.Id)
				if s[:8] != "frontend" {
					log.Printf("Bad reply id: [%s]\n", *reply.Id)
					continue
				}
			}
		}

		if perr != nil && rerr != nil {
			log.Printf("Wallet sent bad json: %s\n", perr)
			continue
		}

		err = wc.s.frontend.TryWrite(msg)
		if err != nil {
			log.Println(err)
		}
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

// sendCommand sends btcjson cmds along to the rpcclient specified in ConnConfig.
// A prefix is added to any errors that occur indicating what step failed.
func (wc *walletCtrl) sendCommand(cmd btcjson.Cmd) (interface{}, error) {
	msg, err := cmd.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("createMessage: %v", err.Error())
	}

	reply, err := send(wc.rpcCfg, msg)
	if err != nil {
		return nil, fmt.Errorf("rpcCommand: %v", err.Error())
	}

	return reply, nil
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
	log.Printf("Forwarding [%s] to the wallet\n", cmd.Method())
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
