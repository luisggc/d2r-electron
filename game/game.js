const sound = require("sound-play");
const path = require("path");
const store = require("../store/store.js")

let BUY_WARDS_LAST_CALL = 0
let LAST_GAME_TIME = 0
let STORE_DATA = store.getAllData()

let roshanConfig = {
  active: false,
  time: 0,
}

const handleRoshanConfig = (_event, newRoshanConfig) => {
  roshanConfig = {...roshanConfig, ...newRoshanConfig}
}

function storeChangeCallback(newValue, _oldValue) {
  const parsedNewValue = {}
  for (const key in newValue) {
    parsedNewValue[key] = JSON.parse(newValue[key])
  }
  STORE_DATA = parsedNewValue
}


const checkForRoshanAndAegis = (gameTime, deathTime) => {
  const	roshanMinTime = 469
	// roshanMinSpawnDelay := 480
	const roshanMaxTime = 659
	// roshanMaxSpawnDelay := 660
	const aegis2minWarnTime = 180
	const aegis30sWarnTime = 270

  if (deathTime+aegis2minWarnTime === gameTime) {
    const filePath = path.join(__dirname, "../sound/aegis-2min.mp3");
    sound.play(filePath);
  } 
  else if (deathTime+aegis30sWarnTime === gameTime) {
    const filePath = path.join(__dirname, "../sound/aegis-30s.mp3");
    sound.play(filePath);
  } 
  else if (deathTime+roshanMinTime === gameTime) {
    const filePath = path.join(__dirname, "../sound/roshan-min.mp3");
    sound.play(filePath);
  } 
  else if (deathTime+roshanMaxTime === gameTime) {
    const filePath = path.join(__dirname, "../sound/roshan-max.mp3");
    sound.play(filePath);
  } 

}

const checkForStack = (gameTime) => {
  const stackTime = 60
  const stackDelay = store.handleStoreGet(null, "stack").delay
  const stackAlertTime = stackTime - stackDelay 

  if ((gameTime-stackAlertTime)%stackTime === 0) {
    const filePath = path.join(__dirname, "../sound/stack.mp3");
    sound.play(filePath);
  }
} 

const checkForMidRunes = (gameTime) => {
  const midRunesTime = 120;
  const midRunesDelay = store.handleStoreGet(null, "midrunes").delay
  const midRunesAlertTime = midRunesTime - midRunesDelay

  if ((gameTime-midRunesAlertTime)%midRunesTime === 0) {
    const filePath = path.join(__dirname, "../sound/mid-rune.mp3");
    sound.play(filePath);
  }
}

const checkForBountyRunes = (gameTime) => {
  const bountyRunesTime = 180;
  const bountyRunesDelay = store.handleStoreGet(null, "bountyrunes").delay
  const bountyRunesAlertTime = bountyRunesTime - bountyRunesDelay 

  if ((gameTime-bountyRunesAlertTime)%bountyRunesTime === 0) {
    const filePath = path.join(__dirname, "../sound/bounty-runes.mp3");
    sound.play(filePath);
  }
}

const checkNeutralItems = (gameTime) => {
  const neutralItemsTime = [420, 1020, 1620, 2200, 3600]

  for (let i = 0; i < neutralItemsTime.length; i++) {
    if (gameTime === neutralItemsTime[i]) {
      const filePath = path.join(__dirname, `../sound/neutralTier${i+1}.mp3`);
      sound.play(filePath);
    }
  }
}

const checkForSmoke = (gameTime) => {
  const smokeTime = 420
  const smokeDelay = store.handleStoreGet(null, "smoke").delay
  const smokeAlertTime = smokeTime - smokeDelay

  if((gameTime-smokeAlertTime)%smokeTime === 0) {
    const filePath = path.join(__dirname, "../sound/smoke.mp3");
    sound.play(filePath);
  }

}

const checkForWards = (gameTime, wardCd) => {
  if (BUY_WARDS_LAST_CALL > gameTime) BUY_WARDS_LAST_CALL = 0
  const timeBetweenCalls = 30

  if (wardCd === 0 && (BUY_WARDS_LAST_CALL+timeBetweenCalls) <= gameTime) {
    const filePath = path.join(__dirname, "../sound/wards.mp3");
    sound.play(filePath);
    BUY_WARDS_LAST_CALL = gameTime
  }
  
}

const onNewGameEvent= async (gameEvent) => {
  if (gameEvent.map && gameEvent.map.game_state === 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS') {
    const gameTime = gameEvent.map.clock_time
    const wardsPurchaseCd = gameEvent.map.ward_purchase_cooldown
    if (LAST_GAME_TIME === gameTime) return
    if (LAST_GAME_TIME > gameTime) LAST_GAME_TIME = 0

    if (STORE_DATA.stack.active) {
      checkForStack(gameTime)
    }
    if(STORE_DATA.midrunes.active) {
      checkForMidRunes(gameTime)
    }
    if(STORE_DATA.bountyrunes.active) {
      checkForBountyRunes(gameTime)
    }
    if (STORE_DATA.neutral.active) {
      checkNeutralItems(gameTime)
    }
    if (STORE_DATA.smoke.active) {
      checkForSmoke(gameTime)
    }
    if (STORE_DATA.ward.active) {
      checkForWards(gameTime, wardsPurchaseCd)
    }
    if (roshanConfig.active && roshanConfig.time > 0) {
      checkForRoshanAndAegis(gameTime, roshanConfig.time)
    }

    LAST_GAME_TIME = gameTime
  }
}

store.onStoreChange(storeChangeCallback)

module.exports = {
  onNewGameEvent,
  handleRoshanConfig
}

