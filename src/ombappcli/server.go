package main

import (
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"github.com/btcsuite/btcd/btcjson"
	"github.com/btcsuite/btcd/btcjson/btcws"
	"github.com/btcsuite/websocket"
)

type walletCtrl struct {
	s  *server
	ws *websocket.Conn
}

func newWalletCtrl(cfg *config, s *server) (*walletCtrl, error) {
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

type server struct {
	frontend   *frontendServer
	walletCtrl *walletCtrl
	quit       chan struct{}

	// Event Channels
	sendBulletinChan chan btcjson.Cmd
	updateWalletChan chan struct{}
}

func newServer(cfg *config) (*server, error) {

	s := &server{

		sendBulletinChan: make(chan btcjson.Cmd),
		updateWalletChan: make(chan struct{}),

		quit: make(chan struct{}),
	}

	wc, err := newWalletCtrl(cfg, s)
	if err != nil {
		return nil, err
	}
	s.walletCtrl = wc

	s.frontend = newFrontendServer(cfg, s)

	return s, nil
}

func (s *server) Start() {
	go s.walletCtrl.notificationListener()
	go s.eventHandler()
}

func (s *server) Stop() {
	close(s.quit)
}

// Listen for events to handler
func (s *server) eventHandler() {

	tick := time.Tick(2 * time.Second)

	for {
		select {
		case msg := <-s.sendBulletinChan:
			log.Println("Saw a send bulletin command. Send it to the wallet.")
			log.Printf("%v", msg)

		case <-s.updateWalletChan:
			// TODO something happened to the wallet. Update it and continue
		case t := <-tick:
			s.frontend.allMessages <- []byte(fmt.Sprintf("Tick tock: %s", t))

		case <-s.quit:
			break
		}
	}
}

type frontendServer struct {
	s           *server
	authsha     [sha256.Size]byte
	upgrader    websocket.Upgrader
	inUse       bool
	conn        *websocket.Conn
	allMessages chan []byte
}

func newFrontendServer(cfg *config, s *server) *frontendServer {

	login := cfg.Username + ":" + cfg.Password
	auth := "Basic " + base64.StdEncoding.EncodeToString([]byte(login))

	fs := &frontendServer{
		s:           s,
		authsha:     sha256.Sum256([]byte(auth)),
		upgrader:    websocket.Upgrader{},
		allMessages: make(chan []byte, 200),
	}
	// TODO create message drainer.
	return fs
}

func (fs *frontendServer) readMessages() {
	for {
		// TODO handle authentication
		_, msg, err := fs.conn.ReadMessage()
		if err != nil {
			break
		}
		if req, err := btcjson.ParseMarshaledCmd(msg); err == nil {
			if req.Id() != nil {
				break
			}
			fmt.Printf("%s : %v\n", req.Method(), req)

			if req.Method() == "sendbulletin" {
				fs.s.sendBulletinChan <- req
			}
		} else {
			log.Printf(err.Error())
		}
	}
	// TODO properly close connection to websocket
}

// Writes all messages to the attached frontend websocket if it is exists.
func (fs *frontendServer) writeMessages() {

	for {
		select {
		case b := <-fs.allMessages:
			if err := fs.conn.WriteMessage(websocket.TextMessage, b); err != nil {
				return
			}

			// TODO close channel and break out of loop
		}
	}
	// TODO properly close channel
}

// The frontend server will register and authenticate a single websocket connection
// that can send and recieve messages.
func (fs *frontendServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	if fs.inUse {
		w.Write([]byte("Websocket already in use."))
		return
	}
	fs.inUse = true

	conn, err := fs.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	fs.conn = conn

	go fs.readMessages()
	go fs.writeMessages()

}
