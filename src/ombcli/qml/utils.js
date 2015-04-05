// Data insertion handlers

// Unpacks a wallet bulletin for use in WalletPane.qml by the various TableViewColumn
// role handlers.
function updateWallet(walletData){
    console.log("Updating the wallet");
    updateWalletAlert(walletData.message)

    // Empty content of listModels
    walletPane.allModel.clear();
    walletPane.pendingModel.clear();
    walletPane.confirmedModel.clear();

    walletPane.spendableBalance = walletData.spendableBalance
    var bltnList = tryParse(walletData.pendingListJson, [])
    for (var i = 0; i < bltnList.length; i ++) {
        var bltn = bltnList[i];
        bltn.time = formatDate(new Date(1000*bltn.unix))
        walletPane.allModel.append(bltn);
        walletPane.pendingModel.append(bltn);
    }
    
    bltnList = tryParse(walletData.confirmedListJson, []);
    for (var i = 0; i < bltnList.length; i ++) {
        var bltn = bltnList[i];
        bltn.time = formatDate(new Date(1000*bltn.unix))
        walletPane.allModel.append(bltn);
        walletPane.confirmedModel.append(bltn);
    }
}

function updateWalletAlert(msg) {
    if (typeof msg == "undefined" || msg == "" ) {
        return 
    }

    var message = tryParse(msg, "")
    
    var color
    switch(message.type) {
        case "WARN":
            color = "#f39c12";
            break;
        case "INFO":
            color = "#3498db";
            break;
        case "GOOD":
            color = "#C5E3BF";
            break;
        case "DANG":
            color = "#e74c3c";
            break;
    }
    
    walletPane.alertColor = color
    walletPane.alertMessage = message.body
}

function tryParse(data, fallback) {
    try {
        var o = JSON.parse(data);
        return o;
    } catch (e) {
        console.log(e);
        return fallback;
    }
}

function formatUnixDate(i){
    
    return s
}


function formatAddr(addr) {
    var s = addr.slice(10);
    return s;
}

function formatDate(d) {
    var hours = (d.getHours() < 10 ? '0' : '' ) + d.getHours();
    var minutes = (d.getMinutes() < 10 ? '0' : '' ) + d.getMinutes();
    var s = hours + ":" + minutes + " " + d.toDateString().slice(4);
    return s;
}

function formatAttrib(addr, date) {
    var shortAddr = formatAddr(addr)
    // Date options
    var options = { 
        year: 'numeric', 
        month: 'long',
        day: 'numeric'
    }
    var niceDate = formatDate(date)
    var s = "By " + shortAddr + " at " + niceDate
    return s
}
