package main

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/btcsuite/btcd/btcjson"
	"github.com/btcsuite/websocket"
)

type server struct {
	frontend    *frontendServer
	walletCtrl  *walletCtrl
	settingCtrl *settingCtrl
	quit        chan struct{}

	// Event Channels
	fsRPCCmdChan     chan btcjson.Cmd // Recieves all rpc commands from the frontend.
	updateWalletChan chan struct{}
}

func newServer(cfg *config) (*server, error) {

	s := &server{

		fsRPCCmdChan:     make(chan btcjson.Cmd),
		updateWalletChan: make(chan struct{}),

		quit: make(chan struct{}),
	}

	wc, err := newWalletCtrl(s, cfg)
	if err != nil {
		return nil, err
	}
	s.walletCtrl = wc

	setc, err := newSettingCtrl(s, cfg.DataDirPath)
	if err != nil {
		return nil, err
	}
	s.settingCtrl = setc

	s.frontend = newFrontendServer(s, cfg)

	return s, nil
}

func (s *server) Start() {
	s.walletCtrl.Start()

	go s.eventHandler()
}

func (s *server) Stop() {
	close(s.quit)
}

// Listen for events to handler
func (s *server) eventHandler() {

	tick := time.Tick(60 * time.Second)

	for {
		select {
		case cmd := <-s.fsRPCCmdChan:
			err := s.walletCtrl.forwardCmd(cmd)
			if err != nil {
				err = fmt.Errorf("Forwarding cmd: [%s], [%s] failed with: %s", cmd.Method(), cmd.Id(), err)
				sendErr := s.frontend.sendError(cmd, err)
				if sendErr != nil {
					log.Printf("Could not notify frontend of err: %s due to: %s\n", err, sendErr)
				}
			}
		case t := <-tick:
			msg := []byte(fmt.Sprintf(`{"error":"null", "result":"Tick tock: %s"}`, t))
			err := s.frontend.TryWrite(msg)
			if err != nil {
				log.Println(err)
			}
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
	allMessages chan []byte // A buffered channel that forwards commands to the frontend

	// Channels to force a single websocket per instance of the frontendServer
	takeHandle    chan bool
	releaseHandle chan bool
	closeNotif    chan bool
}

func newFrontendServer(s *server, cfg *config) *frontendServer {

	login := cfg.Username + ":" + cfg.Password
	auth := "Basic " + base64.StdEncoding.EncodeToString([]byte(login))

	fs := &frontendServer{
		s:           s,
		authsha:     sha256.Sum256([]byte(auth)),
		upgrader:    websocket.Upgrader{},
		allMessages: make(chan []byte, 20),

		takeHandle:    make(chan bool),
		releaseHandle: make(chan bool),
		closeNotif:    make(chan bool),
	}
	// TODO create message drainer.
	go fs.connMonitor()
	return fs
}

func (fs *frontendServer) readMessages() {
	for {
		select {
		case <-fs.closeNotif:
			return
		default:
			// TODO handle authentication
			_, msg, err := fs.conn.ReadMessage()
			if err != nil {
				fs.releaseHandle <- true
				log.Printf("frontend ws read failed with: %s\n", err)
				return
			}

			req, err := btcjson.ParseMarshaledCmd(msg)
			if err == nil {
				fs.s.fsRPCCmdChan <- req
			} else {
				fs.releaseHandle <- true
				log.Printf("Marshal failed %s, %v\n", err, req)
				return
			}
		}
	}
}

// sendError composes a btcjson.error Reply from the given cmd and its
// associated error and then pushes it into the reply channel
func (fs *frontendServer) sendError(cmd btcjson.Cmd, err error) error {

	var id interface{} = cmd.Id()
	reply := &btcjson.Reply{
		Result: nil,
		Error: &btcjson.Error{
			Message: err.Error(),
		},
		Id: &id,
	}

	b, err := json.Marshal(reply)
	if err != nil {
		return err
	}

	// Send the bytes to the writing channel
	fs.allMessages <- b

	return nil
}

// Writes all messages to the attached frontend websocket if it exists.
func (fs *frontendServer) writeMessages() {

	for {
		select {
		case b := <-fs.allMessages:
			log.Printf("Writing: %s to the frontend", b[:peek(b)])
			if err := fs.conn.WriteMessage(websocket.TextMessage, b); err != nil {
				log.Printf("Write failed to write: [%s] with: ", b, err)
				fs.releaseHandle <- true
				return
			}
		case <-fs.closeNotif:
			log.Printf("Closing writeMessage channel")
			return
		}
	}
}

// Closes the connection if any signal is thrown. Ensures that a new connection
// can be made. connMonitor also drains the allMessages channel when nothing is
// there to deal with messages to the websocket.
func (fs *frontendServer) connMonitor() {
	for {
		select {
		case <-fs.takeHandle:
			// Take the conn's handle
			fs.closeNotif = make(chan bool)
			fs.inUse = true
		case <-fs.s.quit:
			fs.closeConn()
		case <-fs.releaseHandle:
			fs.closeConn()
		}
	}
}

// TryWrite will try to write the serialized msg into the frontends allMessages
// channel. If the channel is full, that means nothing is draining it on, so we
// will bump the first message out of the channel and add this msg to the back
// of the queue.
func (fs *frontendServer) TryWrite(msg []byte) error {
	select {
	// Push msg into channel
	case fs.allMessages <- msg:
		return nil
	// If channel is full, discard first msg then push
	default:
		delMsg := <-fs.allMessages
		fs.allMessages <- msg
		return fmt.Errorf("Dropped msg: [%s]", delMsg)
	}
}

// closeConn ensures that the frontendServer is ready to shutdown or accept
// a new connection.
func (fs *frontendServer) closeConn() {
	// Close the read pipes
	close(fs.closeNotif)
	fs.conn.Close()
	fs.inUse = false
}

// The frontend server will register and authenticate a single websocket connection
// that can send and recieve messages. It will start a reader and a writer that
// pulls messages from the websocket.
func (fs *frontendServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	if fs.inUse {
		w.Write([]byte("Websocket already in use."))
		return
	}
	fs.takeHandle <- true

	conn, err := fs.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	fs.conn = conn

	log.Println("New frontend socket connected.")
	go fs.readMessages()
	go fs.writeMessages()
}
