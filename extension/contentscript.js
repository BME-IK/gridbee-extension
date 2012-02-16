var div = document.getElementById('girdbeeEventDiv');
if (div != null)
{
	div.addEventListener('myCustomEvent', function()
	{
		var eventData = document.getElementById('girdbeeEventDiv').innerText;
		
		chrome.extension.sendRequest(eventData, function(response)
		{
			fireResponseEvent(response);
		});
		
		function fireResponseEvent(responseData)
		{
			var customEvent = document.createEvent('Event');
			customEvent.initEvent('gridbeeResponseEvent', true, true);	
			hiddenDiv = document.getElementById('girdbeeEventDiv');
			hiddenDiv.innerText = responseData;
			hiddenDiv.dispatchEvent(customEvent);
		}
	});
}
else
{
	console.log("nem szerepel ezen az oldalon az esemény továbbító div!");
}