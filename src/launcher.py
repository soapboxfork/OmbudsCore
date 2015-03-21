#!/usr/bin/python

import os, random, subprocess, sys, string, signal
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
    


# APP_PATH = abspath(os.path.join(__file__, "./../../.."))
# BIN = os.path.join(APP_PATH, "Contents/MacOS")

GO_PATH = os.environ.get("GOPATH")
BIN = os.path.join(GO_PATH, "bin")
APP_DIR = appDataDir("ombudscore")
NODE_CFG = os.path.join(APP_DIR, "node.conf")
NODE_DIR = os.path.join(APP_DIR, "node")
WAL_CFG = os.path.join(APP_DIR, "wallet.conf")
WAL_DIR = os.path.join(APP_DIR, "wallet")

def run_webapp(stdout):
    static_path = os.path.join(GO_PATH, "src","github.com","NSkelsey","ahimsarest","ombwebapp")
    opts = ["-staticpath", static_path]
    cmd = [BIN+"/ombwebapp"] + opts
    print cmd
    return subprocess.Popen(cmd, stdout=stdout)
    
def run_ombwallet(stdout):
    opts = []
    cmd = [BIN+"/ombwallet"] + opts
    print cmd
    return subprocess.Popen(cmd, stdout=stdout)

def run_ombfullnode(stdout):
    opts = ["--testnet" ]
    cmd = [BIN+"/ombfullnode"] + opts
    print cmd
    return subprocess.Popen(cmd, stdout=stdout)



def main():
    syslog(LOG_ERR, "Starting OmbudsCore")
    # Assert/do some system config
    if not os.path.isdir(APP_DIR):
        os.mkdir(APP_DIR)
        make_conf() 
    else:
        make_conf()

    null = open(os.devnull, "w")
    null = sys.stdout

    # Start ombnode
    nodeproc = run_ombfullnode(null)

    # Start ombwallet
    walletproc = run_ombwallet(null)

    # Start ahimsarest
    webservproc = run_webapp(null)

    # Register signal handler for SIGINTs
    signal.signal(signal.SIGINT, sig_handler([nodeproc, walletproc]))

    # Start ombuds client gui and block until process returns.
    # TODO change bin path
    cmd = ["./ombcli/ombcli"]
    print cmd
    print "WARNING fix this path"
    subprocess.call(cmd, stdout=null)

    webservproc.kill()
    walletproc.kill()
    nodeproc.kill()

    null.close()
    syslog(LOG_ERR, "All subprocesses successfully started. Bailing out.")


# Utility functions

def make_conf():
    '''
    Creates rpc parameters for the wallet and the node to use. Depends on APP_DIR,
    NODE_CFG, WAL_CFG
    '''
    uname, pw = generate_secrets(70)

    # Configure the wallet
    if os.path.exists(WAL_CFG): 
        os.remove(WAL_CFG)
    r = '''
[Application Options]
username={0}
password={1}
    '''.format(uname, pw)

    with open(WAL_CFG, 'w') as f:
        f.write(r)

    # Configure the node
    if os.path.exists(NODE_CFG):
        os.remove(NODE_CFG)

    r = '''
[Application Options]
rpcuser={0}
rpcpass={1}
    '''.format(uname, pw)

    with open(NODE_CFG, "w") as f:
        f.write(r)


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

