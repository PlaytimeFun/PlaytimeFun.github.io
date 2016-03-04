"use strict";

document.getElementById('cart-oil').addEventListener('submit', estimateTotal);

function estimateTotal(event) {
event.preventDefault();

if (document.getElementById('s-state').value === '') {
    alert('Please choose your shipping state.');

    document.getElementById('s-state').focus();
}



var btlExtra = parseInt(document.getElementById('txt-q-extra').value, 10) || 0,
    btlCold = parseInt(document.getElementById('txt-q-cold').value, 10) || 0,
    btlGarlic = parseInt(document.getElementById('txt-q-garlic').value, 10) || 0,
    btlLemon = parseInt(document.getElementById('txt-q-lemon').value, 10) || 0,
    state = document.getElementById('s-state').value;

var methods = document.getElementById('cart-oil').r_method,
    shippingMethod;

for (var i = 0; i < methods.length; i++) {
    if (methods[i].checked == true) {
        shippingMethod = methods[i].value;
    }
}

var taxFactor = 1;
if (state === 'CA') {
    taxFactor = 1.075; // tax is 7.5% in California
} else if (state === 'WA') {
    taxFactor = 1.065; // tax is 6.5% in Washington
}

// pickup, usps, ups
var shippingCostPer = 0;
switch (shippingMethod) {
    case 'pickup' :
        shippingCostPer = 0;
        break;
    case 'usps' :
        shippingCostPer = 2;
        break;
    case 'ups' :
        shippingCostPer = 3;
        break;
}
var totalBottles = btlExtra + btlCold + btlGarlic + btlLemon,
    shippingCost = totalBottles * shippingCostPer;

var subtotal = ((btlExtra * 10) + (btlCold * 8) + (btlGarlic * 10) + (btlLemon * 12)) * taxFactor;

var estimate = "$" + (subtotal + shippingCost).toFixed(2);

document.getElementById('txt-estimate').value = estimate;

document.getElementById('results').innerHTML = 'Total bottles: ' + totalBottles + '<br>';
document.getElementById('results').innerHTML += 'Total shipping: $' + shippingCost.toFixed(2) + '<br>';
document.getElementById('results').innerHTML += 'Tax: ' + ((taxFactor - 1) * 100).toFixed(2) + '% (' + state + ')';
}