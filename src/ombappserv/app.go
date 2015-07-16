package main

import (
	"log"
	"net/http"
	"os"

	"github.com/NSkelsey/ahimsarest"
	"github.com/btcsuite/go-flags"
	"github.com/soapboxsys/ombudslib/pubrecdb"
	_ "github.com/soapboxsys/ombudslib/rpcexten"
)

func Log(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s %s", r.RemoteAddr, r.Method, r.URL)
		handler.ServeHTTP(w, r)
	})
}

func main() {

	var err error
	cfg, _, err := loadConfig()
	if err != nil {
		// If the err has to do with bad command line flags just exit
		if e, ok := err.(*flags.Error); ok &&
			(e.Type == flags.ErrHelp || e.Type == flags.ErrUnknownFlag) {
			os.Exit(1)
			// Otherwise kill the program
		} else {
			log.Fatal(err)
		}
	}

	db, err := pubrecdb.LoadDB(cfg.DBPath)
	if err != nil {
		log.Fatal(err)
	}

	server, err := newServer(cfg)
	if err != nil {
		log.Fatal(err)
	}
	server.Start()

	apiPrefix := "/api/"
	shPrefix := "/api/settings/"

	api := ahimsarest.Handler(apiPrefix, db)
	settingH := server.settingCtrl.Handler(shPrefix)

	mux := http.NewServeMux()
	mux.Handle(apiPrefix, api)
	mux.Handle(shPrefix, settingH)
	mux.Handle("/ws/", server.frontend)
	mux.Handle("/", http.FileServer(http.Dir(cfg.StaticPath)))

	log.Printf("Webserver listening at %s.\n", cfg.WebAppHost)
	log.Printf("Serving files at: %s\n", cfg.StaticPath)

	if cfg.Verbose {
		logger := Log(mux)
		log.Println(http.ListenAndServe(cfg.WebAppHost, logger))
	} else {
		log.Println(http.ListenAndServe(cfg.WebAppHost, mux))
	}
	log.Println("Stopping Server...")
	server.Stop()
}

// peek returns the proper length to slice a byte array to for logging purposes.
// It will either produce an int no more than max size or spit out the length of
// the array.
func peek(b []byte) int {
	var max = 70
	if len(b) > max {
		return max
	} else {
		return len(b)
	}
}
