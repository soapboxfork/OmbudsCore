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

	"github.com/gorilla/mux"
)

type settingCtrl struct {
	s        *server
	settings settings
	file     string
	dirPath  string
}

type Favorites struct {
	Boards    []string `json:boards`
	Bulletins []string `json:bulletins`
}

type settings struct {
	Address       string    `json:"address"`
	Favorites     Favorites `json:"favorites"`
	TwitAppToken  string    `json:"appToken"`
	TwitUserToken string    `json:"userToken"`
	RenderAllMd   bool      `json:"renderAllMd"`
}

func (h *settingCtrl) Commit() error {
	return writefile(h.file, h.settings)
}

func newSettingCtrl(s *server, dirpath string) (*settingCtrl, error) {
	fpath := filepath.Join(dirpath, "settings.json")
	if !fileExists(fpath) {
		s := &settings{}
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
	Type string `json:type`
	Val  string `json:val`
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

			if request.Method == "POST" {
				// Store the single favorite
				err = setc.saveFavorite(sf)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					log.Println(err)
					return
				}
			}
			if request.Method == "DELETE" {
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

func (setc *settingCtrl) Handler(prefix string) http.Handler {
	p := prefix
	router := mux.NewRouter()
	router.HandleFunc(p+"all/", setc.allSettingsHandler())
	router.HandleFunc(p+"favorite/", setc.handleFavorite())
	//router.HandleFunc(p+"twitter/", setc.registerUser())
	//router.HandleFunc(p+"prefs/", setc.setPreferences())
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
