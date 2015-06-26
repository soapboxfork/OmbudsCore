package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/btcsuite/btcutil"
	"github.com/gorilla/mux"
	"github.com/soapboxsys/ombudslib/rpcexten"
)

type settingCtrl struct {
	s        *server
	settings settings
	file     string
	dirPath  string
}

type Favorites struct {
	Boards    []string `json:"boards"`
	Bulletins []string `json:"bulletins"`
}

type Preferences struct {
	RenderAllMd     bool   `json:"renderMd"`  // Flag to render all markdown in every board.
	LastActive      int    `json:"lastLogin"` // The last time the user browsed content.
	DisplayTooltips bool   `json:"tooltips"`  // Flag that toggles tooltips in the gui.
	TwitAppToken    string `json:"appToken"`
	TwitUserToken   string `json:"userToken"`
}

type settings struct {
	Initialized bool        `json:"initialized"` // Flag that handles initial startup functionality
	Address     string      `json:"address"`
	Favorites   Favorites   `json:"favorites"`
	Preferences Preferences `json:"preferences"`
}

func (h *settingCtrl) Commit() error {
	return writefile(h.file, h.settings)
}

func newSettingCtrl(s *server, dirpath string) (*settingCtrl, error) {
	fpath := filepath.Join(dirpath, "settings.json")
	if !fileExists(fpath) {
		s := &settings{
			Favorites: Favorites{
				Boards:    []string{},
				Bulletins: []string{},
			},
		}
		err := writefile(fpath, *s)
		if err != nil {
			return nil, err
		}
	}

	g, err := readfile(fpath)
	if err != nil {
		return nil, err
	}

	setc := &settingCtrl{
		file:     fpath,
		dirPath:  dirpath,
		settings: *g,
	}

	setc.s = s

	return setc, nil
}

func (setc *settingCtrl) allSettingsHandler() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, request *http.Request) {
		settings, err := readfile(setc.file)
		if err != nil {
			http.Error(w, err.Error(), 500)
			log.Println(err)
			return
		}
		writeJson(w, settings)
	}
}

type SingleFav struct {
	Type   string `json:"type"`
	Val    string `json:"val"`
	Method string `json:"method"`
}

func (setc *settingCtrl) handleFavorite() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, request *http.Request) {
		switch {
		case request.Method == "POST" || request.Method == "DELETE":
			var sf SingleFav
			// Decode the request
			decoder := json.NewDecoder(request.Body)
			err := decoder.Decode(&sf)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			if sf.Method != "delete" {
				// Store the single favorite
				err = setc.saveFavorite(sf)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					log.Println(err)
					return
				}
			} else {
				// Delete the favorite
				err = setc.delFavorite(sf)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					log.Println(err)
					return
				}
			}

		default:
			http.Error(w, "Invalid HTTP Method", http.StatusMethodNotAllowed)
			return
		}
	}
}

func (setc *settingCtrl) delFavorite(sf SingleFav) error {
	var found bool = false
	var i int
	switch {
	case sf.Type == "board":
		var s []string = setc.settings.Favorites.Boards
		found, i = listContains(s, sf.Val)
		if found {
			s = append(s[:i], s[i+1:]...)
			setc.settings.Favorites.Boards = s
		}
	case sf.Type == "bltn":
		// functions the same way as the case above
		var s []string = setc.settings.Favorites.Bulletins
		found, i = listContains(s, sf.Val)
		if found {
			s = append(s[:i], s[i+1:]...)
			setc.settings.Favorites.Bulletins = s
		}
	default:
		return errors.New(fmt.Sprintf("No favorite type of: %s", sf.Type))
	}
	if !found {
		return errors.New("Value not found in favorites")
	}

	if err := setc.Commit(); err != nil {
		return err
	}

	return nil

}

func listContains(lst []string, val string) (bool, int) {
	for i, elm := range lst {
		if elm == val {
			return true, i
		}
	}
	return false, -1
}

func (setc *settingCtrl) saveFavorite(sf SingleFav) error {
	switch {
	case sf.Type == "board":
		var s []string = setc.settings.Favorites.Boards
		inList, _ := listContains(s, sf.Val)
		// Do nothing if the entry is already in the list
		if inList {
			return nil
		}
		s = append(s, sf.Val)
		setc.settings.Favorites.Boards = s

	case sf.Type == "bltn":
		// functions the same way as the case above
		var s []string = setc.settings.Favorites.Bulletins
		inList, _ := listContains(s, sf.Val)
		if inList {
			return nil
		}
		s = append(s, sf.Val)
		setc.settings.Favorites.Bulletins = s

	default:
		return errors.New(fmt.Sprintf("No favorite type of: %s", sf.Type))
	}
	if err := setc.Commit(); err != nil {
		return err
	}
	return nil
}

// isInitialized ensures that the wallet and the json setting 'Initialized' are
// in sync. It does this by asking the wallet a question about
func (setc *settingCtrl) isInitialized() (bool, error) {
	// check the internal initialized param
	status := setc.settings.Initialized

	// check the state of the wallet
	if setc.s.walletCtrl.IsConnected() {
		cmd := &rpcexten.GetWalletStateCmd{}
		resp, err := setc.s.walletCtrl.sendCommand(cmd)
		if err != nil {
			return false, err
		}
		walstate, ok := resp.(rpcexten.GetWalletStateResult)
		if !ok {
			return false, fmt.Errorf("Wallet provided bad state resp")
		}

		// if they are different log the error and throw the error
		if walstate.HasWallet != status {
			return false, fmt.Errorf("wallet and ombappcli are not in sync.")
		}
	}

	// Otherwise the system is (momentarily) in sync
	return status, nil
}

// initializeSystem
func (setc *settingCtrl) initializeSystem(cmd *rpcexten.WalletSetupCmd) error {
	log.Println("sending walletSetupCmd")
	resp, err := setc.s.walletCtrl.sendCommand(cmd)
	if err != nil {
		return err
	}
	// Validate that it is a real address
	var addr, ok = resp.(string)
	if !ok {
		return fmt.Errorf("Wallet provided bad addr")
	}
	_, err = btcutil.DecodeAddress(addr, activeNet.Params)
	if err != nil {
		return err
	}
	// Set the address
	setc.settings.Address = addr

	// System is now ready to operate.
	setc.settings.Initialized = true

	// Write it all to disk.
	if err = setc.Commit(); err != nil {
		return err
	}

	return nil
}

// handleWalletSetup listens for http posts with parameters to configure a new
// wallet for the frontend. It signifies completion of the task with a 201.
// This signifies that an HD wallet, a wallet address and new settings have
// been saved and succesfully created.
func (setc *settingCtrl) handleWalletSetup() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, request *http.Request) {
		// Decode the request
		raw, err := ioutil.ReadAll(request.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		log.Printf("%s\n", raw)

		cmd := &rpcexten.WalletSetupCmd{}
		err = cmd.UnmarshalJSON(raw)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Validate the request
		log.Printf("%v", cmd)
		if len(cmd.Passphrase) < 6 {
			validationErr := fmt.Errorf("json did not validate")
			http.Error(w, validationErr.Error(), http.StatusBadRequest)
			return
		}
		// Check to see if the system is already initialized
		ok, err := setc.isInitialized()
		if err != nil {
			initErr := fmt.Errorf("System init check failed with: %s", err)
			http.Error(w, initErr.Error(), http.StatusInternalServerError)
			return
		}
		// The system is already initialized. Return with not modified
		if ok {
			err = fmt.Errorf("System already initialized")
			http.Error(w, err.Error(), http.StatusNotModified)
			return
		}
		// If not initialize the wallet and ombappcli
		err = setc.initializeSystem(cmd)
		if err != nil {
			err = fmt.Errorf("System initiliaztion failed with: %s", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Write the new address to the frontend client
		w.Write([]byte("success"))
	}
}

func (setc *settingCtrl) Handler(prefix string) http.Handler {
	p := prefix
	router := mux.NewRouter()
	router.HandleFunc(p+"initialize", setc.handleWalletSetup())
	router.HandleFunc(p+"favorite", setc.handleFavorite())
	//router.HandleFunc(p+"twitter", setc.registerUser())
	//router.HandleFunc(p+"prefs", setc.setPreferences())
	router.HandleFunc(p, setc.allSettingsHandler())
	return router
}

func writeJson(w http.ResponseWriter, m interface{}) {
	bytes, err := json.Marshal(m)
	if err != nil {
		http.Error(w, "Failed", 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(bytes)
}

func writefile(fpath string, g settings) error {
	f, err := os.Create(fpath)
	defer f.Close()
	if err != nil {
		return err
	}

	b, err := json.Marshal(&g)
	if err != nil {
		return err
	}

	if _, err = f.Write(b); err != nil {
		return err
	}

	return nil
}

func readfile(fpath string) (*settings, error) {

	f, err := os.Open(fpath)
	defer f.Close()
	if err != nil {
		return nil, err
	}

	b, err := ioutil.ReadAll(f)
	if err != nil {
		return nil, err
	}

	var g settings
	if err = json.Unmarshal(b, &g); err != nil {
		return nil, err
	}

	return &g, nil
}
