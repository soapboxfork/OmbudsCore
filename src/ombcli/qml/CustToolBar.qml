import QtQuick 2.4
import QtQuick.Layouts 1.0

Rectangle{
    id: root
    height: 35
    width: parent.width
    anchors {
        top: parent.top
        left: parent.left
        right: parent.right
    }
    gradient: Gradient {
        GradientStop { position: 0.0; color: "#EAEAEA" }
        GradientStop { position: 1.0; color: "#DEDEDE" }
    }

    Rectangle {
        width: parent.width
        height: .5
        anchors.top: parent.top
        color: "#FFFFFF"
    }

    Rectangle {
        width: parent.width
        height: .5
        anchors.bottom: parent.bottom
        color: "#7A7A7A"
    }



}
