import QtQuick 2.4

Rectangle {
    id: root
    x: 1
    y: 1
    height: parent.height - 2
    color: colorScale()

    property bool first: false
    property var unit

    function colorScale() {
        var c = [
            "#2ECC71", 
            "#58D68D", 
            "#82E0AA", 
            "#ABEBC6", 
            "#D5F5E3",
            "#EEFBF4"
        ];
        var i = 0;
        if (unit.depth > 5) {
            i = 0;
        } else {
            i = (c.length - 1) - unit.depth;
        }
        return c[i]
    }


    Rectangle {
        id: tickR
        x: parent.width
        y: 0
        height: parent.height + 3
        width: 1
        color: "gray"

    }

    Rectangle {
        id: tickL
        x: first ? -1 : 0
        y: 0
        height: parent.height + 3
        width: 1
        color: "gray"

    }                    

}
