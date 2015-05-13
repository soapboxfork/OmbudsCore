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
    property alias unconfirmedBalance: unconfirmedBalance.text
    property alias alertColor: alertColor.color
    property alias alertMessage: walletStatus.text

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
                        text: "Publishing Address"
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
                    spacing: 14
                    anchors.horizontalCenter: parent.horizontalCenter    

                    Text { 
                        anchors.horizontalCenter: parent.horizontalCenter    
                        id: title
                        text: "Wallet Info"
                        font { bold: true; pixelSize: 16 }
                    }
                
                    Item {
                        height: 40
                        width: spendableBalance.width + unconfirmedBalance.width
                        BtcUnit {
                            id: spendableBalance
                            lbl: "Spendable"
                        }
                        BtcUnit {
                            id: unconfirmedBalance
                            anchors { left: spendableBalance.right; }
                            lbl: "Unconfirmed"
                        }
                    }

                    Text {
                        id: roughEstimates
                        height: 72
                        anchors.horizontalCenter: parent.horizontalCenter    
                        horizontalAlignment: Text.AlignHCenter
                        text: "That can create roughly:\nAround 3 Tweets or\nAround 20 paragraphs or\nAround 5000 characters"
                    
                    }

                    Text { 
                        anchors.horizontalCenter: parent.horizontalCenter    
                        id: message
                        text: "Wallet Alerts"
                        font { bold: true; pixelSize: 16 }
                    }

                    Rectangle { 
                        anchors.horizontalCenter: parent.horizontalCenter    
                        id: walletActionBox
                        width: 300
                        radius: 3
                        height: 55
                        border { width: 1; color: "#888888" }
                        Image { 
                            source: "images/empty-stripe.png"
                            fillMode: Image.Tile
                            anchors.fill: parent
                            opacity: 0.3 
                        } 
                        Rectangle {
                            anchors {
                                fill: parent
                                margins: 8
                            }
                            id: alertColor
                            radius: 5
                            visible:  walletStatus.text === "" ? false : true 
                            Text {
                                id: walletStatus
                                anchors {
                                    fill: parent
                                    leftMargin: 5
                                    topMargin: 3
                                    rightMargin: 5
                                }
                                text: "" 
                                wrapMode: Text.Wrap
                            }
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
