import QtQuick 2.0

Rectangle {
    anchors.fill: parent
    visible: false
    width: parent.width
    height: parent.height
    Text {
        id: head
        x: 0
        y: 0
        width: 250
        height: 31
        text: qsTr("Step 1: Read the Prompt")
        font.bold: true
        font.pixelSize: 16 
    }
    Text {
        anchors.topMargin: 10;
        //anchors.top: head.bottom; anchors.left: parent.left
        x: 0
        y: 40
        width: 380
        height: 180
        text:  qsTr("This wizard will set up an address which you can send bulletins from using Ombudsman. You will be asked to provide a wallet passphrase to protect your private key. You will also need to send bitcoin to that address so that your bulletins are accepted by the network. So to send a bulletin you need three things: an internet connection, a wallet password (used only for your sending address) and spendable bitcoin at that address. All of the hard stuff is handled through this interface.")
        wrapMode: Text.Wrap
    }
} 


