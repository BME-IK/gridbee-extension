$(document).ready(function()
{
	$("#tabs").tabs();

	var projecturl = $("#projecturl");
	var email = $("#email");
	var password = $("#password");
	var log = $("#log-content");
	var autostart = $("#autostart");
	
	if (localStorage.getItem("autostart") == "true")
	{
			autostart.removeClass("unchecked");
			autostart.addClass("checked");
			autostart.checked = true;
	}
	else
	{
		autostart.checked = false;
	}

	projecturl.val(localStorage.getItem("projecturl"));
	email.val(localStorage.getItem("email"));
	password.val(localStorage.getItem("password"));

	var port = chrome.extension.connect({name: "knockknock"});
	port.onMessage.addListener(function(rcvdMsg)
	{
		console.log(rcvdMsg);
		
		if (rcvdMsg.msg == 'threadNumber')
		{
			$("#threadNums").text(rcvdMsg.threadNums);
			setWorkUnitShower(rcvdMsg.threadNums);
		}
		else
		if (rcvdMsg.msg == "credit")
		{
			alert("credit: "+rcvdMsg.credit);
		}
		else
		if (rcvdMsg.msg == "log")
		{
			log.html("<p class='"+rcvdMsg.level[0]+"'>"+getTime()+rcvdMsg.message+"</p>"+log.html());
		}
		else
		if (rcvdMsg.msg == "userMessage")
		{
			log.html("<p class='userMessage'>"+getTime()+rcvdMsg.message+"</p>"+log.html());
		}
		else
		if (rcvdMsg.msg == "workunitProgress")
		{
			setWorkUnitProgress(rcvdMsg.workunit, rcvdMsg.progress);
		}
		else
		if (rcvdMsg.msg == "workunitStatus")
		{
			setWorkUnitStatus(rcvdMsg.workunit, rcvdMsg.status);
		}
		else
		if (rcvdMsg.msg == "status")
		{
			if (rcvdMsg.running)
			{
				$("#start").hide();
				$("#stop").show();
			}
			else
			{
				$("#start").show();
				$("#stop").hide();
			}
		}
	});
	
	$("#start").click(function()
  {
		console.log("start msg");
		port.postMessage({msg: "start"});
		
		$("#progess").removeClass("hide");
	});
	
	$("#stop").click(function()
  {
		console.log("stop msg");
		port.postMessage({msg: "stop"});
		$("#progess").addClass("hide");
	});
	
	$("#plus").click(function()
  {
		console.log("plus msg");
		port.postMessage({msg: "setThreadNumber", param: +1});
	});
	
	$("#minus").click(function()
  {
		console.log("minus msg");
		port.postMessage({msg: "setThreadNumber", param: -1});
	});
	
	$("#saveConfig").click(function()
  {
		console.log("saveConfig.click");
	
		console.log(projecturl.val()+" - "+email.val()+" - "+password.val());
		
		localStorage.setItem("projecturl", projecturl.val());
		localStorage.setItem("email", email.val());
		localStorage.setItem("password", password.val());
		
		port.postMessage({msg: "configUpdated"});
	});
	
	$("#clearLog").click(function()
  {
		log.html("");
	});
	
	autostart.click(function()
  {
		autostart.checked = !autostart.checked;
		localStorage.setItem("autostart", autostart.checked);
		
		if (autostart.checked)
		{
			autostart.removeClass("unchecked");
			autostart.addClass("checked");
		}
		else
		{
			autostart.removeClass("checked");
			autostart.addClass("unchecked");
		}
	});	
	
	function setWorkUnitShower(n)
	{
		// törölni kell a régi izéket és létrehozni n darab újat
		console.log(n+" szál van");
		
		var progressDiv = $("#progress");
		
		progressDiv.html(""); 
		for (var i = 0; i < n; i++)
		{
			console.log(i+"/"+n);
			var newChild = $("<div></div>").attr("id", i);
			progressDiv.append(newChild);
			
			var id = $("<div></div>").addClass("id").text((i+1)+". thread");
			newChild.append(id);
			
			var status = $("<div></div>").addClass("status").html("Passive&nbsp;");
			newChild.append(status);
			
			var progress = $("<div></div>").addClass("progress").html("0%&nbsp;")
			newChild.append(progress);
		}		
	}
	
	function setWorkUnitStatus(id, status)
	{
		var unitStatus = $("#progress #"+id+" .status");
		unitStatus.text(status);		
	}
	
	function setWorkUnitProgress(id, progress)
	{
		progress = Math.round(progress*100);
		var unitStatus = $("#progress #"+id+" .progress");
		unitStatus.text(progress+"%");
	}
	
	function getTime()
	{
		var dt = new Date();
		return "<span class=\"time\">"+dt.getHours()+":"+dt.getMinutes()+":"+dt.getSeconds()+"</span> ";
	}
});
