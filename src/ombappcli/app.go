package main

import (
	"io"
	"log"
	"net/http"
	"os"

	"github.com/NSkelsey/ahimsarest"
	"github.com/btcsuite/go-flags"
	"github.com/soapboxsys/ombudslib/pubrecdb"
	"golang.org/x/net/websocket"
)

func Log(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s %s", r.RemoteAddr, r.Method, r.URL)
		handler.ServeHTTP(w, r)
	})
}

// Echo the data received on the WebSocket.
func EchoServer(ws *websocket.Conn) {
	io.Copy(ws, ws)
}

func main() {

	var err error
	cfg, _, err := loadConfig()
	if err != nil {
		if e, ok := err.(*flags.Error); ok &&
			(e.Type == flags.ErrHelp || e.Type == flags.ErrUnknownFlag) {
			os.Exit(1)
		} else {
			log.Fatal(err)
		}
	}

	_, _, err = setupRpcConn(cfg)
	if err != nil {
		log.Fatal(err)
	}

	db, err := pubrecdb.LoadDB(cfg.DBPath)
	if err != nil {
		log.Fatal(err)
	}

	prefix := "/api/"
	api := ahimsarest.Handler(prefix, db)
	mux := http.NewServeMux()
	ws := websocket.Handler(EchoServer)

	mux.Handle(prefix, api)
	mux.Handle("/", http.FileServer(http.Dir(cfg.StaticPath)))
	mux.Handle("/ws/", ws)

	log.Printf("Webserver listening at %s.\n", cfg.WebAppHost)
	log.Printf("Serving files at: %s\n", cfg.StaticPath)

	if cfg.Verbose {
		logger := Log(mux)
		log.Fatal(http.ListenAndServe(cfg.WebAppHost, logger))
	} else {
		log.Fatal(http.ListenAndServe(cfg.WebAppHost, mux))
	}
}
