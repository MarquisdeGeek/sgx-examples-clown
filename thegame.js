/**
 * @constructor
 */
 function CETCGame_Clown() {
	this.m_pSurface = sgx.graphics.DrawSurfaceManager.get().getDisplaySurface();
	this.m_pRumbleMinorEvent = this.m_pRumbleLostLife = this.m_pRumbleEndGame = NULL;
}

CETCGame_Clown.MAX_GAME_SCREENS				=7
CETCGame_Clown.GAME_SCREEN_HARDWARE_BACK	=	0
CETCGame_Clown.GAME_SCREEN_HARDWARE_EDGE	=	1
CETCGame_Clown.GAME_SCREEN_BACKING			=	2
CETCGame_Clown.GAME_SCREEN_CONTROL			=	3
CETCGame_Clown.GAME_SCREEN_OVERLAY			=	4
CETCGame_Clown.GAME_SCREEN_INTERFACE		=	5


CETCGame_Clown.MAX_BALL_ARCS	=3
CETCGame_Clown.MAX_BALLS		=5

CETCGame_Clown.GAME_MODE_1		=0
CETCGame_Clown.GAME_MODE_2		=1

// BASE

CETCGame_Clown.STATE_CONSTRUCTOR	 = 0;
CETCGame_Clown.STATE_LOADING		 = 1;
CETCGame_Clown.STATE_INITIALIZE	 = 2;
CETCGame_Clown.STATE_CONTROL_BASE	 = 10;
CETCGame_Clown.	STATE_VIEWING_RULES		 = 11;
CETCGame_Clown.	STATE_INGAME_MENU			 = 11;

CETCGame_Clown.STATE_GAME_PLAY_MODES			 = 15;
CETCGame_Clown.	STATE_FLIP_TO_GAME			 = 15;
CETCGame_Clown.	STATE_FLIP_TO_RULES			 = 17;
CETCGame_Clown.	STATE_UNPAUSE_GAME			 = 18;
CETCGame_Clown.	STATE_GAME_BEGIN			=	19;	// mini intro sequence
CETCGame_Clown.	STATE_GAME_BEGIN_START		=	24;	// i.e. start new game using existing = parameters;
CETCGame_Clown.	STATE_GAME_FIRST_FRAME		=	20;	// i.e. post-'donk', start music = going;
CETCGame_Clown.STATE_GAME_ACTIVE_STATES = 25;
CETCGame_Clown.STATE_GAME_PLAY_BASE	 = 30;
CETCGame_Clown.STATE_GAME_EXIT			 = 29;
CETCGame_Clown.STATE_GAME_OVER			=	28;			// switch on all = lights;
CETCGame_Clown.STATE_GAME_LIFE_LOST		=27;			// stop music, = pause;
CETCGame_Clown.STATE_GAME_START_NEW_LIFE = 26;


// CLOWN
CETCGame_Clown.STATE_CLOWN_GAME_PLAY	=	(CETCGame_Clown.STATE_GAME_PLAY_BASE+0)
CETCGame_Clown.STATE_CLOWN_GAME_END		=	(CETCGame_Clown.STATE_GAME_PLAY_BASE+2)
CETCGame_Clown.STATE_CLOWN_AWAIT_BAMN_END =	(CETCGame_Clown.STATE_GAME_PLAY_BASE+4)

CETCGame_Clown.HANDS_AT_LEFT		=0
CETCGame_Clown.HANDS_AT_CENTER		=1
CETCGame_Clown.HANDS_AT_RIGHT		=2

CETCGame_Clown.prototype.getLight = function(uid, param) {
	if (param == undefined) {	// is a single string, in uid
		var crc = sgxGetCRC32(uid);
		for(var idx in this.m_LightInfo) {
			var light = this.m_LightInfo[idx];
			if (light.m_pWidget.getUserData() == uid || light.m_pWidget.getUserData() == crc) {
				return light;
			}
		}
		return null;
	}
	// it's ID & idx
	//var str;
	var str = sgxStringFormat(str, "%s%d", uid, param);
	return this.getLight(str);
}




etcLightState = function(pWidget, pAnimationData) {
	this.m_pWidget = pWidget;
	this.m_bOldState = this.m_bState = FALSE;
	this.m_pAnimState = sgx.graphics.AnimationManager.get().createState();		
	this.m_pAnimState.setAnimationDataSet(pAnimationData);
	this.m_pAnimState.startSequence("off");
	this.m_iNumVaryingFrames = pAnimationData.getSequence("turn_on").getFrameCount();
}

etcLightState.prototype.toggle = function() {
	this.setState(!this.m_bState);
}

etcLightState.prototype.setState = function(newState,  forDuration) {
	if (forDuration == undefined) {
		forDuration = -1;
	}
	
	this.m_bState = newState;
	if (forDuration == -1) {
		this.m_fDuration = -1;
	} else if (this.m_fDuration < 0) {
		this.m_fDuration = forDuration;
	} else {
		this.m_fDuration += forDuration;
	}
}

etcLightState.prototype.startAnimation = function(pAnimName) {
	this.m_pAnimState.startSequence(pAnimName);
	this.m_bOldState = this.m_bState;
}

etcLightState.prototype.update = function(telaps) {
	if (this.m_bState != this.m_bOldState) {
		if (this.m_bState) {
			this.startAnimation("turn_on");
		} else {
			this.startAnimation("turn_off");
		}
	} else {
		this.m_pAnimState.update(telaps);
	}
	//
	if (this.m_fDuration < 0) {
		// NULL: we keep light on until further notice, so don't check
	} else {
		this.m_fDuration -= this.m_fDuration;
		if (this.m_fDuration < 0) {
			this.toggle();
		}
	}

}

etcLightState.prototype.draw = function(pSurface) {
	var cell = this.m_pAnimState.getCurrentCell();

	var pt;
	var rc = new sgx.Rect2f();
	this.m_pWidget.getArea(rc);

	var pImageWidget = this.m_pWidget.asStaticImage();

	if (pImageWidget) {
		var region = pImageWidget.getTextureRegion();
		var pTexture = pImageWidget.getTexture();

 		pSurface.setFillColor(1,1,1, cell?1:0.1);

		pSurface.setFillTexture(pTexture, region);
		pSurface.fillRect(rc);	
	}

}


// BASE
CETCGame_Clown.prototype.playMusic = function() {
	//sgx.audio.Engine.get().playSound("music");
}
CETCGame_Clown.prototype.stopMusic = function() {}

CETCGame_Clown.prototype.changeState = function(newState) {
	this.endState(this.m_GameState);
	this.beginState(newState);
	this.m_GameState = newState;
}

CETCGame_Clown.prototype.beginState = function(newState) {

	switch(newState) {
		case CETCGame_Clown.STATE_GAME_BEGIN:
			this.setLightState(this.m_LightInfo, TRUE);
			this.m_fTimeCum = 0;
			this.m_iStateParam = 0;
			sgx.audio.Engine.get().playSound("lefthit2");
			break;
			
		case CETCGame_Clown.STATE_GAME_BEGIN_START:
			this.setLightState(this.m_LightInfo, FALSE);
			this.stopMusic();
			this.m_pStartGameSting = sgx.audio.Engine.get().playSound("startgame");
			this.startGame();
			break;
		case CETCGame_Clown.STATE_GAME_LIFE_LOST:
			this.stopMusic();
			this.m_fLifeLostDelay = 2.0;
			if (m_iLives == 0) {
				this.m_bEndGameNow = TRUE;
			} else {
				this.m_bEndGameNow = FALSE;
				sgx.audio.Engine.get().playSound("endlife");
				this.playRumble(this.m_pRumbleLostLife);
				--this.m_iLives;
			}
			break;

		case CETCGame_Clown.STATE_GAME_START_NEW_LIFE:
			sgx.audio.Engine.get().playSound("newlife");
			this.playRumble(this.m_pRumbleMinorEvent);
			this.playMusic();
			this.restartGame();
			break;

		case CETCGame_Clown.STATE_GAME_OVER:
			this.setLightState(this.m_LightInfo, TRUE);	// all on
			this.stopMusic();
			sgx.audio.Engine.get().playSound("endgame");
			this.playRumble(this.m_pRumbleEndGame);
			break;
	}

}

CETCGame_Clown.prototype.endState = function(newState) {

}


CETCGame_Clown.prototype.setLightState = function(lightList, state) {
	if (lightList instanceof Array) {
		for(var idx in lightList) {
			this.setLightState(lightList[idx], state);
		}
		return;
	}
	if (lightList) {
		lightList.setState(state);
	}
}

CETCGame_Clown.prototype.processLights = function(telaps) {
	for(var idx in this.m_LightInfo) {
		this.m_LightInfo[idx].update(telaps);
	}
}


CETCGame_Clown.prototype.update = function(telaps) {
	if (!this.m_bIsLoaded) {
		if (this.m_pDesign.isLoaded() && this.m_pAnimation.isLoaded()) {
			this.postLoadInit();
		}
		return;
	}

	switch(this.m_GameState) {
		case CETCGame_Clown.STATE_GAME_BEGIN:
			this.m_fTimeCum += telaps;
			if (this.m_fTimeCum > 1.5) {
				this.m_fTimeCum = 0;
				
				switch(this.m_iStateParam) {
					case 0:
						this.m_iStateParam = 1;
						this.setLightState(this.m_LightInfo, FALSE);
						sgx.audio.Engine.get().playSound("lefthit1");
						break;
					case 1:
						this.changeState(CETCGame_Clown.STATE_GAME_BEGIN_START);
						sgx.audio.Engine.get().playSound("newball");
						break;
				}
			}
			this.processLights(telaps);
			return;
				
		case CETCGame_Clown.STATE_GAME_LIFE_LOST:
			this.processLights(telaps);
			this.m_fLifeLostDelay -= telaps;
			if (this.m_fLifeLostDelay < 0) {
				this.changeState(this.m_bEndGameNow ? CETCGame_Clown.STATE_GAME_OVER : CETCGame_Clown.STATE_GAME_START_NEW_LIFE);
			}
			break;

		case CETCGame_Clown.STATE_GAME_START_NEW_LIFE:
			this.processLights(telaps);
			this.changeState(CETCGame_Clown.STATE_GAME_PLAY_BASE);
			break;

		case CETCGame_Clown.STATE_GAME_OVER:
			this.processLights(telaps);	// give time for the LCD's to light
			break;

	}
	//
	// Call the game-specific update loop
	if (true) {
		this.m_bPseudoFrameTrigger = FALSE;
			
		this.processLights(telaps);
	
		this.m_fScoreUpdateTimecum += telaps * this.m_fScoreUpdateSpeed;
		if (this.m_fScoreUpdateTimecum > 1.0) {
			if (this.m_iDisplayedScore < this.m_iScore) {
				++this.m_iDisplayedScore;
			} else if (this.m_iDisplayedScore > this.m_iScore) {
				--this.m_iDisplayedScore;
			}
			this.m_fScoreUpdateTimecum = 0;
		}

		this.m_fPseudoTimecum += telaps;
		if (this.m_fPseudoTimecum > this.m_fPseudoPeriod) {
			this.m_fPseudoTimecum -= this.m_fPseudoPeriod;
			this.m_bPseudoFrameTrigger = TRUE;
		}
		//
		this.updateGame(telaps);
	}
}

CETCGame_Clown.prototype.addScore = function(scoreIncrement)	{
	this.m_iScore += scoreIncrement;

	if (this.m_iScore < 0) {
		this.m_iScore = 0;
	}
}


//
// CLOWN
//
CETCGame_Clown.prototype.initialize = function() {
	var pSoundlist = [
		// clown
		"audio/boom",
		"audio/lefthit1",
		"audio/lefthit2",
		"audio/lefthit3",
		"audio/endgame",
		"audio/righthit1",
		"audio/righthit2",
		"audio/righthit3",
		"audio/newball",
		// base
		"audio/startgame",
		"audio/music",
		"audio/move1",
		"audio/move2",
		"audio/move3",
		"audio/move4",
		"audio/newlife",
		"audio/endlife",
		"audio/endgame"
	];

	this.m_LightInfo = new Array();
	this.m_pSndLeftHit = new Array();
	this.m_pSndRightHit = new Array();
	this.m_Balls = new Array(CETCGame_Clown.MAX_BALLS);
	for(var idx=0;idx<CETCGame_Clown.MAX_BALLS;++idx) {
		this.m_Balls[idx] = new JuggleBall();
	}
	
	this.m_pDesign = sgxutils.gui.DesignManager.load("game/design");
	this.m_bIsLoaded = false;

	this.m_pInfoDigits = sgx.graphics.TextureManager.get().registerScenarioTexture("etcstd/info");
	this.m_pAnimation = sgx.graphics.AnimationManager.get().loadData("etcstd/light_anim");

	for(var i=0;i<pSoundlist.length;++i) {
		sgx.audio.Engine.get().registerGlobalSound(pSoundlist[i]);
	}
	for(var i=0;i<3;++i) {
		var str;
		str= sgxStringFormat(str, "lefthit%d", i+1);
		this.m_pSndLeftHit.push(sgx.audio.Engine.get().getSampleData(str));
		str = sgxStringFormat(str, "righthit%d", i+1);
		this.m_pSndRightHit.push(sgx.audio.Engine.get().getSampleData(str));
	}

}

var g_pSecond;
CETCGame_Clown.prototype.postLoadInit = function() {
g_pSecond = sgx.graphics.DrawSurfaceManager.get().createSurface(320,200);
g_pSecond.m_X=200;
g_pSecond.m_Y=120;


// base
	this.m_pRootFrame = new Array();
	for(var i=0;i<this.m_pDesign.getScreenCount();++i) {
		var pScr = this.m_pDesign.getScreen(i);
		this.m_pRootFrame.push(pScr ? pScr.applyScreen() : NULL);
	}

	this.m_pRootBack = this.m_pRootFrame[CETCGame_Clown.GAME_SCREEN_HARDWARE_BACK];
	this.m_pRootEdge = this.m_pRootFrame[CETCGame_Clown.GAME_SCREEN_HARDWARE_EDGE];
	this.m_pRootBack.setHandler(this, TRUE);
	
	var idx = 0;
	var p;
	while((p = this.m_pRootFrame[CETCGame_Clown.GAME_SCREEN_CONTROL].getChildWidget(idx))) {
		this.m_LightInfo.push(new etcLightState(p, this.m_pAnimation));
		++idx;
	}

	this.m_fPseudoPeriod = 1/10.0;
	
	this.m_ScorePos = new sgx.Point2f();
	this.m_LivesPos = new sgx.Point2f();
	var p = this.m_pRootFrame[CETCGame_Clown.GAME_SCREEN_INTERFACE].getWidgetOfUserData("score");
	if (p) {
		p.getPosition(this.m_ScorePos);
	} else {
		this.m_ScorePos.x = this.m_ScorePos.y = -1;
	}
	//
	p = this.m_pRootFrame[CETCGame_Clown.GAME_SCREEN_INTERFACE].getWidgetOfUserData("lives");
	if (p) {
		p.getPosition(this.m_LivesPos);
	} else {
		this.m_LivesPos.x = this.m_LivesPos.y = -1;
	}

	sgx.gui.Engine.get().setRootWidget(this.m_pRootFrame[CETCGame_Clown.GAME_SCREEN_INTERFACE]);
	this.m_pRootFrame[CETCGame_Clown.GAME_SCREEN_INTERFACE].setHandler(this, TRUE);

//clown
	
	// Everything is now loaded. Let's re-arrange into a nice order
	// that make more sense for our game...
	var idx;
	this.m_BallArcs = new Array(CETCGame_Clown.MAX_BALL_ARCS);
	for(idx = 0;idx<CETCGame_Clown.MAX_BALL_ARCS;++idx) {
		this.m_BallArcs[idx] = new BallArc(this, idx);
		this.m_BallArcs[idx].m_pBackPtr = this;
	}
	//
	this.m_BallIntroduceRate = new Array(5);
	this.m_BallIntroduceRate[1] = 12;
	this.m_BallIntroduceRate[2] = 60;
	this.m_BallIntroduceRate[3] = 100;
	this.m_BallIntroduceRate[4] = 150;
	//

	idx = 0;
	var p;
	this.m_pHandStates = new Array();
	while((p = this.getLight('h', idx)) != NULL) {
		this.m_pHandStates.push(p);
		++idx;
	}
	//
	
	// complete
	this.m_bIsLoaded = true;
	this.changeState(CETCGame_Clown.STATE_GAME_BEGIN);
	this.prepareGameMode(CETCGame_Clown.GAME_MODE_1);
	this.startGame();	
}

CETCGame_Clown.prototype.getMaxLives = function() {
	return 3;
}

CETCGame_Clown.prototype.livesFromLeft = function() {
	return true;
}



CETCGame_Clown.prototype.writeDigits = function(position, value) {

	var pos = new sgx.Point2f(position);
	var str;
	str = sgxStringFormat(str, "%.2d", value%100);
	var idx=0;
	while(idx<str.length) {
		var r = str.charCodeAt(idx)-48;
		this.m_pSurface.setFillColor(sgxColorRGBA.White);
		this.m_pSurface.setFillTexture(this.m_pInfoDigits, r);
		this.m_pSurface.fillPoint(pos, sgx.graphics.DrawSurface.eFromTopLeft);
		pos.x += this.m_pInfoDigits.getRegionWidth(r);
		++idx;

	}
}

CETCGame_Clown.prototype.drawGameScreen = function() {

	// Lights
	this.m_pSurface.setFillColor(sgxColorRGBA.White);

	for(var idx in this.m_LightInfo) {
		var cit = this.m_LightInfo[idx];
		cit.draw(this.m_pSurface);
 	}

	// Score
	if (this.m_pInfoDigits && this.m_ScorePos.x != -1) {
		this.writeDigits(this.m_ScorePos, this.m_iScore);
	}

	if (this.m_pInfoDigits && this.m_LivesPos.x != -1) {
		var pos = new sgx.Point2f(this.m_LivesPos);
		var maxLives = this.getMaxLives();
		var fromLeft = this.livesFromLeft();
		for(var i=maxLives;i>0;--i) {
			this.m_pSurface.setFillColor(sgxColorRGBA.White);
			this.m_pSurface.setFillTexture(this.m_pInfoDigits, fromLeft ? (this.m_iLives>=i?10:12) : (this.m_iLives>maxLives-i?10:12));
			this.m_pSurface.fillPoint(pos, sgx.graphics.DrawSurface.eFromTopLeft);
			pos.x += this.m_pInfoDigits.getRegionWidth(10);
		}
	}
}

CETCGame_Clown.prototype.draw = function() 
{
	if (!this.m_bIsLoaded) {
		return;
	}

	var frame = this.m_pRootFrame[CETCGame_Clown.GAME_SCREEN_BACKING];
	frame.draw(this.m_pSurface, 0,0);
	//
	this.drawGameScreen();
	// All other layers
	for(var i=CETCGame_Clown.GAME_SCREEN_OVERLAY;i<6;++i) {
		if (this.m_pRootFrame[i]) {
			this.m_pRootFrame[i].draw(this.m_pSurface, 0,0);
		}
	}
	
	sgx.gui.Engine.get().draw();
}

BallArc = function(pWorld, arcIdx) {
	var id =  String.fromCharCode(97+arcIdx);// was 'a'+arcIdx;
	this.m_iArcIndex = arcIdx;
	var p;
	var idx = 0;
	this.m_pBallStates = new Array();
	while((p = pWorld.getLight(id, idx)) != NULL) {
		this.m_pBallStates.push(p);
		++idx;
	}
}


BallArc.prototype.getSize = function()  {
	return this.m_pBallStates.length;
}

JuggleBall = function() {
}

JuggleBall.prototype.init = function( pArc,  dir) {
	this.m_iDirection = dir;
	this.m_fTimerCum = 0;
	this.m_fBaseSpeed = 3.0 + sgxRand()*0.6;
	this.m_fSpeed = this.m_fBaseSpeed;
	this.m_pBallArc = pArc;

	if (this.m_iDirection < 0) {
		this.m_iPosition = pArc.getSize()-3;
	} else {
		this.m_iPosition = 1;
	}
}

JuggleBall.prototype.relaunch = function() {
	this.m_fSpeed = this.m_fBaseSpeed * (1.0 + sgxRand(-20,20)/100.0);
}


JuggleBall.prototype.update = function( telaps) {
	this.m_fTimerCum += this.m_fSpeed * telaps;
	if (this.m_fTimerCum > 1.0) {
		this.m_fTimerCum = 0;
		var sz = this.m_pBallArc.getSize();
		//
		if (this.m_iDirection > 0) {
			if (++this.m_iPosition == sz) {
				this.m_iPosition = sz-1;
				return TRUE;
			}
		} else {
			if (this.m_iPosition-- == 0) {
				this.m_iPosition = 0;
				return TRUE;
			}
		}
		// 
		var changeLanes = FALSE;
		var midpoint = sz/2;
		if (this.m_iPosition == midpoint) {
			if (sgxRand(0,100) < 40) {
				changeLanes = TRUE;
			}
		} else if (this.m_iPosition == midpoint-1 || this.m_iPosition == midpoint+1) {
			if (sgxRand(0,100) < 7) {
				//changeLanes = TRUE;
			}
		}
		//
		if (changeLanes) {
			var idx = 1-this.m_pBallArc.m_iArcIndex;

			this.m_pBallArc = this.m_pBallArc.m_pBackPtr.m_BallArcs[idx];
		}
		return TRUE;
	}
	return FALSE;
}

 	
BallArc.prototype.destroy = function() {

}

 	
CETCGame_Clown.prototype.startGame = function() {
	//CETCGame_Base.startGame();
//	this.setLightState(this.m_LightInfo, FALSE);	// all off
	this.m_fPseudoTimecum = 0;
	this.m_iLives = this.getMaxLives();
	this.m_iScore = this.m_iDisplayedScore = 0;
	this.m_fScoreUpdateTimecum = 0;
	this.m_fScoreUpdateSpeed = 1.0;
	this.m_bNewHighScore = FALSE;
	this.m_fBackPanelTimeLockSound = this.m_fBackPanelTimeLockMusic = this.m_fBackPanelTimeLockVibra = 0;

	// clown
	this.m_iHandsPosition = CETCGame_Clown.HANDS_AT_LEFT;
	this.m_iBallsOnRestart = this.m_iBallsInGameMode;

	this.restartGame();
}

 	
CETCGame_Clown.prototype.restartGame = function() {
//	this.setLightState(this.m_LightInfo, FALSE);	// all off

	this.m_fScoreIncTimecum = 0;
	this.m_fTimecumNewBall = 0;
	this.m_iBallsInPlay = 0;

	this.changeClownState(CETCGame_Clown.STATE_CLOWN_GAME_PLAY);

	for(var idx=0;idx<CETCGame_Clown.MAX_BALLS;++idx) {
		this.m_Balls[idx].m_pBallArc = NULL;
	}
	//
	for(var idx=0;idx<this.m_iBallsOnRestart;++idx) {
		this.introduceNewBall();
	}
}

 	
CETCGame_Clown.prototype.introduceNewBall = function() {
	var direction = 1;
	for(var idx=0;idx<CETCGame_Clown.MAX_BALLS;++idx) {
		if (this.m_Balls[idx].m_pBallArc) {
			direction = -this.m_Balls[idx].m_iDirection;
		} else {
			this.m_Balls[idx].init(this.m_BallArcs[idx&1], direction);
			++this.m_iBallsInPlay;
			break;
		}
	}
}

 
CETCGame_Clown.prototype.prepareGameMode = function(  mode) {
	//CETCGame_Base.prepareGameMode(mode);
	this.m_iBallsInGameMode = mode==0?1:2;
}

  	
CETCGame_Clown.prototype.changeClownState = function(  newState) {
	this.endClownState(this.m_ClownState);
	this.beginClownState(newState);
	
	this.m_ClownState = newState;
}

 	
CETCGame_Clown.prototype.beginClownState = function(  state) {

	switch(state) {
			
		case CETCGame_Clown.STATE_CLOWN_GAME_END:
			for(var blam=0;blam<5;++blam) {
				blamID = "blam"+(1+blam);
				this.getLight(blamID).startAnimation(blamID);
			}
			break;
			
		case CETCGame_Clown.STATE_CLOWN_GAME_PLAY:
		case CETCGame_Clown.STATE_CLOWN_AWAIT_BAMN_END:
			// turn off blam light
			for(var blam=0;blam<5;++blam) {
				blamID = "blam"+(blam+1);
				this.getLight(blamID).startAnimation("turn_off");
			}
			break;
	}
}

 	
CETCGame_Clown.prototype.endState = function( state) {
 	}
	
CETCGame_Clown.prototype.endClownState = function( state) {


	switch(state) {
		case CETCGame_Clown.STATE_CLOWN_GAME_END:
			for(var blam=0;blam<5;++blam) {
				blamID = "blam"+(blam+1);
				this.getLight(blamID).startAnimation("off");
			}
			break;
	}
}


	
CETCGame_Clown.prototype.updateGame = function(telaps) {
	
	this.setLightState(this.getLight("clown_body"), TRUE);

	this.setLightState(this.m_pHandStates, FALSE);
	this.setLightState(this.m_pHandStates[this.m_iHandsPosition*2+0], TRUE);
	this.setLightState(this.m_pHandStates[this.m_iHandsPosition*2+1], TRUE);

	switch(this.m_ClownState) {
		case CETCGame_Clown.STATE_CLOWN_GAME_PLAY:

			// this.add some score
			this.m_fScoreIncTimecum += telaps;
			if (this.m_fScoreIncTimecum > 1.0) {	// every second give the player a point...
				this.m_fScoreIncTimecum = 0;
				this.addScore(1);
				// ... and increase the speed
				for(var idx=0;idx<CETCGame_Clown.MAX_BALLS;++idx) {
					if (this.m_Balls[idx].m_pBallArc) {
						this.m_Balls[idx].m_fBaseSpeed *= 1.03;
					}
				}
			}
			//
			this.m_fTimecumNewBall += telaps / this.m_BallIntroduceRate[this.m_iBallsInPlay];
			if (this.m_fTimecumNewBall > 1.0) {
				this.introduceNewBall();
				this.m_fTimecumNewBall = 0;
				this.m_iBallsOnRestart = this.m_iBallsInPlay;
				sgx.audio.Engine.get().playSound("newball");
			}
			//
			for(var idx=0;idx<CETCGame_Clown.MAX_BALLS;++idx) {
				if (this.m_Balls[idx].m_pBallArc) {
					this.m_Balls[idx].m_pBallArc.m_pBallStates[this.m_Balls[idx].m_iPosition].setState(FALSE);

					var bExtent = this.m_Balls[idx].update(telaps);

					// There are 4 positions of interest:
					// 0 = bamn!(uncoverable)
					// 1 = return throw?
					// N-2 = return throw
					// N-1 = bamn! (uncoverable)
					var pos = this.m_Balls[idx].m_iPosition;
					// tINT32 &nextPos = pos + this.m_Balls[idx].m_iDirection;
					var arcSize = this.m_Balls[idx].m_pBallArc.getSize();
					var requiredArmPos = this.m_Balls[idx].m_pBallArc.m_iArcIndex;
					
					if (((bExtent && pos == 0) || pos==1) && this.m_iHandsPosition == requiredArmPos) {
						if (this.m_Balls[idx].m_iDirection != 1) {
							sgx.audio.Engine.get().playSound(this.m_pSndLeftHit[sgxRand(0,2)]);
							this.playRumble(this.m_pRumbleMinorEvent);
							this.m_Balls[idx].relaunch();
							this.m_Balls[idx].m_iDirection = 1;
							pos = 1;
						}
					} else if (((bExtent && pos == arcSize-1) || pos == arcSize-2) && this.m_iHandsPosition == 2-requiredArmPos) {
						if (this.m_Balls[idx].m_iDirection != -1) {
							sgx.audio.Engine.get().playSound(this.m_pSndRightHit[sgxRand(0,2)]);
							this.playRumble(this.m_pRumbleMinorEvent);
							this.m_Balls[idx].relaunch();
							this.m_Balls[idx].m_iDirection = -1;
							pos = arcSize-2;
						}
					} else if ((pos == 0 || pos == arcSize-1)) {

						this.playRumble(this.m_pRumbleLostLife);
						
						sgx.audio.Engine.get().playSound("boom");
						this.stopMusic();
						this.changeClownState(CETCGame_Clown.STATE_CLOWN_GAME_END);
					} 
					//
					this.m_Balls[idx].m_iPosition = pos;
					this.m_Balls[idx].m_pBallArc.m_pBallStates[this.m_Balls[idx].m_iPosition].setState(TRUE);
				}
				
			}
			break;

		case CETCGame_Clown.STATE_CLOWN_GAME_END:
			if (this.getLight("blam1").m_pAnimState.m_bExtent) {
				this.changeClownState(CETCGame_Clown.STATE_CLOWN_AWAIT_BAMN_END);
				this.setLightState(this.m_LightInfo, FALSE);
				if (this.m_iLives == 0) {
					this.changeState(CETCGame_Clown.STATE_GAME_OVER);
				} else {
					--this.m_iLives;
					this.changeState(CETCGame_Clown.STATE_GAME_START_NEW_LIFE);
				}
			}
			break;
			
		default:
			return;
	}

}

	
CETCGame_Clown.prototype.playRumble = function(rumble) {
	// No force feedback/rumblepak/etc on HTML5 :(
}
  	  	
CETCGame_Clown.prototype.onGUIWidgetSelectActive = function( pWidget) {
	//CETCGame_Base.onGUIWidthis.getSelectActive(pWidthis.get);

	var ctrl = pWidget.getUserData();
	this.processUI(ctrl);
}

CETCGame_Clown.prototype.onGUIWidgetSelect = function( pWidget) {
	//CETCGame_Base.onGUIWidthis.getSelectActive(pWidthis.get);

	var ctrl = pWidget.getUserData();
	this.processUI(parseInt(ctrl,10));
}

CETCGame_Clown.prototype.processUI = function(ctrl) {

	switch(ctrl) {
		case 1:
			if (this.m_iHandsPosition > CETCGame_Clown.HANDS_AT_LEFT) {
				--this.m_iHandsPosition;
			}
			break;
		case 2:
			if (this.m_iHandsPosition < CETCGame_Clown.HANDS_AT_RIGHT) {
				++this.m_iHandsPosition;
			}
			break;
		case 3:
			this.prepareGameMode(CETCGame_Clown.GAME_MODE_1);
			this.changeState(CETCGame_Clown.STATE_GAME_BEGIN);
			break;
		case 4:
			this.prepareGameMode(CETCGame_Clown.GAME_MODE_2);
			this.changeState(CETCGame_Clown.STATE_GAME_BEGIN);
			break;
	} 
	return TRUE;		
}
