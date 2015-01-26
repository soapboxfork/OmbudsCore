import QtQuick 2.0
import QtQml.StateMachine 1.0
import QtQuick.Window 2.2
import QtQuick.Controls 1.3
import QtQuick.Controls.Styles 1.3
import OmbExtensions 1.0

Window {
    id: root
    visible: false
    minimumWidth: 400
    minimumHeight: 260
    color: palette.window

    signal success()

    SystemPalette { id: palette }
    SystemPalette { 
        id: disabledPalette 
        colorGroup: SystemPalette.Disabled
    }

    height: this.minimumHeight
    width: this.minimumWidth
    maximumWidth: this.minimumWidth
    maximumHeight: this.minimumHeight
    flags: Qt.Dialog

    property alias stateM: wizardStateMachine
    property bool done: false

    Component.onCompleted: startupFunction();

    function startupFunction() {
       stateM.running = true 
    }

    WalletPassphrase {
        id: wallPass
        secret: ""
    }

    Rectangle {
        id: marginRect
        anchors.topMargin: 10
        anchors.rightMargin: 10
        anchors.leftMargin: 10
        anchors.bottomMargin: 10
        anchors.fill: parent
        color: root.color

        Rectangle {
            id: sizingBox
            anchors.top: parent.top; anchors.left: parent.left
            height: 200
            color: root.color
            WarnPrompt { id: prompt }
            Passphrase { id: passPhrase }
            Reenter { 
                id: reenter
                walletPassphrase: wallPass 
            }
            AddressReveal { id: addrReveal }
        }

        Rectangle {
            id: lineSep
            height: 1
            color: "#c3c3c3"
            anchors.bottom: bottomRow.top
            anchors.bottomMargin: 10
            anchors.right: parent.right
            anchors.left: parent.left
        }

        Row {
            id: bottomRow
            layoutDirection: Qt.RightToLeft
            anchors.right: parent.right; anchors.bottom: parent.bottom

            Button {
                id: "forwardBtn"
                text: ""
            }

            Button {
                id: "backBtn"
                text: "Back"
            }
        }

    }

    StateMachine {
        // TODO This machine should also handle the case where someone wants to create a new wallet
        // over an existing one. This can be handled with another state prompting the destuction of the old 
        // wallet for a new one. 
        id: wizardStateMachine
        initialState: s1
        running: false
        objectName: "wizardStateMachine"

        State {
            id: s1

            SignalTransition {
                targetState: s2
                signal: forwardBtn.clicked
            }
            onEntered:  {
                root.visible = true
                backBtn.visible = false
                forwardBtn.text = "I Understand"
                prompt.visible = true
            }
            onExited: {
                prompt.visible = false
            }
        }
        State {
            id: s2

            SignalTransition {
                targetState: s3
                signal: forwardBtn.clicked
            }
            onEntered: {
                forwardBtn.text = "Continue"
                forwardBtn.enabled = false
                passPhrase.visible = true    
            }
            onExited: {
                passPhrase.visible = false
            }
        }

        State {
            id: s3

            SignalTransition {
                targetState: s2
                signal: backBtn.clicked
            }

            SignalTransition {
                targetState: s4
                signal: forwardBtn.clicked
            }

            onEntered: {
                forwardBtn.text = "Create Wallet"
                forwardBtn.enabled = false
                reenter.visible = true
                backBtn.visible = true
            }
            onExited: {
                reenter.visible = false
                backBtn.visible = false
            }
        }

        State {
            id: s4

            SignalTransition {
                targetState: s2
                signal: backBtn.clicked
            }

            SignalTransition {
                targetState: s5
                signal: forwardBtn.clicked
            }

            function handleCreateWallet() {
                var addr = wallPass.createWallet();
                if (addr === "") {
                    addrReveal.addrText = "Something went terribly wrong." 
                    explain.color = "red"
                    lightBox.visible = false
                } else {
                    addrReveal.addrText = addr
                }
            }

            onEntered: {
                forwardBtn.text = "Finish"
                forwardBtn.enabled = true
                backBtn.visible = false
                addrReveal.visible = true
                handleCreateWallet()

            }
            onExited: {
                addrReveal.visible = false
            }
        }

        FinalState {
            id: s5
        }

        onFinished: {
            root.visible = false
            root.done = true
            wizardStateMachine.running = false
            root.success()
        }
    }
}
