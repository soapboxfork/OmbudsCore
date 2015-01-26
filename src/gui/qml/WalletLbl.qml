import QtQuick 2.2
import QtQuick.Layouts 1.1

Text {
    property alias lbl: lbl.text
    property alias val: val.text
    RowLayout {
        Text {
            id: lbl
            text: "NIL"
        }
        Text {
            id: val
            text: "0"
        }
    }
}
