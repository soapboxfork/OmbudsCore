import QtQuick 2.4

Item {
    visible: false
    property alias addrText: addrBox.text

    Text {
        id: head
        x: 0
        y: 0
        width: 250
        height: 31
        text: qsTr("Success!")
        font.bold: true
        font.pixelSize: 16 
    }

    Text {
        id: explain
        x: 0
        y: 40
        width: 380
        height: 80 
        text: qsTr("<html>This is your publishing address. We recommend using another system like <a href='https://keybase.io'>Keybase</a> or <a href='https://onename.io'>Onename</a> so that your digital self can claim ownership of this address:</html>")
        wrapMode: Text.WordWrap
        onLinkActivated: Qt.openUrlExternally(link)
    }

    SystemPalette { id: palette }

    Rectangle {
        id: lightBox
        color: palette.base
        anchors.top: explain.bottom
        height: 41
        width: 380
        border.color: "#c3c3c3"

        TextEdit {
            id: addrBox
            anchors.topMargin: 10
            anchors.top: parent.top
            width: parent.width
            horizontalAlignment: Text.AlignHCenter 
            text: ""
            font.bold: true
            font.pixelSize: 16 
            readOnly: true
            selectByMouse: true
        }
    }

}


