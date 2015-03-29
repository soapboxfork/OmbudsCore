// Data insertion handlers

// Unpacks a wallet bulletin for use in WalletPane.qml by the various TableViewColumn
// role handlers.
function updateWallet(walletData){
    console.log("Updating the wallet");

    walletPane.spendableBalance = walletData.spendableBalance
    var bltnList = JSON.parse(walletData.pendingListJson)
    for (var i = 0; i < bltnList.length; i ++) {
        var bltn = bltnList[i];
        bltn.time = formatDate(new Date(1000*bltn.unix))
        walletPane.allModel.append(bltn);
        walletPane.pendingModel.append(bltn);
    }
    
    bltnList = JSON.parse(walletData.confirmedListJson);
    for (var i = 0; i < bltnList.length; i ++) {
        var bltn = bltnList[i];
        bltn.time = formatDate(new Date(1000*bltn.unix))
        walletPane.allModel.append(bltn);
        walletPane.confirmedModel.append(bltn);
    }
}


function formatUnixDate(i){
    
    return s
}


function formatAddr(addr) {
    var s = addr.slice(1,8)
    return s
}

function formatDate(d) {
    var s = d.getHours() + ":" + d.getMinutes() + " " + d.toDateString().slice(4)
    return s 
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
