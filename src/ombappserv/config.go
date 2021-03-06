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
	"fmt"
	"log"
	"net"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/btcsuite/go-flags"
	"github.com/soapboxsys/ombudslib/ombutil"
)

const (
	// NOTE change tool tips if any of these are modified.
	defaultCAFilename     = "rpc.cert"
	defaultConfigFilename = "gui.conf"
	// NOTE HTTP not https!
	defaultWebAppHost = "localhost:1055"
	defaultStaticPath = "../frontend"
)

var (
	ombudsHomeDir     = ombutil.AppDataDir("ombudscore", false)
	guiHomeDir        = filepath.Join(ombudsHomeDir, "gui")
	defaultDataDir    = guiHomeDir
	btcwalletDir      = filepath.Join(ombudsHomeDir, "wallet")
	defaultCAFile     = filepath.Join(ombudsHomeDir, defaultCAFilename)
	defaultConfigFile = filepath.Join(guiHomeDir, defaultConfigFilename)
	nodedir           = filepath.Join(ombudsHomeDir, "node")
	defaultDBPath     = filepath.Join(nodedir, "pubrecord.db")
)

type config struct {
	ShowVersion bool   `short:"V" long:"version" description:"Display version information and exit"`
	CAFile      string `long:"cafile" description:"File containing root certificates to authenticate a TLS connections with btcwallet"`
	RPCConnect  string `short:"c" long:"rpcconnect" description:"Hostname/IP and port of btcwallet RPC server to connect to (default localhost:18332, mainnet: localhost:8332)"`
	ConfigFile  string `short:"C" long:"configfile" description:"Path to configuration file"`
	Username    string `short:"u" long:"username" description:"Username for btcwallet authorization"`
	Password    string `short:"P" long:"password" description:"Password for btcwallet authorization"`
	MainNet     bool   `long:"mainnet" description:"Use the main Bitcoin network (default testnet3)"`
	WebAppHost  string `long:"host" description:"The hostname of the backend supplying data to use (default localhost:1055)"`
	StaticPath  string `long:"staticpath" description:"The path to the static files for the web app to host (default ../frontend)"`
	DataDirPath string `long:"datadir" description:"The path to the data directory to use"`
	Verbose     bool   `long:"verbose" description:"Log every request as they come in."`
	DBPath      string `long:"dbpath" description:"The path to the DB."`
}

// cleanAndExpandPath expands environement variables and leading ~ in the
// passed path, cleans the result, and returns it.
func cleanAndExpandPath(path string) string {
	// Expand initial ~ to OS specific home directory.
	if strings.HasPrefix(path, "~") {
		homeDir := filepath.Dir(ombudsHomeDir)
		path = strings.Replace(path, "~", homeDir, 1)
	}

	// NOTE: The os.ExpandEnv doesn't work with Windows-style %VARIABLE%,
	// but they variables can still be expanded via POSIX-style $VARIABLE.
	return filepath.Clean(os.ExpandEnv(path))
}

// removeDuplicateAddresses returns a new slice with all duplicate entries in
// addrs removed.
func removeDuplicateAddresses(addrs []string) []string {
	result := make([]string, 0)
	seen := map[string]bool{}
	for _, val := range addrs {
		if _, ok := seen[val]; !ok {
			result = append(result, val)
			seen[val] = true
		}
	}
	return result
}

// normalizeAddresses returns a new slice with all the passed peer addresses
// normalized with the given default port, and all duplicates removed.
func normalizeAddresses(addrs []string, defaultPort string) []string {
	for i, addr := range addrs {
		addrs[i] = normalizeAddress(addr, defaultPort)
	}

	return removeDuplicateAddresses(addrs)
}

// filesExists reports whether the named file or directory exists.
func fileExists(name string) bool {
	if _, err := os.Stat(name); err != nil {
		if os.IsNotExist(err) {
			return false
		}
	}
	return true
}

// normalizeAddress returns addr with the passed default port appended if
// there is not already a port specified.
func normalizeAddress(addr, defaultPort string) string {
	_, _, err := net.SplitHostPort(addr)
	if err != nil {
		return net.JoinHostPort(addr, defaultPort)
	}
	return addr
}

// loadConfig initializes and parses the config using a config file and command
// line options.
//
// The configuration proceeds as follows:
//      1) Start with a default config with sane settings
//      2) Pre-parse the command line to check for an alternative config file
//      3) Load configuration file overwriting defaults with any specified options
//      4) Parse CLI options and overwrite/add any specified options
//
// The above results in btcgui functioning properly without any config
// settings while still allowing the user to override settings with config files
// and command line options.  Command line options always take precedence.
func loadConfig() (*config, []string, error) {
	// Default config.
	cfg := config{
		ConfigFile: defaultConfigFile,
	}

	// A config file in the current directory takes precedence.
	if fileExists(defaultConfigFilename) {
		cfg.ConfigFile = defaultConfigFile
	}

	// Pre-parse the command line options to see if an alternative config
	// file or the version flag was specified.
	preCfg := cfg
	preParser := flags.NewParser(&preCfg, flags.Default)
	_, err := preParser.Parse()
	if err != nil {
		if e, ok := err.(*flags.Error); !ok || e.Type != flags.ErrHelp {
			preParser.WriteHelp(os.Stderr)
		}
		return nil, nil, err
	}

	// Load additional config from file.
	var configFileError error
	parser := flags.NewParser(&cfg, flags.Default)
	err = flags.NewIniParser(parser).ParseFile(preCfg.ConfigFile)
	if err != nil {
		if _, ok := err.(*os.PathError); !ok {
			fmt.Fprintln(os.Stderr, err)
			parser.WriteHelp(os.Stderr)
			return nil, nil, err
		}
		configFileError = err
	}

	// Parse command line options again to ensure they take precedence.
	remainingArgs, err := parser.Parse()
	if err != nil {
		if e, ok := err.(*flags.Error); !ok || e.Type != flags.ErrHelp {
			parser.WriteHelp(os.Stderr)
		}
		return nil, nil, err
	}

	err = os.MkdirAll(guiHomeDir, 0700)
	if err != nil {
		log.Printf("[WARN] %v", err)
	}

	// Warn about missing config file after the final command line parse
	// succeeds.  This prevents the warning on help messages and invalid
	// options.
	if configFileError != nil {
		log.Printf("[WARN] %v", configFileError)
	}

	// Multiple networks can't be selected simultaneously.
	numNets := 0
	if cfg.MainNet {
		numNets++
	}
	if numNets > 1 {
		str := "%s: The mainnet and simnet params can't be used " +
			"together -- choose one"
		err := fmt.Errorf(str, "loadConfig")
		fmt.Fprintln(os.Stderr, err)
		parser.WriteHelp(os.Stderr)
		return nil, nil, err
	}

	// Choose the active network params based on the mainnet net flag.
	switch {
	case cfg.MainNet:
		activeNet = mainNetParams
	}

	if cfg.RPCConnect == "" {
		cfg.RPCConnect = activeNet.connect
	}

	if cfg.WebAppHost == "" {
		cfg.WebAppHost = defaultWebAppHost
	}

	// Check to see if the url is sane and throw an error if it is not localhost
	matches, _ := regexp.Match(`^localhost\:\d*$`, []byte(cfg.WebAppHost))
	if !matches {
		err = fmt.Errorf("WebAppHost specifies a route off of the machine: %s", cfg.WebAppHost)
		return nil, nil, err
	}

	if cfg.StaticPath == "" {
		cfg.StaticPath = defaultStaticPath
	}

	if !fileExists(cfg.StaticPath) {
		return nil, nil, fmt.Errorf("The static file [%s] path does not exist", cfg.StaticPath)
	}

	if cfg.DataDirPath == "" {
		cfg.DataDirPath = defaultDataDir
	}

	if !fileExists(cfg.DataDirPath) {
		return nil, nil, fmt.Errorf("The data dir [%s] does not exist", cfg.DataDirPath)
	}

	if cfg.DBPath == "" {
		cfg.DBPath = defaultDBPath
	}

	if !fileExists(cfg.DBPath) {
		return nil, nil, fmt.Errorf("The DBPath [%s] does not exist", cfg.DBPath)
	}

	// If CAFile is unset, choose either the copy or local btcd cert.
	if cfg.CAFile == "" {
		cfg.CAFile = defaultCAFile

	}

	// Add default port to connect flag if missing.
	cfg.RPCConnect = normalizeAddress(cfg.RPCConnect, activeNet.port)

	// Expand environment variables and leading ~ for filepaths.
	cfg.CAFile = cleanAndExpandPath(cfg.CAFile)

	return &cfg, remainingArgs, nil

}
