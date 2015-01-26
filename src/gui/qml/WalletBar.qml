import QtQuick 2.4
import QtQuick.Controls 1.3

Item {
    id: root
    height: 65
    width: parent.width
    property var fuelOuts

    function totalFuel(lst) {
        var total = 0;
        lst.forEach(function(i){ total += i.fuel });
        return total
    }

    Item {

        anchors {
            margins: 15
            fill: parent.fill
        }

        Rectangle { 
            id: txoutBox
            anchors {
                left: parent.left
                top: parent.top
            }
            height: 45
            width: 45
            radius: 5     
            gradient: Gradient {
                GradientStop { position: 0.0; color: "#68D495"}
                GradientStop { position: 1.0; color: "#2ecc71" }
            } 

            border {
                color: "gray"
                width: 1
            }
            Text {
                anchors {
                    verticalCenter: parent.verticalCenter
                    horizontalCenter: parent.horizontalCenter
                }
                font { bold: true; pixelSize: 27 }
                text: "4"
            }
        } 

        Item  {
            id: tickerBar
            anchors {
                left: txoutBox.right
                top: parent.top
                leftMargin: 10
                right: parent.right
            }

            Text {
                id: addrLbl
                anchors {
                    top: parent.top
                    left: parent.left
                }
                text: "mgMDvAfBp2VAYzeQMfPRX4sGgyurT62HCT"
                font.bold: true
            }

            Text {
                id: fuelAmnt
                function totalFuelStr(json) {
                    var fuel = root.totalFuel(json);
                    if (fuel == 0) {
                        return "No Fuel!"
                    } else {
                        return fuel + " Fuel"
                    }
                }
                anchors {
                    right: fuelEdge.right
                    top: parent.top
                }
                text: totalFuelStr(root.fuelOuts)
            }

            Rectangle {
                id: fuelEdge
                
                function tickXPos(lst, idx) {
                    var x = 0;
                    for (var j = 0; j < idx; j++) {
                        x += tickWidth(lst, j)
                    }
                    return x
                }

                function tickWidth(lst, idx) {
                    var t = root.totalFuel(lst);
                    var scale = this.width/t
                    return scale * lst[idx].fuel
                }

                anchors {
                    left: parent.left
                    topMargin: 5
                    top: addrLbl.bottom
                }
                radius: 2
                height: 13
                width: 525
                border {
                    color: "#808080"
                    width: 1
                }
                color: "#DEDEDE"

                Repeater {
                    model: fuelOuts
                    FuelOut{
                        unit: modelData
                        width: fuelEdge.tickWidth(root.fuelOuts, index)
                        x: fuelEdge.tickXPos(root.fuelOuts, index)
                    }
                }

            }
        }
    }
}
