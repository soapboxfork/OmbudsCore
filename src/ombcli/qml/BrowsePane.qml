import QtQuick 2.4
import QtWebKit 3.0
import QtQuick.Controls 1.0

Rectangle {
    id: root
    property alias webView: browseView

    WebView {
        id: browseView
        url: "http://localhost:1055"
        anchors.fill: parent

        Component.onCompleted: {
        }

        onLoadingChanged: {
            if (loadRequest.status === WebView.LoadFailedStatus) {
                //loadStatusTxt.text = "Load failed.";
            } else {
                //loadStatusTxt.text = "Load worked!";
            }
        }

        onNavigationRequested: {
            var url = request.url.toString();
            var m = "http://localhost:1055/"
            var l = m.length;
            if (url.slice(0, l) === m) {
                request.action = WebView.AcceptRequest;
            } else {
                request.action = WebView.IgnoreRequest;
                Qt.openUrlExternally(request.url);
            }
        }
    }

    Text { 
        id: loadStatusTxt 
        //text: "Starting up..."
        anchors.bottom: parent.bottom
    }
}
