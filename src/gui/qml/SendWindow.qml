import QtQuick 2.4
import QtQuick.Window 2.2
import QtQuick.Controls 1.3
import QtQuick.Layouts 1.0
import QtQuick.Controls.Styles 1.3

import QtQml.StateMachine 1.0 as DSM
import "utils.js" as Utils
import OmbExtensions 1.0

ApplicationWindow {
    id: sendWindow
    title: "New Bulletin"
    width: 400
    height: 500
    visible: true
    Component.onCompleted: startupFunction();
    minimumWidth: 350
    minimumHeight: 400

   
    function startupFunction() {
        lockState.running = true;        
        messageTextState.running = true;
    }

    Rectangle {
        color: "#ffffff"
        height: parent.height
        width: parent.width
    }


    CustToolBar {
        id: toolbarWrap
        
           RowLayout {
            Layout.row: 3
            Layout.columnSpan: 2
            Layout.fillWidth: true

            anchors {
                verticalCenter: parent.verticalCenter
                left: parent.left
                leftMargin: 7
            }

            Button {
                id: sendBtn
                text: "⬅"
                tooltip: "Broadcast the bulletin into the network."
                onClicked: {
                    var component = Qt.createComponent("SendStatus.qml")    
                    var window = component.createObject(sendWindow)
                    window.board = boardEdit.text
                    window.msg = messageEdit.text
                    window.topWin = sendWindow
                    window.show()
                }
            }

            Button {
                id: checkBtn
                text: "ⓒ"
                tooltip: "Check if the wallet can send this bulletin."
            }

            Button {
                id: lockBtn
                text: ""
                tooltip: "Lock board bulletin is sending to."
            }
        }
        
        RowLayout {
            anchors { 
                right: parent.right
                verticalCenter: parent.verticalCenter
                topMargin: 5
                rightMargin: 10
            }     
            ExclusiveGroup { id: tabPositionGroup }
            RadioButton {
                id: editBtn
                text: "Edit"
                checked: true
                exclusiveGroup: tabPositionGroup
                Layout.minimumWidth: 50
            }
            RadioButton {
                id: markdownBtn
                text: "Markdown"
                exclusiveGroup: tabPositionGroup
                Layout.minimumWidth: 50
            }
        }

    }

    Rectangle {
        id: marginRect
        height: 50
        anchors {
            topMargin: 10
            rightMargin: 10
            leftMargin: 10
            top: toolbarWrap.bottom
            left: parent.left 
            right: parent.right
        }
        color: "#ffffff"

        TextInput {
            id: boardEdit
            anchors.top: parent.top
            text: "Ombudsman Development News"
            font.bold: true
            font.pixelSize: 16 
            selectByMouse: true
            maximumLength: 30

            Rectangle {
                id: disableEdit
                visible: false
                radius: 4
                anchors.horizontalCenter: parent.horizontalCenter
                anchors.verticalCenter: parent.verticalCenter
                height: parent.height + 6
                width: parent.width + 6
                color: "#C9C9C9"
                opacity: 0.7
            }

            DSM.StateMachine {
                id: lockState
                initialState: normalBE

                DSM.State {
                    id: normalBE
                    DSM.SignalTransition {
                        targetState: lockedBE
                        signal: lockBtn.clicked
                    }
                    onEntered: {
                        disableEdit.visible = false
                        lockBtn.iconSource = "images/openlock.png"
                        lockBtn.tooltip = "Lock the board"
                        boardEdit.enabled = true
                    }
                }
                DSM.State {
                    id: lockedBE
                    DSM.SignalTransition {
                        targetState: normalBE
                        signal: lockBtn.clicked
                    }
                    onEntered: {
                        disableEdit.visible = true
                        lockBtn.iconSource = "images/closedlock.png"
                        lockBtn.tooltip = "Unlock the board"
                        boardEdit.enabled = false
                    }
                } 
            }

        }
        Timer {

            interval: 30000; running: true; repeat: true
            onTriggered: {
                authorLabel.text = Utils.formatAttrib(myAddress, new Date())
            }
        }

        Label {
            id: authorLabel
            anchors.top: boardEdit.bottom
            anchors.topMargin: 10
            anchors.bottomMargin: 5
            text: Utils.formatAttrib(myAddress, new Date())
            font.pixelSize: 12
            color: "#888888"
        } 

    }

    Rectangle {
        id: lineSeperator
        anchors.top: messageEdit.top
        anchors.horizontalCenter: parent.horizontalCenter
        width: parent.width
        height: 1
        color: "#888888"
    }

    DSM.StateMachine {
        id: messageTextState
        initialState: rawTA
        DSM.State {
            id: rawTA
            DSM.SignalTransition {
                targetState: markdownT
                signal: markdownBtn.clicked
            }
            onEntered: {
                messageEdit.visible = true
            }
            onExited: {
                messageEdit.visible = false
            }
        }
        DSM.State {
            id: markdownT
            DSM.SignalTransition {
                targetState: rawTA
                signal: editBtn.clicked
            }
            onEntered: {
                markdownArea.text = mdconv.getHtml(messageEdit.text)
                markdownArea.visible = true
                messageEdit.visible = false
            }
            onExited: {
                markdownArea.visible = false
            }
        }
    }

    ScrollView {
        width: parent.width;
        height: parent.height;
        horizontalScrollBarPolicy: Qt.ScrollBarAlwaysOff
        anchors{
            top: marginRect.bottom
            // Leads to an overlap where line should be.
            topMargin: 17
            bottom: parent.bottom
            right: parent.right
            left: parent.left
            leftMargin: 15
        }
        Text {
            id: markdownArea
            width: sendWindow.width - 20
            text: ""
            wrapMode: Text.Wrap

            MarkdownText {
                id: mdconv
            }
        }
    }

    TextArea {
        id: messageEdit
        width: parent.width;
        height: parent.height;
        anchors{
            top: marginRect.bottom
            bottom: parent.bottom
            right: parent.right
            left: parent.left
            leftMargin: 10
            topMargin: 10
        }

        text: "Hello friends"
        wrapMode: Text.Wrap
        font.family: "Monaco [monospace]"
        selectByMouse: true
        
        Rectangle {
            id: leftlinecover
            color: "#ffffff"
            width: 2 
            anchors{
                top: parent.top 
                topMargin: 1
                left: parent.left
                bottom: parent.bottom 
                bottomMargin: 1
            }
        }

    }

    statusBar: StatusBar {
        RowLayout {
            anchors.fill: parent
            Label {
                id: numCredits
                color: "green"
                text: "10"
            }
            Label { 
                text: "Credits"
            }
        }
    }
}

