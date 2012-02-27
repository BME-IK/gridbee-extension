var projecturl = null;
var scheduler = null;
var authkey = null;
var client = null;
document.port = null;
var started = false;

var firstStart = localStorage.getItem("firstStart");
localStorage.setItem("firstStart", "false");

$(document).ready(function()
{
	init();
	
	if (localStorage.getItem("autostart") == "true")
	{
		console.log("Auto start is turned on.");
		start();
	}

	chrome.extension.onConnect.addListener(function(port)
	{
		console.log("connected");
		document.port = port;
		
		if (client == null)
		{
			alert("Please check configurations!");
		}
		
		if (client != null)
		{
			port.postMessage({msg: "threadNumber", threadNums: client.getThreadNumber()});
			sendMessage({msg: "status", running: started});
		}
		
		port.onMessage.addListener(function(rcvdMsg)
		{
			var msg = rcvdMsg.msg;
			console.log("Rcvd msg: "+msg);
			if (msg == "configUpdated")
			{
				init();
			}
			else
			if (msg == "start")
			{
				if (!started)
				{
					start();
					port.postMessage({msg: "userMessage", message: "Started"});
					
					port.postMessage({msg: "threadNumber", threadNums: client.getThreadNumber()});
					sendMessage({msg: "status", running: started});
				}
				else
				{
					port.postMessage({msg: "userMessage", message: "It is already started"});
				}
			}
			else
			if (msg == "stop")
			{
				if (started)
				{
					stop();
					port.postMessage({msg: "userMessage", message: "Stopped"});
				}
				else
				{
					port.postMessage({msg: "userMessage", message: "It is already stopped"});
				}
			}
			else
			if (msg == "setThreadNumber")
			{
				var threadNums = setThreadNumber(rcvdMsg.param);
				console.log("ennyi szál lett: "+threadNums);
				port.postMessage({msg: "threadNumber", threadNums: threadNums});
			}
		});
		
		port.onDisconnect.addListener(function(event)
		{
			console.log("disconneced");
			document.port = null;
		});
	});

	function init()
	{
		projecturl = localStorage.getItem("projecturl");
		var email = localStorage.getItem("email");
		var password = localStorage.getItem("password");

		if (projecturl == null || projecturl.length < 3 || email == null || email.length < 3 || password == null || password.length < 3)
		{
			if (firstStart == "false")
			{
				console.log("Initialization failed! One of the parameters is too short!");
				sendMessage({msg: "log", message: "Initialization failed! One of the parameters is too short!", level: {0: "L0_Critical", 1: 0}});
				alert("Initialization failed! One of the parameters is too short!");
			}
			else
			{
				window.open("options.html");
			}
		}
		else
		{
			// parameters are ok
	
			if (client == null)
			{
				client = new gridbee.core.control.Client("GridBee");
				
				client.onLog.subscribe(function(e)
				{
					console.log(e.message);
					sendMessage({msg: "log", message: e.message, level: e.level});
				});
			}
			else
			{
				while (client.getWorksources().length > 0)							// ?!?!?!?!
				{
					client.removeWorksource(client.getWorksources()[0]);
				}
			}
	
			var rpc = client.CreateBoincWebRPCHandler(projecturl);
			var lookup = rpc.lookupAccount(email, password);
			lookup.oncomplete.subscribe(function()
			{
				authkey = lookup.getResult().Auth;
				
				getSchedulerUrl(projecturl, function(sch)
				{
					scheduler = sch;
					console.log("Scheduler: "+scheduler);
					initS2();
				});
			});
			lookup.onerror.subscribe(function()
			{
				alert("lookupAccount rpc call failed!");
			});
		}
	}
	
	function initS2()
	{	
		if (projecturl == null || projecturl.length < 3 || scheduler == null || scheduler.length < 3 || authkey == null || authkey < 3)
		{
			console.log("Initialization failed!");
			sendMessage({msg: "log", message: "Initialization failed!", level: {0: "L0_Critical", 1: 0}});
			alert("Initialization failed!");
			return;
		}
		
		var threadNumber = parseInt(localStorage.getItem("threadNumber"));
		if (!(threadNumber > 0))
		{
			localStorage.setItem("threadNumber", 1);
		}
		
		client.setThreadNumber(threadNumber);
		
		var bws = new gridbee.worksource.boinc.BoincWorkSource(scheduler, authkey);
		client.addWorksource(bws);
		
		bws.onAddWorkunit.subscribe(function(workunit)
		{
			var workunitNo = bws.getWorkUnits().indexOf(workunit);
			console.log("New workunit is created with "+workunitNo+" identifier.");
			
			workunit.onProgressChange.subscribe(function(progress)
			{
				sendMessage({msg: "workunitProgress", progress: progress, workunit: workunitNo});
			});
			
			workunit.onStatusChange.subscribe(function()
			{
				var workunitNo = bws.getWorkUnits().indexOf(workunit);
				sendMessage({msg: "workunitStatus", status: workunit.getStatusString(), workunit: workunitNo});
			});
		});
		
		console.log("Initialized!");
	}

	function start()
	{
		started = true;
		init();
		client.start();
		console.log("Started!");
		sendMessage({msg: "status", running: true});
	}

	function stop()
	{
		started = false
		client.stop();
		console.log("Stoped!");
		sendMessage({msg: "status", running: false});
	}

	function setThreadNumber(num)
	{
		var threadNumber = client.getThreadNumber();
		if (threadNumber + num > 0 && threadNumber + num <= 12)
		{
			threadNumber += num;
			client.setThreadNumber(threadNumber);
			localStorage.setItem("threadNumber", threadNumber);
		}
		
		return threadNumber;
	}
	
	function sendMessage(message)
	{
		if (document.port != null)
		{
			document.port.postMessage(message);
		}
	}
	
	function getSchedulerUrl(projecturl, callback)
	{
      return $.ajax({
        url: projecturl,
        success: function(data, status)
				{
          var link, links, schedulers, url_re, _i, _len;
          links = data.match(/<link rel="boinc_scheduler" [^>]*>/g);
          url_re = /[^"]*(?="\s*>$)/;
          for (_i = 0, _len = links.length; _i < _len; _i++)
					{
            link = links[_i];
            schedulers = link.match(url_re);
          }
          callback(schedulers[0]);
        },
        error: function()
				{
        }
      });
    };
});

chrome.extension.onRequest.addListener(function(request, sender, sendResponse)
{
	console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
	console.log(request);
	
	if (request != "getCredit")
	{
		sendResponse("Wrong command!");
	}
	
	var rpc = client.CreateBoincWebRPCHandler(projecturl);
	
	var accInfoResult = rpc.getAccountInfo(authkey)

	accInfoResult.oncomplete.subscribe(function()
	{
		var id = accInfoResult.getResult().id;
		var rpcResult = rpc.getCreditInformationWithID(id);	// ID alapján kell lekérdezni, különben csomó <host>-ot ad vissza ami az xml.parse-nál elhasal sokáig

		rpcResult.oncomplete.subscribe(function()
		{
			sendResponse(rpcResult.getResult().total_credit);
		})

		rpcResult.onerror.subscribe(function()
		{
			console.log("getCreditInformationWithID failed");
			sendResponse(-1);
		});
	});
	
	accInfoResult.onerror.subscribe(function()
	{
		console.log("getAccountInfo failed");
		sendResponse(-1);
	});
});