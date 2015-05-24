'use strict';

var ombFilters = angular.module('ombWebAppFilters', []);

ombFilters.filter('nicedate', function() {
    return function(utcsecs) {
        var d = new Date(utcsecs*1000)
        if (isValidDate(d)) {
            return dateStr(d);
        } else {
            return "ERR"
        }
    }
});

function isValidDate(d) {
    if ( Object.prototype.toString.call(d) !== "[object Date]" ) {
        return false;
    }
    return !isNaN(d.getTime());
}

// Returns the date in 12/22/15 format
function dateStr(date) {
    var day = pad(date.getDate()); 
    var month = pad(date.getMonth()+1);
    var year = date.getFullYear().toString().slice(2,4);
    if (year == "") {
        year = date.getFullYear();
    }
    return month + '/' + day + '/' + year;
}

// Returns the time of a day in 01:10 (military) format
function timeStr(date) {
    var hour = pad(date.getHours());
    var minutes = pad(date.getMinutes());
    return hour + ':' + minutes;
}


function pad(i) {
    if (i < 10) {
        return '0' + i
    }
    return i
}


ombFilters.filter('nicedatetime', function() {
    return function(utcsecs) {
        var d = new Date(utcsecs*1000); 
        if (isValidDate(d)) {
            var dmy = dateStr(d);
            var hm = timeStr(d);
            return hm + " " + dmy
        } else {
            return "ERR";
        }
    }
});

ombFilters.filter('plural', function() {
    return function(num, word) {
        if (num == 1) {
            return num + " " + word.slice(0, word.length-1)
        } else {
            return num + " " + word
        }
    }
});

ombFilters.filter('authColor', function() {
    return colorAddr;
});


function colorAddr(address) {
/* Takes a bitcoin address and returns a rgb() color, the hash algorithm used is 
*  * MD5. We compress the output of MD5 even further to map it into the rgb colorspace.
*   * The current function takes the md5 of the bitcoin address and maps the last 8 bits
*    * of each word into values for red, green and blue.
*     * */ 

    var hash = CryptoJS.MD5(address), 
    words = hash.words.map(function(w) { return Math.abs(w) });

    // TODO replace me with a better function!
    var red = words[0] % 256,
    blue    = words[1] % 256,
    green   = words[2] % 256;

    return 'rgb(' + red + ', ' + green + ', ' + blue + ')'
}
