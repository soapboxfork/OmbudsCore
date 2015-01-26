import QtQuick 2.0
import QtQuick.Controls 1.2
import OmbExtensions 1.0

Item {
    x: 0
    y: 0
    anchors.fill: parent
    visible: false
    property WalletPassphrase walletPassphrase 

    Text {
        id: text4
        width: 250
        text: qsTr("Step 3: Reenter your Passphrase")
        font.bold: true
        font.pixelSize: 16 
    }    

    Text {
        x: 0
        y: 40
        width: 380
        height: 63
        text: qsTr("Just to emphasize how important this passphrase is. Enter it one more time below. If you forget it you <b>will</b> lose bitcoin.")
        wrapMode: Text.WordWrap
    }

    Text {
        x: 0
        y: 135
        width: 77
        height: 18
        text: qsTr("Passphrase:")
        horizontalAlignment: Text.AlignRight
        font.bold: true
        font.pixelSize: 12
    }

    function cmp(textI, secret){
        if (textI.text != "") {
            if (textI.text === secret) {
                pwStatus.text = "You did it!"            
                pwStatus.color = "green"
                forwardBtn.enabled = true
            } else {
                pwStatus.text = "Passphrase does not match."
                pwStatus.color = "red"
            }
        }
    }

    TextField {
        id: textInput1
        x: 88
        y: 134
        width: 267
        height: 20
        font.pixelSize: 12
        echoMode: TextInput.Password
        onTextChanged: cmp(textInput1, walletPassphrase.secret)
    }

    Text {
        id: pwStatus
        anchors.top: textInput1.bottom
        anchors.left: textInput1.left
        anchors.topMargin: 5
    }

}

