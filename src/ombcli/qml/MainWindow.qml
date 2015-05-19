import QtQuick 2.2
import QtQuick.Controls 1.3
import QtQuick.Layouts 1.0
import QtQuick.Window 2.2

import QtQml.StateMachine 1.0 as DSM
import OmbExtensions 1.0
import "utils.js" as Utils

ApplicationWindow {
    id: root
    width: 1000
    height: 600
    minimumWidth: width
    minimumHeight: height
    maximumWidth: width
    maximumHeight: height
    title: "OmbudsCore Desktop Client"


    // NOTE depends on id: walletPane
    // utils.js defines the functions that unpack this go struct into javascript
    function updateWallet(walletdata) {
        Utils.updateWallet(walletdata);
    }

    function updateWalletAlert(msg) {
        Utils.updateWalletAlert(msg);
    }

    function sendWindow(board) {
        var component = Qt.createComponent("SendWindow.qml");
        var window = component.createObject(root);
        if (board !== "") {
            window.boardStr = board;
        }
        window.show();
    }

    AppFactory{
        id: appFact
    }


    CustToolBar {
        id: toolBar

        Image {
            source: "images/logoTest.png"
            fillMode: Image.PreserveAspectFit
            height: 25
            anchors { 
                verticalCenter: parent.verticalCenter
                left: parent.left
                leftMargin: 7
            }
            
        }

        RowLayout {
            anchors { 
                verticalCenter: parent.verticalCenter
                right: parent.right
                rightMargin: 7
            }

            Button {
                id: reloadBrowsePane
                text: "Reload"
                onClicked: {
                    browsePane.webView.reload();            
                }
            }

            Button {
                id: walletRevealBtn
                text: "Account"
                objectName: "setupWalletBtn"
                enabled: !walletPane.visible
                onClicked: {
                    walletPane.visible = true;
                }
            }

            
            Button {
                id: sendWinBtn
                text: "Reply"
                objectName: "sendBulletin"
                enabled: true // TODO use check unspent logic.
                onClicked: { 
                    var l = "http://localhost:1055/#/board/".length;
                    var angUrl = browsePane.webView.url.toString().slice(l);
                    sendWindow(angUrl);
                }
            }

            Button {
                id: newBtn
                text: "New"
                enabled: true
                onClicked: sendWindow("");
            }

        }
    }

    WalletPane {
        id: walletPane
        visible: false
    }

    BrowsePane {
        id: browsePane
        visible: true
        anchors{
            top: toolBar.bottom
            bottom: parent.bottom
            left: parent.left
            right: parent.right
        }
    }

    Rectangle {
        id: inactiveShadow
        anchors.fill: parent
        color: "white"
        opacity: 0.5

        visible: !Window.active

    }

}

