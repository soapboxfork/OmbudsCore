/*
* Copyright (c) 2013, 2014 Conformal Systems LLC <info@conformal.com>
*
* Permission to use, copy, modify, and distribute this software for any
* purpose with or without fee is hereby granted, provided that the above
* copyright notice and this permission notice appear in all copies.
*
* THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
* WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
* MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
* ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
* WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
* ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
* OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

package main

import (
	"io/ioutil"

	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcrpcclient"
)

var activeNet = testNet3Params

// params is used to group parameters for various networks such as the main
// network and test networks.
type params struct {
	*chaincfg.Params
	connect string
	port    string
}

// mainNetParams contains parameters specific to running btcgui and
// btcwallet on the main network (btcwire.MainNet).
var mainNetParams = params{
	Params:  &chaincfg.MainNetParams,
	connect: "localhost:8332",
	port:    "8332",
}

// testNet3Params contains parameters specific to running btcgui and
// btcwallet on the test network (version 3) (btcwire.TestNet3).
var testNet3Params = params{
	Params:  &chaincfg.TestNet3Params,
	connect: "localhost:18332",
	port:    "18332",
}

func setupRpcConn(cfg *config) (*btcrpcclient.Client, *btcrpcclient.ConnConfig, error) {

	certs, err := ioutil.ReadFile(cfg.CAFile)
	if err != nil {
		return nil, nil, err
	}

	rpcCfg := &btcrpcclient.ConnConfig{
		Host:                cfg.RPCConnect,
		User:                cfg.Username,
		Pass:                cfg.Password,
		Certificates:        certs,
		Endpoint:            "ws",
		DisableConnectOnNew: true,
	}

	rpcConn, err := btcrpcclient.New(rpcCfg, nil)
	if err != nil {
		return nil, nil, err
	}

	// Make a few attempts at connecting to the websocket.
	tries := 15
	err = rpcConn.Connect(tries)
	if err != nil {
		return nil, nil, err
	}

	return rpcConn, rpcCfg, nil
}
