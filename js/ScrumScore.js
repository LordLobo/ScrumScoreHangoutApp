// ScrumScore.js
// By Dan Giralte 
// MIT No warrenty 2013

var scoreCards = new Array("0", "1/2", "1", "2", "3", "5", "8", "13", "20", "40", "100", "inf", "???");
var localState = new scrummState();
var localParticipant = new scrummParticipant();
var localParticipantIndex = 0;

function scrummParticipant() 
{
	this.participant = null;
	this.id = "";
	this.isPm = false;
	this.scrummScore = "";
}

function scrummState()
{
	this.participants = new Array();
	this.pm = null;
	this.state = "";
}

function getLocalParticipant()
{ 
	localParticipant.participant = gapi.hangout.getLocalParticipant();

	for (var i = 0; i < localState.participants.length; i++) 
	{
   		if (localState.participants[i] === localParticipant) 
   		{
      		localParticipant = localState.participants[i];
      		localParticipantIndex = i;
      		localParticipant.id = localState.participant[i].id;
      		break;
		}
   	} 
}

function startSession() 
{
	getLocalParticipant();
	localParticipant.isPm = true;

	localState.pm = localParticipant;

	var participants = gapi.hangout.getParticipants();

	for (var index in participants)
	{
		var participant = participants[index];

		if (participant.id != localState.pm.participant.id)
		{
			var newParticipant = new scrummParticipant();
			newParticipant.participant = participant;
			newParticipant.id = participant.id;

			localState.participants.push(newParticipant);
		}
	}

	localState.state = "startSession";

	submitState();
}

function submitState()
{
	gapi.hangout.data.submitDelta( { state: JSON.stringify(localState) });
}

function buildUserHtml(gp)
{
	return html = 
	"<div class='userBlock' id='user_" + gp.id + "'>" +
		"<div class='userName' id='userName_" + gp.id + "'>" + gp.participant.person.displayName + "</div>" + 
		"<div class='userScore' id='userScore_" + gp.id + "'> --- </div>" + 
	"</div>";
}

function configureScreen()
{
	getLocalParticipant();

	if (localParticipant.isPm)
	{
		// set up the Pm control button(s)
		getEle("pmStart").style.display = "none";
		getEle("showVotes").style.display = "block";
		getEle("resetVotes").style.display = "block";
	}
	else
	{
		//updateStatus("not PM");

		// remove the PM div
		getEle("projMgr").style.display = "none";

		// set up the voting buttons for a team member
		getEle("score").style.display = "block";
	}

	// set up the team member display area
  	var usersDiv = getEle("users");
  	var usersHtml = "";

  	for (var i = 0; i < localState.participants.length; i++) 
	{
		var thisParticipant = localState.participants[i];

		if (!thisParticipant.isPm)
		{
			usersHtml += buildUserHtml(localState.participants[i]);
		}
	}

	usersDiv.innerHTML = usersHtml;
	usersDiv.style.display = "block";

	//updateStatus("configureScreen complete with " + (localState.participants.length - 1) + "particpants");
}

function toggleInputs()
{
	var inputs = document.getElementsByTagName("INPUT");
	for (var i = 0; i < inputs.length; i++) 
	{
	    if (inputs[i].type === 'submit') 
	    {
    	    inputs[i].disabled = !inputs[i].disabled ;
	    }
	}
}

function submitScore(score)
{
	// disable all buttons
	toggleInputs();

	setTimeout(
		function () 
		{
			getLocalParticipant();

			for (var i = 0; i < localState.participants.length; i++) 
			{
				if (localState.participants[i].id === localParticipant.participant.id)
				{
					localState.participants[i].scrummScore = score;
				}
			}

			localState.state = "scoreSubmitted";
			submitState();
		}
		, 1000);

	// re-enable all buttons
	toggleInputs();
}

function updateScoreStatus()
{
	// update users' display if they have a vote or not
	for (var i = 0; i < localState.participants.length; i++) 
	{
		var thisParticipant = localState.participants[i];

		if (!thisParticipant.isPm && thisParticipant.scrummScore)
		{
			var changeMe = getEle("userScore_" + thisParticipant.id);

			changeMe.innerHTML = "X";
		}
	}
}

function showVotes()
{
	localState.state = "showVotes";
	submitState();
}

function updateShowScores()
{
	// update users' display if they have a vote or not
	for (var i = 0; i < localState.participants.length; i++) 
	{
		var thisParticipant = localState.participants[i];

		if (!thisParticipant.isPm && thisParticipant.scrummScore)
		{
			getEle("userScore_" + thisParticipant.id).innerHTML = thisParticipant.scrummScore;
		}
	}
}

function resetVotes()
{
	localState.state = "resetVotes";
	submitState();
}

function updateResetScores()
{
	// update users' display if they have a vote or not
	for (var i = 0; i < localState.participants.length; i++) 
	{
		var thisParticipant = localState.participants[i];

		if (!thisParticipant.isPm)
		{
			thisParticipant.scrummScore = null;
			getEle("userScore_" + thisParticipant.id).innerHTML = "---";
		}
	}
}

function resetApp()
{
	if (confirm("This will reset the app state and unseat the Project Manager - " + 
				"only use this to start the ScurmScore session over"))
	{
		localState.state = "resetAll";
		submitState();
	}
}

function resetAll()
{
	getEle("pmStart").style.display = "block";
	getEle("showVotes").style.display = "none";
	getEle("resetVotes").style.display = "none";

	getEle("projMgr").style.display = "block";
	getEle("score").style.display = "none";
  	getEle("users").style.display = "none";
  	getEle("users").innerHTML = "";

  	localState = null;
  	localState = new scrummState();

  	localParticipant.isPm = false;
}

function handleNewState()
{
	switch (localState.state)
	{
		case "startSession":
			// The session has been started by the PM.
			configureScreen();
			break;
		case "scoreSubmitted":
			// One of the Team Members submitted a score
			updateScoreStatus();
			break;
		case "showVotes":
			// One of the Team Members submitted a score
			updateShowScores();
			break;
		case "resetVotes":
			// One of the Team Members submitted a score
			updateResetScores();
			break;
		case "resetAll":
			// cleanse everything and start over
			resetAll();
			break;
		default:
			break;
	}

	//new Audio("https://www.lordloboapps.net/ScrumScore/ding.mp3").play();

	// always reset the localState.state
	localState.state = "";
}

function updateStatus(statusString)
{
	var status = getEle("status");
	status.innerHTML = statusString;
}

function getEle(element)
{
	return document.getElementById(element);
}

function init() 
{
	// When API is ready...                                                         
	gapi.hangout.onApiReady.add(
		function(eventObj) 
		{
			if (eventObj.isApiReady) 
			{
				getEle('pmStart').style.display = 'block';

				gapi.hangout.data.onStateChanged.add( 
					function(event) 
					{
						localState = JSON.parse(gapi.hangout.data.getValue("state"));

						//getEle("pingDiv").innerHTML = "ping with state = " + localState.state 

						handleNewState();
					});
			}
		}
	);
}

// Wait for gadget to load.                                                       
gadgets.util.registerOnLoadHandler(init);