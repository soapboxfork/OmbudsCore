import QtQuick 2.0
import QtQuick.Controls 1.2

Item {
    x: 0
    y: 0
    anchors.fill: parent
    visible: false

    Text {
        id: text4
        width: 250
        text: qsTr("Step 2: Pick a Passphrase")
        font.bold: true
        font.pixelSize: 16 
    }

    Text {
        id: text3
        x: 0
        y: 40
        width: 380
        height: 63
        text: qsTr("Enter a passphrase for a new Bitcoin wallet. This passphrase keeps your Bitcoin address under your control. Every time that you publish a bulletin you will be asked to provide this secret. It is crucial that you keep it secret.")
        wrapMode: Text.WordWrap
    }

    function cmp(textI, textI2, btn) {
        if (textI.text != "") {
            if (textI.text === textI2.text) {
                if (textI.text.length > 5) {
                    pwStatus.text = "Passphrases match!"            
                    pwStatus.color = "green"
                    wallPass.secret = textI.text
                    btn.enabled = true
                } else {
                    pwStatus.text = "Passphrase is too short."
                    pwStatus.color = "red"
                    btn.enabled = false
                }
            } else {
                pwStatus.text = "Passphrases do not match."
                pwStatus.color = "red"
                btn.enabled = false
            }
        }
    }

    TextField {
        id: textInput2
        x: 88
        y: 156
        width: 267
        height: 20
        font.pixelSize: 12
        echoMode: TextInput.Password
        onTextChanged: cmp(textInput1, textInput2, forwardBtn)
    }

    TextField {
        id: textInput1
        x: 88
        y: 134
        width: 267
        height: 20
        font.pixelSize: 12
        echoMode: TextInput.Password
        onTextChanged: cmp(textInput2, textInput1, forwardBtn)
    }

    Text {
        id: text2
        x: 0
        y: 157
        width: 77
        height: 18
        text: qsTr("Reenter:")
        horizontalAlignment: Text.AlignRight
        font.pixelSize: 12
        font.bold: true
    }

    Text {
        id: text1
        x: 0
        y: 135
        width: 77
        height: 18
        text: qsTr("Passphrase:")
        horizontalAlignment: Text.AlignRight
        font.bold: true
        font.pixelSize: 12
    }

    Text {
        id: pwStatus
        anchors.top: textInput2.bottom
        anchors.left: textInput2.left
        anchors.topMargin: 5
    }
}
