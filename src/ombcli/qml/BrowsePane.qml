import QtQuick 2.4
import QtWebKit 3.0
import QtQuick.Controls 1.0

Rectangle {
    id: root
    ScrollView {
        anchors.fill: parent

        WebView {
            id: browseView
            url: "http://localhost:1055/api/status"
            anchors.fill: parent

            onLoadingChanged: {
                if (loadRequest.status === WebView.LoadFailedStatus) {
                    loadStatusTxt.text = "Load failed.";
                } else {
                    loadStatusTxt.text = "Load worked!";
                }
            }
        }
    }

    Text { 
        id: loadStatusTxt 
        text: "Starting up..."
        anchors.bottom: parent.bottom
    }
}
