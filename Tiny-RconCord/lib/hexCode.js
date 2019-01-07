// https://stackoverflow.com/questions/21647928/javascript-unicode-string-to-hex

const tinyHEXreplace = function(e) {

    if (e.replace(/ /g, '') != '') {
        return tinycode.encode(e, true);
    } else {
        return e;
    }

};

const tinycode = {

    encode: function(tinythis, finalv = false) {
        var hex, i;

        var result = "";
        for (i = 0; i < tinythis.length; i++) {

            hex = tinythis.charCodeAt(i).toString(16);

            if (!finalv) {
                result += ("000" + hex).slice(-4);
            } else {
                result += '\\u' + ("000" + hex).slice(-4);
            }

        }

        return result;

    },

    decode: function(tinythis) {
        var j;
        var hexes = tinythis.match(/.{1,4}/g) || [];
        var back = "";
        for (j = 0; j < hexes.length; j++) {
            back += String.fromCharCode(parseInt(hexes[j], 16));
        }

        return back;
    },

    controlled: function(tinythis) {

        return tinythis.replace(/[^a-zA-Z0-9]+/g, tinyHEXreplace)

        /* .replace(/[ÀÁÂÃÄÅ]/g, tinyHEXreplace)
            .replace(/[àáâãäå]/g, tinyHEXreplace)
            .replace(/[ÈÉÊË]/g, tinyHEXreplace)
            .replace(/[èéêë]/g, tinyHEXreplace)
            .replace(/[ÒÓÔÖÕ]/g, tinyHEXreplace)
            .replace(/[òóôöõ]/g, tinyHEXreplace)
            .replace(/[ÙÚûü]/g, tinyHEXreplace)
            .replace(/[ùúûü]/g, tinyHEXreplace)
            .replace(/[ÌÍÎÏ]/g, tinyHEXreplace)
            .replace(/[ìíîï]/g, tinyHEXreplace)
            .replace(/[Ç]/g, tinyHEXreplace)
            .replace(/[ç]/g, tinyHEXreplace) */
        ;

    }

};

module.exports = tinycode;