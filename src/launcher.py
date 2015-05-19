#!/usr/bin/python

import os, random, subprocess, sys, string, signal, time
from syslog import syslog, LOG_ERR
from os.path import abspath, expanduser


def appDataDir(appname):
    home = expanduser("~")
    if sys.platform == "darwin":
        datadir = os.path.join(home, "Library", "Application Support")
        return os.path.join(datadir, appname.capitalize())

    if sys.platform == "windows":
        print "Windows is unsupported"
        return os.path.join(home, appname)

    if appname.startswith("."):
        appname = appname[1:]
    hiddendir = "." + appname.lower()
    # Return the default app directory
    return os.path.join(home, hiddendir)
    


APP_PATH = abspath(os.path.join(__file__, "./../../.."))
BIN = os.path.join(APP_PATH, "Contents", "MacOS")
RES = os.path.join(APP_PATH, "Contents", "Resources")

GO_PATH = os.environ.get("GOPATH")
APP_DIR = appDataDir("ombudscore")
NODE_DIR = os.path.join(APP_DIR, "node")
NODE_CFG = os.path.join(NODE_DIR, "node.conf")
WAL_DIR = os.path.join(APP_DIR, "wallet")
WAL_CFG = os.path.join(WAL_DIR, "wallet.conf")
GUI_DIR = os.path.join(APP_DIR, "gui")
GUI_CFG = os.path.join(GUI_DIR, "gui.conf")
CTL_DIR = os.path.join(APP_DIR, "ctl")
CTL_CFG = os.path.join(CTL_DIR, "ctl.conf")

def run_webapp(stdout):
    #static_path = os.path.join(GO_PATH, "src","github.com","NSkelsey","ahimsarest","ombwebapp")
    static_path = os.path.join(RES, "webapp")
    opts = ["-staticpath=" + static_path]
    cmd = [os.path.join(BIN, "ombwebapp")] + opts

    #print cmd
    return subprocess.Popen(cmd, stdout=stdout)
    
def run_ombwallet(stdout):
    opts = ["--debuglevel=warn"]
    cmd = [os.path.join(BIN, "ombwallet")] + opts

    #print cmd
    return subprocess.Popen(cmd, stdout=stdout)

def run_ombfullnode(stdout):
    opts = ["--debuglevel=warn"]
    cmd = [os.path.join(BIN, "ombfullnode")] + opts

    #print cmd
    return subprocess.Popen(cmd, stdout=stdout)

def run_ombcli(stdout):
    cmd = [os.path.join(BIN, "ombcli")]

    subprocess.call(cmd, stdout=stdout)


def main():
    syslog(LOG_ERR, "Starting OmbudsCore")
    # Assert/do some system config
    idempotent_conf()
    
    null = open(os.devnull, "w")
    null = sys.stdout

    # Start ombnode
    nodeproc = run_ombfullnode(null)

    time.sleep(3)

    # Start ahimsarest
    webservproc = run_webapp(null)

    time.sleep(3)

    # Start ombwallet
    walletproc = run_ombwallet(null)

    # Register signal handler for SIGINTs
    signal.signal(signal.SIGINT, sig_handler([nodeproc, walletproc]))

    # Start ombuds client gui and block until process returns.
    run_ombcli(null)

    webservproc.kill()
    walletproc.kill()
    nodeproc.kill()

    null.close()
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

