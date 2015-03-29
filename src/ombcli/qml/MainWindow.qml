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
    minimumWidth: 670
    minimumHeight: 510
    title: "OmbudsCore Desktop Client"


    // NOTE depends on id: walletPane
    // utils.js defines the functions that unpack this go struct into javascript
    function updateWallet(walletdata) {
        Utils.updateWallet(walletdata);
    }

    function sendWindow() {
        var component = Qt.createComponent("SendWindow.qml")    
        var window = component.createObject(root)
        window.show()
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
                enabled: false // TODO use check unspent logic.
                onClicked: sendWindow()
            }

            Button {
                id: newBtn
                text: "New"
                enabled: true
                onClicked: sendWindow()
            }

        }
    }

    WalletPane {
        id: walletPane
        visible: true
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
}

