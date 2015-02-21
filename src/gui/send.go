package main

import (
	"encoding/json"
	"fmt"

	"github.com/btcsuite/btcd/btcjson"
	"github.com/btcsuite/btcrpcclient"
)

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
