$(document).ready(function()
{
	// ---------------- "Proxy" ----------------
	var customEvent = document.createEvent('Event');
	customEvent.initEvent('myCustomEvent', true, true);
	
	var callbck;
	document.getElementById('girdbeeEventDiv').addEventListener('gridbeeResponseEvent', function()
	{
		var eventData = document.getElementById('girdbeeEventDiv').innerText;
		callbck(eventData);
	});
	
	function fireCustomEvent(data, callback)
	{
		callbck = callback;
		hiddenDiv = document.getElementById('girdbeeEventDiv');
		hiddenDiv.innerText = data;
		hiddenDiv.dispatchEvent(customEvent);
	}
	// -----------------------------------------

	var speed = 100;
	var darab = 10;
	var bigyok = new Array();
	var interval;
	
	function init()
	{
		var root = $("#container");
		for (var i = 0; i < darab; i++)
		{
			var ujBigyo = $("<div class='bigyo'></div>");
			ujBigyo.attr('id', "bigyo"+i);
			ujBigyo.text(i);		
			
			var x = Math.round((Math.random() * 200)) - 100;
			var y = Math.round((Math.random() * 200)) - 100;
			ujBigyo.left = 200 + x;
			ujBigyo.top = 200 + y;
			
			bigyok.push(ujBigyo);
			root.append(ujBigyo);
			
			ujBigyo.click(function()
			{
				$(this).hide("slow");
				if (--darab == 0)
				{
					alert("Kész");
				}
			});
		}
	}
	
	function stepAll()
	{
		for (	var i in bigyok)
		{
			var bigyo = bigyok[i];
			
			var left = parseInt(bigyo.left);
			var top = parseInt(bigyo.top);
			
			var x = Math.round((Math.random() * 20)) - 10;			
			var y = Math.round((Math.random() * 20)) - 10;
			
			left = left + x;
			top = top + y;
			
			bigyo.css('left', left+"px");
			bigyo.css('top', top+"px");
		}
	}
	
	init();
	
	function setSpeed(credit)
	{
		if (credit > 20)
				credit = 20;
		
		speed = 500 + ((credit+1) * 150);
		
		clearInterval(interval);
		interval = setInterval(function()
		{
			stepAll();
		}, speed);
		
		interval = setInterval(function()
		{
			stepAll();
		}, speed);
	}	
	
	setSpeed(0);
	
	$("#send").click(function()
	{
		fireCustomEvent("getCredit", function(response)
		{
			alert("credit = "+response+" speed = "+speed);
			setSpeed(response);			
		});	
	});	
});