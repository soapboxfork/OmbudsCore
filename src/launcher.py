#!/usr/bin/python

import os, random, subprocess, sys, string, signal
from syslog import syslog, LOG_ERR
from os.path import abspath, expanduser

DEPLOY = False
OSX = True

BIN = os.path.join(expanduser("~"), "go/bin")

# System params for an OSX app
# TODO rename file
if OSX and DEPLOY:
    APP_PATH = abspath(os.path.join(__file__, "./../../.."))
    BIN = os.path.join(APP_PATH, "Contents/MacOS")

APP_DIR = os.path.join(expanduser("~"), "Library/Application Support/Ombudscore")
NODE_CFG = os.path.join(APP_DIR, "node.conf")
NODE_DIR = os.path.join(APP_DIR, "node")
WAL_CFG = os.path.join(APP_DIR, "wallet.conf")
WAL_DIR = os.path.join(APP_DIR, "wallet")


def main():
    syslog(LOG_ERR, "Starting OmbudsCore")
    # Assert/do some system config
    if not os.path.isdir(APP_DIR):
        os.mkdir(APP_DIR)
        make_conf() 
    else:
        make_conf()

    null = open(os.devnull, "w")

    # Start ombnode
    opts = ["--testnet" ]
    cmd = [BIN+"/ombfullnode"] + opts
    print cmd
    nodeproc = subprocess.Popen(cmd, stdout=null)

    # Start ombwallet
    opts = []
    cmd = [BIN+"/ombwallet"] + opts
    print cmd
    walletproc = subprocess.Popen(cmd, stdout=null)


    # Register signal handler for SIGINTs
    signal.signal(signal.SIGINT, sig_handler([nodeproc, walletproc]))

    # Start ombuds client gui and blocks until process returns.
    cmd = ["./ombcli/ombcli"]
    print cmd
    print "WARNING fix this path"
    subprocess.call(cmd, stdout=null)

    nodeproc.kill()
    walletproc.kill()

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
