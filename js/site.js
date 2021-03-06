var itemNames = [];
var itemMasters = [];
var itemMasterLevel = [];
var itemCost = [];
var hideoutTxt = "";
var loadedHideout = new Hideout();
var myDecorations = new Hideout();
var costsTable = {};
var showTable = [];

var requirements = {};

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function addCommas(nStr)
{
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

function fieldSorter(fields) {
    return function (a, b) {
        return fields
            .map(function (o) {
                var dir = 1;
                if (o[0] === '-') {
                    dir = -1;
                    o=o.substring(1);
                }
                if (a[o] > b[o]) return dir;
                if (a[o] < b[o]) return -(dir);
                return 0;
            })
            .reduce(function firstNonZeroValue (p,n) {
                return p ? p : n;
            }, 0);
    };
}

$(document).ready(function() {
    $.getJSON( "dataset.json", function( data ) {
        //var items = [];
        $.each( data['data'], function( key, val ) {
            //items.push( "<li id='" + key + "'>" + val + "</li>" );
            itemMasters.push($(val[0]).text());
            itemNames.push($(val[1]).text());
            itemMasterLevel.push(val[2]);
            itemCost.push(val[3]);
        });

        /*$( "<ul/>", {
            "class": "my-new-list",
            html: items.join( "" )
        }).appendTo( "body" );*/
    });
});

function uploadHideout() {
    if ($('#hideoutFile').get(0).files.length === 0) {
        alert("Select your hideout file");
    } else {
        if(!$('#hideoutFile').prop('files')['0'].name.endsWith(".hideout")) {
            alert("You can only use hideout files");
        } else {
            const reader = new FileReader();
            reader.onload = event => handleLoadedHideoutFile(event.target.result);
            reader.onerror = error => reject(error);
            reader.readAsText($('#hideoutFile').prop('files')[0]);
        }
    }
}

function handleLoadedHideoutFile(data) {
    loadedHideout = hideoutParser(data, loadedHideout);
    var lang = loadedHideout.getVars().language;
    if(!lang.startsWith("English")) {
        alert("Currently I only support English");
    } else {
        calculations();
    }
}

function hideoutParser(hideoutTxt, hideout) {
    var lines = hideoutTxt.split('\n');
    var tempData = [];
    for(var i = 0;i < lines.length;i++){
        tempData = lines[i].split(" = ");
        switch (tempData[0]) {
            case "Language":
                hideout.setLanguage(tempData[1].replaceAll("\"", ""));
                break;
            case "Hideout Name":
                hideout.setHideoutName(tempData[1].replaceAll("\"", ""));
                break;
            case "Hideout Hash":
                hideout.setHideoutHash(tempData[1].replaceAll("\"", ""));
                break;
            default:
                if(tempData[1] != undefined) {
                    hideout.addData([tempData[0], tempData[1]]);
                }
                break;
        }
    }
    return hideout;
}

function calculations() {
    var tempDec;
    var html = "";
    var reqHtml = "";
    $.each(loadedHideout.getVars().data, function(key, val) {
        var costIndex = $.inArray(val[0], itemNames);
        if(costIndex != -1) {
            if(costsTable.hasOwnProperty(val[0])) {
                costsTable[val[0]].setAmount(costsTable[val[0]].getVars().Amount + 1);
            } else {
                tempDec = new Decoration();
                tempDec.setAmount(1);
                tempDec.setCosts(itemCost[costIndex]);
                tempDec.setName(val[0]);
                tempDec.setMaster(itemMasters[costIndex]);
                tempDec.setMasterLevel(itemMasterLevel[costIndex]);
                costsTable[val[0]] = tempDec;

            }
        } else {
            if(costsTable.hasOwnProperty(val[0])) {
                costsTable[val[0]].setAmount(costsTable[val[0]].getVars().Amount + 1);
            } else {
                tempDec = new Decoration();
                tempDec.setName(val[0]);
                tempDec.setAmount(1);
                costsTable[val[0]] = tempDec;
            }
        }
    });
    //costsTable.sort(SortByName);
    $.each(costsTable, function(key, val) {
        var currentVars = val.getVars();
        showTable.push({Name: currentVars.Name, Master: currentVars.Master, MasterLevel: currentVars.MasterLevel, Costs: currentVars.Costs, Amount: currentVars.Amount});
        if(!currentVars.Master.startsWith("No info")) {
            if (requirements.hasOwnProperty(currentVars.Master)) {
                if (currentVars.MasterLevel > requirements[currentVars.Master]) {
                    requirements[currentVars.Master] = currentVars.MasterLevel;
                }
            } else {
                requirements[currentVars.Master] = currentVars.MasterLevel;
            }
            if (requirements.hasOwnProperty("TotalCosts")) {
                requirements["TotalCosts"] = (currentVars.Amount * currentVars.Costs) + requirements["TotalCosts"];
            } else {
                requirements["TotalCosts"] = (currentVars.Amount * currentVars.Costs);
            }
        }
    });
    showTable.sort(fieldSorter(['Master', 'MasterLevel', 'Name']));
    $.each(showTable, function(key, val) {
        html += "<tr class=\"prob\"><td>"+val.Name+"</td><td>"+val.Master+"</td><td>"+val.MasterLevel+"</td><td>"+val.Costs+"</td><td>"+val.Amount+"</td><td>"+(val.Costs*val.Amount)+"</td></tr>";
    });
    console.log(requirements);
    $("#resultbody").append(html);
    $.each(requirements, function(key, val) {
        console.log("REQ");
        if(key != "TotalCosts") {
            reqHtml += key+" Level: "+val+"<br />";
        } else {
            reqHtml = "Total costs: "+addCommas(val)+"<br />"+reqHtml
        }
    });
    console.log(reqHtml);
    $(".requirements").append(reqHtml+"<br /><br />");
}

