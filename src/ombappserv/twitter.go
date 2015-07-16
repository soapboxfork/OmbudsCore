// This file contains all of the nessecary bits for oauth to Twitter and the
// generation of tweets.
package main

import (
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/mrjones/oauth"
)

/*
type oauth.AccessToken struct {
	Token  string `json:"token"`
	Secret string `json:"secret"`
}
*/

var TWIT_CONSUMER_KEY = "8CuIh0pL354AVQ0c3UZz1o75y"
var TWIT_CONSUMER_SECRET = "7VLAGTsHkhWgVYkQdHKu6VDiHgxLEsoeSon2I0LEWflIn4BG8e"

// authTwitterUser launches the first step in the process to generate a valid
// set of oauth tokens for a user of Ombuds to tweet their messages.
func (setc *settingCtrl) authTwitterUser() (
	func(http.ResponseWriter, *http.Request),
	func(http.ResponseWriter, *http.Request)) {

	var twitOauthChan chan *oauth.RequestToken

	//c.Debug(true)

	getTokenAndUrl := func(w http.ResponseWriter, request *http.Request) {
		// TODO authenticate request....
		requestToken, url, err := setc.twitConsumer.GetRequestTokenAndUrl("oob")
		if err != nil {
			logAndWrite(err, w)
			return
		}

		if twitOauthChan != nil {
			close(twitOauthChan)
		}

		twitOauthChan = make(chan *oauth.RequestToken, 1)
		twitOauthChan <- requestToken
		w.Write([]byte(url))
	}

	postAuthCreds := func(w http.ResponseWriter, request *http.Request) {
		select {
		case requestToken := <-twitOauthChan:
			b, err := ioutil.ReadAll(request.Body)
			if err != nil {
				logAndWrite(err, w)
				return
			}

			verificationCode := string(b)
			accessToken, err := setc.twitConsumer.AuthorizeToken(requestToken, verificationCode)
			if err != nil {
				logAndWrite(err, w)
				return
			}

			setc.settings.Preferences.TwitterAccess = *accessToken
			if err = setc.Commit(); err != nil {
				logAndWrite(err, w)
				return
			}

		default:
			err := errors.New("No requestToken available for Twitter Oauth req!")
			logAndWrite(err, w)
			return
		}
	}

	return getTokenAndUrl, postAuthCreds
}

func logAndWrite(err error, w http.ResponseWriter) {
	log.Println(err)
	http.Error(w, err.Error(), http.StatusInternalServerError)
}

// createTweet tweets on the user's behalf
func (setc *settingCtrl) createTweet() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, request *http.Request) {
		b, err := ioutil.ReadAll(request.Body)
		if err != nil {
			logAndWrite(err, w)
			return
		}

		status := fmt.Sprintf("%s", b)

		_, err = setc.twitConsumer.Post(
			"https://api.twitter.com/1.1/statuses/update.json",
			map[string]string{
				"status": status,
			},
			&setc.settings.Preferences.TwitterAccess,
		)
		if err != nil {
			logAndWrite(err, w)
			return
		}

		w.Write([]byte("Successfully Tweeted!"))
	}
}
