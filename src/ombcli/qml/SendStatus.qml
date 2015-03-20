import QtQuick 2.4
import QtQuick.Window 2.2
import QtQuick.Controls 1.2
import QtQuick.Layouts 1.1
import OmbExtensions 1.0

Window {
    id: sendStatusWin

    property ApplicationWindow topWin 

    flags: Qt.Sheet
    width: 350
    height: 175
    color: "#DDDDDD"

    // Values to hand off to go for sending
    property string board
    property string msg

    // Variables set after the bulletinReq returns
    property bool worked
    property string resultMsg

    // Handles the conversation with go
    BulletinReq { id: bltnReq }

    Rectangle {
        id: margins
        color: "#DDDDDD"
        anchors {
            fill: parent
            topMargin: 10
            bottomMargin: 10
            leftMargin: 10
            rightMargin: 10
        }
        Item {
            id: warningPane
            anchors.fill: parent
            width: parent.width
            height: parent.height

            Image {
                id: warn
                source: "images/warning.png"
            }

            Text {
                text: "Careful!"
                anchors {
                    left: warn.right
                    leftMargin: 10
                    verticalCenter: warn.verticalCenter
                }
                font { bold: true; pixelSize: 16 }
            }    
            Text {
                id: prompt
                anchors { 
                    top: warn.bottom
                    topMargin: 5
                    right: parent.right 
                    left: parent.left
                }
                text: "Once stored in the network this bulletin will be immutable. There is no edit button once it's posted. Are you sure you don't want to read it over one more time before sending it?"
                wrapMode: Text.WordWrap
            }

            RowLayout{
                anchors {
                    topMargin: 10
                    bottom: parent.bottom
                    left: parent.left
                    right: parent.right
                }
                Button {
                    id: cancel
                    text: "Cancel"
                    KeyNavigation.tab: pass
                    onClicked: {
                        pass.text = ""
                        sendBtn.enabled = false
                        sendStatusWin.close()
                    }
                }
                TextField {
                    id: pass
                    KeyNavigation.tab: sendBtn
                    Layout.fillWidth: true
                    echoMode: TextInput.Password 
                    placeholderText: "Enter Passphrase"
                    onTextChanged: sendBtn.enabled = true
                }
                Button {
                    id: sendBtn
                    KeyNavigation.tab: cancel
                    text: "Send"
                    enabled: false
                    onClicked: {
                       warningPane.visible = false 
                       resultPane.visible = true
                       info.text = "Creating the bulletin."
                       // Send bulletin
                       var arr = bltnReq.send(
                           pass.text, 
                           sendStatusWin.board, 
                           sendStatusWin.msg
                       )  
                       sendStatusWin.worked = arr[0];
                       sendStatusWin.resultMsg = arr[1];
                     
                       // Wait 5 seconds, then reveal results
                       waitTime.running = true
                    }
                }

                Timer {
                    id: waitTime
                    interval: 5000;
                    onTriggered: {
                       if (sendStatusWin.worked === true) {
                           closeBtn.visible = true 
                           resultText.text = "Success!"
                           waitingImg.visible = false
                           successImg.visible = true
                           info.text = "The bulletin was submitted to the network."
                       } else {
                           resultText.text = "Failure"
                           waitingImg.visible = false
                           failureImg.visible = true
                           info.color = "red"
                           info.text = sendStatusWin.resultMsg
                           resetBtn.visible = true
                       }
                    }
                }
           } 
       }
      Item {
            visible: false
            id: resultPane
            anchors.fill: parent

            Text {
                id: resultText
                anchors { 
                    horizontalCenter: parent.horizontalCenter
                    top: parent.top
                    topMargin: 15
                }
                font { bold: true; pixelSize: 16 }
                text: "Sending"
            }

            AnimatedImage {
                // There are several images with the same dimensions below
                id: waitingImg
                anchors {
                    horizontalCenter: parent.horizontalCenter
                    top: resultText.bottom
                    topMargin: 10
                }
                width: 48
                height: 48
                source: "images/loading.gif"
                fillMode: Image.PreserveAspectFit
            }

            Image {
                id: successImg
                anchors {
                    horizontalCenter: parent.horizontalCenter
                    top: resultText.bottom
                    topMargin: 10
                }
                visible: false
                width: 48
                height: 48
                fillMode: Image.PreserveAspectFit
                source: "images/success.png"
            }
            Image {
                id: failureImg
                anchors {
                    horizontalCenter: parent.horizontalCenter
                    top: resultText.bottom
                    topMargin: 10
                }
                visible: false
                width: 48
                height: 48
                fillMode: Image.PreserveAspectFit
                source: "images/failure.png"
            }

            Text {
                id: info
                anchors {
                    top: successImg.bottom
                    horizontalCenter: parent.horizontalCenter
                    topMargin: 10
                }
            }

            Button {
                id: closeBtn
                visible: false
                text: "Close"
                onClicked: {
                    topWin.close()
                }
                anchors { bottom: parent.bottom; right: parent.right }
            }

            Button {
                id: resetBtn
                visible: false
                text: "Cancel"
                // Must reset this series of windows for another attempt
                onClicked: {
                    resetBtn.visible = false
                    failureImg.visible = false
                    waitingImg.visible = true
                    resultPane.visible = false
                    warningPane.visible = true
                    pass.text = ""
                    sendBtn.enabled = false
                    sendStatusWin.visible = false
                }
                anchors { bottom: parent.bottom; right: parent.right }
            }
       }
    
    }
}


