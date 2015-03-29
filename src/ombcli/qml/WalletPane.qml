import QtQuick 2.4
import QtQuick.Controls 1.3
import QtQuick.Window 2.2
import QtQuick.Layouts 1.1

Window {
    id: root

    SystemPalette {id: syspal}
    color: syspal.window
    flags: Qt.Sheet
    width: 650
    height: 550

    // Must be exported so that MainWindow can access these models
    property alias allModel: allModel
    property alias pendingModel: pendingModel
    property alias confirmedModel: confirmedModel
    property alias spendableBalance: spendableBalance.text

    ListModel{
        id: allModel
    }

    ListModel{
        id: pendingModel
    }

    ListModel{
        id: confirmedModel
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
            Layout.minimumHeight: 270
            color: syspal.window

            Item {
                id: addressInfo
                width: 220
                anchors {
                    top: parent.top
                    left: parent.left
                    bottom: parent.bottom
                }

                Column {

                    spacing: 10

                    Text {
                        text: "Sending Address"
                        anchors.horizontalCenter: parent.horizontalCenter
                        font { bold: true; pixelSize: 16 }
                    }

                    WalletAddr {}

                    Image {
                        anchors.horizontalCenter: parent.horizontalCenter
                        id: qrcode
                        source: appFact.ctrl().addressQrPath()
                        height: 150
                        width: 150
                    }


                }
            }

            Item {
                id: walletInfo
                // NOTE this is not dynamic!
                width: 350
                anchors {
                    top: parent.top
                    left: addressInfo.right
                    bottom: parent.bottom
                }

                
                Column {
                    spacing: 10
                    anchors.horizontalCenter: parent.horizontalCenter    

                    Text { 
                        anchors.horizontalCenter: parent.horizontalCenter    
                        id: title
                        text: "Wallet Info"
                        font { bold: true; pixelSize: 16 }
                    }

                
                    Item {
                        height: 40 
                        width: spendableBalance.width + balanceUnit.width + balanceUnit.anchors.leftMargin
                        anchors.horizontalCenter: parent.horizontalCenter    
                        Text {
                            id: spendableBalance
                            text: "0.000"
                            font { bold: true; pixelSize: 28 }
                        }
                        Text {
                            id: balanceUnit
                            anchors {
                                left: spendableBalance.right
                                leftMargin: 5
                                bottom: spendableBalance.bottom
                            }
                            text: "mBTC"
                            color: "gray"
                            font { bold: true; pixelSize: 19 }
                        }
                    }

                    Text {
                        id: roughEstimates
                        height: 85
                        anchors.horizontalCenter: parent.horizontalCenter    
                        horizontalAlignment: Text.AlignHCenter
                        text: "That can create roughly:\nAround 3 Tweets or\nAround 20 paragraphs or\nAround 5000 characters"
                    
                    }

                    Rectangle { 
                    anchors.horizontalCenter: parent.horizontalCenter    
                    id: walletActionBox
                    width: 300
                    radius: 3
                    height: 55
                    color: "#C5E3BF"
                    Text {
                        id: walletStatus
                        anchors.centerIn: parent
                        text: "The wallet seems to be working!" 
                    }
                }


                }
            }
        }


        Text { 
            id: tableLbl
            text: "Sent Bulletins"
            font { bold: true; pixelSize: 16 }
            anchors { horizontalCenter: parent.horizontalCenter }
        }

        TabView {
            id: tableViewTabber
            Layout.fillWidth: true
            Layout.fillHeight: true
        
            Tab {
                title: "All"
                anchors.margins: 12
                anchors.fill: parent

                WalletTableView {
                    id: allTable
                    model: allModel
                }
            }

            Tab {
                title: "Pending"
                anchors.margins: 12
                anchors.fill: parent

                WalletTableView {
                    id: pendingTable
                    model: pendingModel
                }
            }

            Tab {
                title: "Confirmed"
                anchors.margins: 12
                anchors.fill: parent

                WalletTableView {
                    id: confirmedTable
                    model: confirmedModel
                }
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
