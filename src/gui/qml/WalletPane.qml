import QtQuick 2.4
import QtQuick.Controls 1.3
import QtQuick.Window 2.1
import QtQuick.Layouts 1.1

Rectangle {
    id: root
    anchors.margins: 25
    SystemPalette {id: syspal}
    color: syspal.window

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

    
    WalletBar {
        id: bar
        fuelOuts: root.fuelOuts
        anchors {
            top: root.top
            left: parent.left; right: parent.right
        }

    }


    Item {
        id: info
        height: 100
        anchors {
            top: bar.bottom
            left: parent.left
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

    TabView {
        id: tableViewTabber
        anchors {
            left: parent.left
            right: parent.right
            top: info.bottom
            bottom: parent.bottom
        }

        Tab {
            title: "Credits"
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
            title: "Bulletins"
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
    }
}
