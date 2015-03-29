import QtQuick 2.4

Rectangle {
    id: addrBox
    anchors.horizontalCenter: parent.horizontalCenter
    radius: 3
    height: 55
    width: 190
    color: "#DDDDDD"
    
    TextEdit {
        id: addrEdit
        text: appFact.ctrl().addressStr()
        anchors { 
            fill: parent   
            margins: 11
        }
        readOnly: true
        font { bold: true; pixelSize: 16
            family: "Courier"
        }
        wrapMode: TextEdit.WrapAnywhere
    }
    MouseArea {
        anchors.fill: parent
        property var selected: false
        onClicked: {
            if (!selected) {
                addrEdit.selectAll();
            } else {
                addrEdit.deselect();
            }
            selected = !selected
        }
    }
}
