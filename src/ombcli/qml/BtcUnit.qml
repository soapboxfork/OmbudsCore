import QtQuick 2.4

Item {
    property alias text: val.text
    property alias lbl: lbl.text
    width: 150
    height: 30

    Text {
        id: val
        text: "0.000"
        font { bold: true; pixelSize: 24 }
    }

    Text {
        id: balanceUnit
        anchors {
            left: val.right
            leftMargin: 8 
            bottom: val.bottom
        }

        text: "mBTC"
        color: "gray"
        font { bold: true; pixelSize: 15 }
    }
    Text {
        id: lbl
        anchors { top: val.bottom; }
    }
}
