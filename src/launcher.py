#!/usr/bin/python

import os, random, subprocess, sys, string, signal, time
from syslog import syslog, LOG_ERR
from os.path import abspath, expanduser


def appDataDir(appname):
    '''For OSX the app data dir is located in /Library/App...
    This is a break from the convention to allow for an easier install.
    '''
    if sys.platform == "darwin":
        datadir = os.path.join("/", "Library", "Application Support")
        return os.path.join(datadir, appname.capitalize())

    if sys.platform == "windows":
        print "Windows is unsupported"
        return os.path.join(home, appname)

    if appname.startswith("."):
        appname = appname[1:]
    hiddendir = "." + appname.lower()
    # Return the default app directory
    return os.path.join(home, hiddendir)


# NOTICE: A cheap hack and very dangerous.
APP_PATH = abspath(os.path.join(__file__, "./../../.."))
BIN = os.path.join(APP_PATH, "Contents", "MacOS")
RES = os.path.join(APP_PATH, "Contents", "Resources")

APP_DIR = appDataDir("ombudscore")
APP_LOG = os.path.join(APP_DIR, "app.log")
NODE_DIR = os.path.join(APP_DIR, "node")
NODE_CFG = os.path.join(NODE_DIR, "node.conf")
WAL_DIR = os.path.join(APP_DIR, "wallet")
WAL_CFG = os.path.join(WAL_DIR, "wallet.conf")
GUI_DIR = os.path.join(APP_DIR, "gui")
GUI_CFG = os.path.join(GUI_DIR, "gui.conf")
CTL_DIR = os.path.join(APP_DIR, "ctl")
CTL_CFG = os.path.join(CTL_DIR, "ctl.conf")

def run_ombappserv(out):
    static_path = os.path.join(RES, "frontend")
    opts = ["--staticpath=" + static_path]
    cmd = [os.path.join(BIN, "ombappserv")] + opts

    #print cmd
    return subprocess.Popen(cmd, stdout=out, stderr=subprocess.STDOUT)
    
def run_ombwallet(out):
    opts = ["--debuglevel=warn"]
    cmd = [os.path.join(BIN, "ombwallet")] + opts

    #print cmd
    return subprocess.Popen(cmd, stdout=out, stderr=subprocess.STDOUT)

def run_ombfullnode(out):
    opts = ["--debuglevel=warn"]
    cmd = [os.path.join(BIN, "ombfullnode")] + opts

    #print cmd
    return subprocess.Popen(cmd, stdout=out, stderr=subprocess.STDOUT)

def run_electroncli(out):
    # TODO remove default_app from atom
    js_path = os.path.join(RES, "app", "main.js")
    opts = [js_path]
    cmd = [os.path.join(BIN, "Electron")] + opts

    subprocess.call(cmd, stdout=out, stderr=subprocess.STDOUT)


def main():
    syslog(LOG_ERR, "Starting OmbudsCore")
    # Assert/do some system config
    idempotent_conf()
    
    #null = open(os.devnull, "w")
    log = open(APP_LOG, "a")
    #log = sys.stdout

    # Start ombnode
    nodeproc = run_ombfullnode(log)

    time.sleep(3)

    # Start ombwallet
    walletproc = run_ombwallet(log)

    time.sleep(3)

    # Start ombappserv
    webservproc = run_ombappserv(log)

    # Register signal handler for SIGINTs
    signal.signal(signal.SIGINT, sig_handler([nodeproc, walletproc]))

    # Start ombuds client gui and block until process returns.
    run_electroncli(log)

    # After the electron cli is stopped, stop everything else.
    webservproc.kill()
    walletproc.kill()
    nodeproc.kill()

    log.close()
    syslog(LOG_ERR, "All subprocesses successfully stopped. Bailing out.")

def try_mkdir(path):
    if not os.path.isdir(path): os.mkdir(path)

# Utility functions
def idempotent_conf():

    if not os.path.isdir(APP_DIR):
        os.mkdir(APP_DIR)

    try_mkdir(WAL_DIR)
    try_mkdir(NODE_DIR)
    try_mkdir(GUI_DIR)
    try_mkdir(CTL_DIR)

    # try to make the config file too
    make_conf()




def make_conf():
    '''
    Creates rpc parameters for the wallet and the node to use. Depends on APP_DIR,
    NODE_CFG, WAL_CFG
    '''
    uname, pw = generate_secrets(70)

    # Configure the wallet
    if not os.path.exists(WAL_CFG): 
        r = "" +\
        "[Application Options]\n" +\
        "username={0}\n"+\
        "password={1}\n"
        with open(WAL_CFG, 'w') as f:
            f.write(r.format(uname, pw))

    # Configure the gui
    if not os.path.exists(GUI_CFG):
        r = "" +\
        "[Application Options]\n" +\
        "username={0}\n"+\
        "password={1}\n"
        with open(GUI_CFG, 'w') as f:
            f.write(r.format(uname, pw))

    # Configure the node
    if not os.path.exists(NODE_CFG):
        r = "" +\
        "[Application Options]\n" +\
        "rpcuser={0}\n"+\
        "rpcpass={1}\n"+\
        "testnet=1\n"
        
        with open(NODE_CFG, "w") as f:
            f.write(r.format(uname, pw))

    # Configure the command line tool
    if not os.path.exists(CTL_CFG):
        r = "" +\
        "[Application Options]\n" +\
        "rpcuser={0}\n"+\
        "rpcpass={1}\n"+\
        "testnet=1\n"
        
        with open(CTL_CFG, "w") as f:
            f.write(r.format(uname, pw))




def generate_secrets(l):
    secret = ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in xrange(l))
    return "rpcuser", secret

def sig_handler(procs):
    '''
    Kills all of the subprocesses passed in before responding to the signal
    '''
    def handler(signal, frame):
        for proc in procs:
            proc.kill()
        sys.exit(0)
    return handler

if __name__ == '__main__':
    main()

