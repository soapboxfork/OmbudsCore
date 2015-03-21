import QtQuick 2.2
import QtQuick.Controls 1.3
import QtQuick.Layouts 1.0
import QtQuick.Window 2.2

import QtQml.StateMachine 1.0 as DSM
import OmbExtensions 1.0
import "utils.js" as Utils

ApplicationWindow {
    id: root
    width: 650
    height: 500
    minimumWidth: 650
    minimumHeight: 500
    Component.onCompleted: startupFunction();

    function startupFunction() {
        if (!appsettings.hasWallet()) {
            sendWinBtn.enabled = false
        } else {
            sendWinBtn.enabled = true
        }
    }

    // NOTE depends on id: walletPane
    // utils.js defines the functions that unpack this go struct into javascript
    function updateWallet(walletdata) {
        Utils.updateWallet(walletdata);
    }


    CustToolBar {
        id: toolBar

        RowLayout {
            anchors { 
                verticalCenter: parent.verticalCenter
                left: parent.left
                leftMargin: 7
            }

            
            Button {
                id: sendWinBtn
                text: "Send"
                objectName: "sendBulletin"
                enabled: appsetting.hasWallet() 
                onClicked: {
                    var component = Qt.createComponent("SendWindow.qml")    
                    var window = component.createObject(root)
                    window.show()
                }
            }
            Button {
                id: viewBtn
                text: walletPane.visible ? "Browse" : "Wallet"
                objectName: "setupWalletBtn"
                
                // Closely bound to the state of accountSetupMachine
                // Also functions as toggle on walletPane.visible
                onClicked: {
                    if (!walletPane.visible) {
                        if (!appsettings.hasWallet()) {
                            authWizard.visible = true
                        } else {
                            viewBtn.text = "Browse"
                            browsePane.visible = false
                            walletPane.visible = true
                        }
                    } else {
                        viewBtn.text = "Wallet"
                        walletPane.visible = false 
                        browsePane.visible = true
                    }
                }
                // End js
            }
        }
    }

    AuthorWizard {
        id: authWizard
        onDoneChanged: sendWinBtn.enabled = true
    }

    AppSettings{
        id: appsettings
    }

    WalletPane {
        id: walletPane
        visible: false
        anchors{
            top: toolBar.bottom
            bottom: parent.bottom
            left: parent.left
            right: parent.right
        }
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

