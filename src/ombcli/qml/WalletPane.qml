import QtQuick 2.4
import QtQuick.Controls 1.3
import QtQuick.Window 2.2
import QtQuick.Layouts 1.1

Window {
    id: root
    //anchors.margins: 25
    SystemPalette {id: syspal}
    color: syspal.window
    flags: Qt.Sheet
    width: 650
    height: 500

    // Must be exported so that MainWindow can access these models
    property alias bltnModel: bltnModel
    property alias txModel: txModel
    property alias availTxOuts: availTxOuts.val
    property alias pendingTxOuts: pendingTxOuts.val
    property var fuelOuts


    ListModel{
        id: bltnModel
    }

    ListModel{
        id: txModel
    }

    ColumnLayout {
        id: colLayout 
        anchors {
            fill: parent
            leftMargin: 25
            rightMargin: 25
            topMargin: 25
            bottomMargin: 7
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.minimumHeight: 200
            color: syspal.window


            Image {
                id: qrcode
                source: appCtrl.addressQrPath()
                height: 180
                width: 180
            }

            Item {
                id: info
                height: 100
                anchors {
                    top: qrcode.top
                    left: qrcode.right
                    leftMargin: 20
                    right: parent.right
                }

                Text { 
                    id: title
                    text: "Wallet Info"
                    font { bold: true; pixelSize: 16 }
                }

                GridLayout {
                    anchors {
                        top: title.bottom
                        right: parent.right
                        left: parent.left
                        bottom: parent.bottom
                        bottomMargin: 20
                    }
                    columns: 2
                    WalletLbl {
                        id: availTxOuts
                        lbl: "Available Outputs:"    
                        val: "3"
                    }
                    WalletLbl {
                        id: unspentFuel
                        lbl: "Unspent Fuel:"
                        val: "43"
                    }
                    WalletLbl {
                        id: pendingTxOuts
                        lbl: "Pending Outputs:"    
                        val: "12"
                    }
                    WalletLbl {
                        id: unspentCoin
                        lbl: "Unspent Coin:"
                        val: "38143"
                    }
                }
            }
        }

        TabView {
            id: tableViewTabber
            Layout.fillWidth: true
            Layout.fillHeight: true
        
            Tab {
                title: "All"
                anchors.margins: 12

                TableView {
                    id: txTable
                    model: txModel
                    TableViewColumn {
                        title: "Transaction Id"
                        role: "txid"
                    }

                }

            }

            Tab {
                title: "Confirmed"
                anchors.margins: 12
                anchors.fill: parent

                TableView {
                    id: bltnTable
                    model: bltnModel

                    TableViewColumn {
                        role: "txid"
                        title: "Transaction Id"
                    }
                    TableViewColumn {
                        role: "time"
                        title: "Time (UTC)"
                    }
                    TableViewColumn {
                        role: "board"
                        title: "Board"
                    }
                    TableViewColumn {
                        role: "depth"
                        title: "Depth"
                    }
                }
            }
            Tab {
                title: "Pending"
                anchors.margins: 12
                anchors.fill: parent
            }
        }

        Button {
            id: closeBtn
            text: "Close"
            anchors {
                bottom: parent.bottom
                right: parent.right
            }
            onClicked: root.visible = false
        }
    }
}
