import QtQuick 2.4
import QtQuick.Controls 1.3
import QtQuick.Window 2.2
import QtQuick.Layouts 1.1

TableView {

    TableViewColumn {
        role: "board"
        title: "Board"
        width: 175
    }
    TableViewColumn {
        role: "time"
        title: "Time (UTC)"
        width: 120
    }
    TableViewColumn {
        role: "depth"
        title: "Depth"
        width: 100
    }
    TableViewColumn {
        role: "txid"
        title: "Transaction Id"
        width: 250
    }
}

