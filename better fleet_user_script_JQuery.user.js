/*
Copyright 2014-2015 ChickenStorm

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// ==UserScript==
// @name         Better Fleet
// @version      0.1
// @description  Enhances ships and squadrons assignation to fleets
// @author       ChickenStorm (Creator), Drakehinst (Refactor)
// @match        http://game.asylamba.com/s*/fleet*
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @grant        none
// ==/UserScript==

// Picture links
// Ender: https://dl.dropboxusercontent.com/u/110049848/user_script_ressouces/picture/ender.png
// 33 ch: https://dl.dropboxusercontent.com/u/110049848/user_script_ressouces/picture/chimere.png
// hydre (pe): https://dl.dropboxusercontent.com/u/110049848/user_script_ressouces/picture/hydre.png
// ph (pe): https://dl.dropboxusercontent.com/u/110049848/user_script_ressouces/picture/phenix.png


var div_fleet = null;
var div_dock = null;
var logo_dock = null;

$(window).load(
    function()
    {
        initUserScript();
    }
);

/**
 *
 *
 */
function initUserScript()
{
    div_fleet = $('div.commander-fleet.baseTransfer div.body'); // current commander's fleet column
    div_dock = $('div.list-ship.dock'); // current planet's dock column
    logo_dock = $('img.right'); // shipyard image on top of the dock column

    //==== ADD-ON 1: CUSTOM SHIPS QUANTITY TRANSFER ====
    var div_transfer_custom = $('<div class="list-ship"></div>').append(div_dock.html()); // clone the dock div
    // for each ship class create a custom integer input
    for (var i = 0; i < 12; i++)
    {
        div_transfer_custom.find('a[data-ship-id=' + i + '] span.quantity')
            .empty() // erase the quantity
            .append('<input style="width:50px;" id="in' + i + '">'); // add an input button
    }
    // set event listener
    div_transfer_custom.find('a').on("click", squadronTransferCustom);

    //==== ADD-ON 2: PRESET SQUADRONS TRANSFER ====
    var div_transfer_preset = $('<div class="list-ship"></div>');
    // add new presets to the div
    appendNewPreset(div_transfer_preset, "[[]]","http://vignette3.wikia.nocookie.net/dex-rpg/images/a/ab/Blackhole.png/revision/latest?cb=20160502114032","vide");
    appendNewPreset(div_transfer_preset, "[[0,2],[1,17],[7,1]]","https://dl.dropboxusercontent.com/u/110049848/user_script_ressouces/picture/ender.png","Ender Sat");
    appendNewPreset(div_transfer_preset, "[[0,2],[2,17],[7,1]]","http://static.planetminecraft.com/files/resource_media/screenshot/1223/enderman_2484812_thumb.jpg","Ender Chi");
    appendNewPreset(div_transfer_preset, "[[1,10],[4,10]]","http://vignette1.wikia.nocookie.net/dotd/images/1/11/Dryad.jpg/revision/latest?cb=20151019174516","A-E Dry/Sat");
    appendNewPreset(div_transfer_preset, "[[2,10],[4,10]]","http://vignette1.wikia.nocookie.net/mightandmagic/images/5/5b/Oak_dryad_H7.png/revision/latest?cb=20150705172511&path-prefix=en","A-E Dry/Chi");
    appendNewPreset(div_transfer_preset, "[[0,7],[9,1]]","https://dl.dropboxusercontent.com/u/110049848/user_script_ressouces/picture/hydre.png","Hydre/Peg");
    appendNewPreset(div_transfer_preset, "[[0,9],[10,1]]","https://at-cdn-s01.audiotool.com/2012/07/05/users/joshua91/avatar256x256-c78046199e004401bf00f17b80878db4.jpg","Cerbère/Peg");
    appendNewPreset(div_transfer_preset, "[[0,8],[11,1]]","https://dl.dropboxusercontent.com/u/110049848/user_script_ressouces/picture/phenix.png","Phénix/Peg");
    // set event listener
    div_transfer_preset.find('a').on("click", squadronTransferPreset);

    //==== APPEND ASSETS TO THE PAGE ====
    render.column.number +=1; // necessary: add a column to the page layout
    div_fleet.css("width", "600px");
    div_fleet.append(div_transfer_custom);
    div_fleet.append(div_transfer_preset);
    logo_dock.css("left", "190px");

    squadronTransfer.init();
}

/**
 *
 *
 */
function appendNewPreset(div_transfer, ship_array, img_src, preset_name)
{
    var preset = $('<a href="#"></a>');

    preset.append('<img src="' + img_src + '" alt=""></img>');
    preset.append('<span class="text"><span class="quantity">1</span><span>' + preset_name + '</span></span>');
    preset.attr('data-ships', ship_array);
    div_transfer.append(preset);
}

/**
 *
 *
 */
function squadronTransferCustom()
{
    var ships_class = parseInt($(this).data('ship-id')); // type of ships to move from docks
    var ships_required = parseInt($(this).find('input').val()); // number of ships to move from docks
    var transfer_needed = false;

    transfer_needed = shipTransfer(ships_class, ships_transfered);
    // if a transfered is required, do it
    if (transfer_needed)
    {
        ships_required.sendRequest(); // execute the transfer request
    }
}

/**
 *
 *
 */
function squadronTransferPreset()
{
    var ships_array = $(this).data('ships');
    var ships_class = 0;
    var ships_required = 0;
    var transfer_needed = false;

    for (var i = 0; i < 12; i++)
    {
        ships_required = 0; // by default, no ship required in the squadron
        for(var j in ships_array) // search for the cell corresponding to the ship class i
        {
            if (ships_array[j][0] == i)
            {
                ships_required = ships_array[j][1]; // get the number of ships required in the squadron
            }
        }
        transfer_needed = shipTransfer(i, ships_required);
    }
    // if a transfered is required, do it
    if (transfer_needed)
    {
        squadronTransfer.sendRequest(); // execute the transfer request
    }
}

/**
 * Setup a new ship move, making sure the squadron contains the required number of ships (this function may remove any excess of ships)
 * @param {ships_class} The type of ships to move
 * @param {ships_quantity} The number of ships required in the squadron
 * @return Whether a move is needed (at least one ship to add/remove)
 */
function shipTransfer(ships_class, ships_quantity)
{
    var ships_available = parseInt(div_dock.find('a[data-ship-id=' + ships_class + '] span.quantity').html()); // number of ships available from docks
    var ships_in_squadron = parseInt($('div.list-ship.squadron a[data-ship-id=' + ships_class + '] span.quantity').html()); // number of ships already in the squadron

    // check the move request consistency
    if (!isNaN(ships_quantity)
        && !isNaN(ships_class)
        && ships_quantity >= 0
        && ships_class >= 0
        && ships_class <= 12)
    {
        // 1. reduce by the number of ships already assigned to the squadron
        ships_quantity -= ships_in_squadron;
        // 2. check the maximum of ships that can be transfered
        if (ships_quantity > ships_available)
        {
            ships_quantity = ships_available; // set to max available if beyond
            $(this).find('input').val(ships_available); // update the input value display, to notify the user
        }
    }

    // prepare a new move if necessary
    if (ships_quantity > 0) // there are not enough ships, add some
    {
        squadronTransfer.move("btc", ships_class, ships_quantity); // Base To Commander transfer
        return true;
    }
    else if (ships_quantity < 0) // there are too many ships, remove some
    {
        squadronTransfer.move("ctb", ships_class, -ships_quantity); // Commander To Base transfer
        return true;
    }
    else // there already is the required number of ships, do nothing
    {
        return false;
    }
}
