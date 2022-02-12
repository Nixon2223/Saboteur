import React,{useEffect, useState} from 'react';
import GameGrid from '../components/GameGrid'
import HandList from '../components/HandList';
import SideBar from '../components/SideBar';
import Loading from '../components/Loading'
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd'

import {getData} from '../services/FetchService'
import {setUpPlayers, passTurn, checkForWin, winner, addScore, legalMove, flipEndCard} from '../services/GameService'
import SplashContainer from './SplashContainer';

function GameContainer({player, playerObjects, gameType, roomID}) {
  
  const [data, setData] = useState({});
  const [buttonToggle, setButtonToggle] = useState(false)
  const [clickToggle, setClickToggle] = useState(false)
  const [gameState, setGameState] = useState(false)
  const [playerHand, setPlayerHand] = useState([])
  const [playerChar, setPlayerChar] = useState({})
  const [goldCardRef, setGoldCardRef] = useState([])
  const [deck, setDeck] = useState([])
  const [charDeck, setCharDeck] = useState([])
  const [nuggDeck, setNuggDeck] = useState([])
  const [players, setPlayers] = useState([])
  const [turnToggle, setTurnToggle] = useState(true)
  const [gridState, setGridState] = useState([
      [ {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
      [ {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}], 
      [ {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}], 
      [ {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}], 
      [ {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}], 
      [ {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}], 
      [ {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]    
  ])

  useEffect (() => {
    getData()
    .then(data => setData(data[0]));
  }, [])
 
  useEffect(() => {
    if(Object.keys(data).length !== 0){
      setPlayers(Object.assign([], playerObjects));
      buildDeck();
      buildCharDeck();
      placeStartCards();
      
    }
  }, [data])

  const buildDeck = () => {
    const deck = []
    const tile_cardData = Object.values(data.cards.tile_cards)
    // Might need to custimise this to reflect true numbers of individual cards!
    // 7x each tile card
    for (let step = 0; step < 7; step++){
      for (let card of tile_cardData)
        deck.push(Object.assign({}, card))
    }
    const blockerCardData = Object.values(data.cards["blocker-cards"])
    // 1x each blocker
    for (let card of blockerCardData){
      deck.push(Object.assign({}, card))
    }
    //randomize inverted
    for (let card of deck){
      card.inverted = Boolean(Math.round(Math.random()))
    }
    // Shuffle deck
    shuffleArray(deck);
    setDeck(deck);
  }

  const shuffleArray = (array) => {
    let currentIndex = array.length,  randomIndex
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array
  }

  const buildCharDeck = () => {
    const minDeck = Object.values(data.cards.player_cards.minner);
    const sabDeck = Object.values(data.cards.player_cards.saboteur);
    const tempDeck = [...minDeck, ...sabDeck]
    // shuffle chart card
    const shuffledDeck = shuffleCharArray(tempDeck);
    setCharDeck(shuffledDeck);
  }
 // shuffle charArray function
  const shuffleCharArray = (array) => {
    let currentIndex = array.length, randomIndex
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
    }
    return array
  }
  
  const placeStartCards = () => {
    let goldCardRef = []
    const tempArr = gridState
    let startCardsArray = []
    let tempCoal1 = Object.assign({}, data.cards.coal_card)
    let tempCoal2 = Object.assign({}, data.cards.coal_card)
    startCardsArray.push(tempCoal1)
    startCardsArray.push(Object.assign({}, data.cards.gold_card))
    startCardsArray.push(tempCoal2)
    shuffleArray(startCardsArray)
    tempArr[3].splice(1, 1, Object.assign({}, data.cards["start-card"]))
    tempArr[1].splice(9, 1, startCardsArray[0])
    tempArr[3].splice(9, 1, startCardsArray[1])
    tempArr[5].splice(9, 1, startCardsArray[2])
    if(startCardsArray[0].name === "gold_card") goldCardRef = [1, 9]
    if(startCardsArray[1].name === "gold_card") goldCardRef = [3, 9]
    if(startCardsArray[2].name === "gold_card") goldCardRef = [5, 9]
    setGridState(tempArr)
    setGoldCardRef(goldCardRef)
  }

  const dealHand = () => {
    let tempArr = deck
    const hand = tempArr.splice(0,5)
    setPlayerHand(hand)
    setDeck(tempArr)
  }

  const dealCPUhands = (cpuPlayers, deck) => {
    let tempDeck = deck;
    let tempPlayers = cpuPlayers;
    console.log(tempPlayers)
    for (let i=0; i < tempPlayers.length; i++){
      tempPlayers[i].hand = tempDeck.splice(0,5)
    }
    return [tempDeck, tempPlayers]
  }

  const dealChar = () => {
    let tempArr = charDeck;
    const card = tempArr.shift()
    setPlayerChar(card)
    setCharDeck(tempArr)
  }

  const dealCard = () => {
    if(deck.length > 0){
      let tempArr = deck
      const card = tempArr.splice(0,1)
      let tempHand = Object.assign([], playerHand) 
      tempHand.push(card[0])
      setPlayerHand(tempHand)
      setDeck(tempArr)
    } 
  }


  const handleStartClick = () => {
    if(!data) return
    setGameState(true)
    dealHand();
    dealChar();
    // if single player mode deal CPU hands
    if(gameType === "single"){
      const result = dealCPUhands(players, deck);
      setDeck(result[0]);
    }
    setButtonToggle(!buttonToggle)
  }

  const handleEndClick = () => {
    if(window.confirm("Click 'OK' if you are sure you want to leave the game?")){
      window.location.reload(false);
    }
  }


    // controls players turns
    useEffect(() => {
      // Don't Start if false
      if(gameState === false) return
      //
      if(players[0].hand.length === 0)
      players.push(players.shift())
      setTimeout
      (function() {
        return setTurnToggle(!turnToggle)
      }, 100);
      // CPU turn
      if(players[0].type === "CPU"){
        // play turn
        const cpuTurnResult = cpuTurn(players[0], gridState, deck) 
        players[0] = cpuTurnResult[0];
        setGridState(cpuTurnResult[1]);
        setDeck(cpuTurnResult[2]);
        // check for win
        if(checkForWin(gridState, goldCardRef)) {
          winner(players[0])
          const result = addScore(players, players[0].name)
          setPlayers(result)
          setGameState(false)
        }
        // end turn
        players.push(players.shift())
        setTimeout
        (function() {
          return setTurnToggle(!turnToggle)
        }, 100);
      }

      // ends Human turn
      if(players[0].type === "human") if (players[0].active === false){
        // stop human from placing any more cards on grid
        const tempObj = Object.assign({}, players[0]);
        players[0] = tempObj
        // check for win
        if(checkForWin(gridState, goldCardRef)) {
          winner(players[0])
          const result = addScore(players, players[0].name)
          setPlayers(result)
          setGameState(false)
        }
        players[0].active = true
        // pick up a card
        dealCard();
        // pass turn to next player
        players.push(players.shift())
        setTimeout
        (function() {
          return setTurnToggle(!turnToggle)
        }, 100);
      }
      
    }, [gameState, turnToggle])

  const reorderHand = (hand) => {
    setPlayerHand(hand)
  }

  const cpuTurn = (cpuPlayer, grid, deck) => {
    const tempDeck = Object.assign([], deck);
    const tempCpu = Object.assign({}, cpuPlayer);
    const cpuPlayResult = cpuPlay(tempCpu.hand, grid);
    if(cpuPlayResult.length === 0){
        let randomIndex
        if(tempCpu.hand.length === 1) {
            randomIndex = 0
        } else {
            randomIndex = Math.floor(Math.random() * tempCpu.hand.length);
        }
        tempCpu.hand.splice(randomIndex, 1)
        if (tempDeck.length > 0) tempCpu.hand.push(tempDeck[0])
        tempDeck.shift()
        return [tempCpu, grid, tempDeck]
    }

    tempCpu.hand.splice([cpuPlayResult[2]], 1)
    if (tempDeck.length > 0) tempCpu.hand.push(tempDeck[0])
    tempDeck.shift()
    const newGrid = cpuPlayResult[1]

    return [tempCpu, newGrid, tempDeck]

}


const cpuPlay = (hand, grid) => {
    let i = 0
      for (let col = 10; col >= 0; col--){
        for (let row = 6; row >= 0; row--){
          for (let card of hand){
            let invertedCard = card
            invertedCard.inverted = !invertedCard.inverted
          if (legalMove(card, row, col, gridState) === true){
            grid[row].splice(col, 1, hand[i])
            grid = flipEndCard(card, row, col, grid)
            return [hand, grid, i]
          }
          if (legalMove(invertedCard, row, col, gridState) === true){
            grid[row].splice(col, 1, hand[i])
            grid = flipEndCard(card, row, col, grid)
            return [hand, grid, i]
          }
          i += 1
        }
        i = 0
      }
    
    }
    return []
}

  function handleOnDragEnd(result){

    const playerID = result.source.droppableId.split("-").pop();

    if (!result.destination) return
    else if (result.destination.droppableId === "discard"){
      if(players[0].id === playerID){
        const items = Array.from(playerHand)
        items.splice(result.source.index, 1)
        reorderHand(items)
        // player places card on the grid -> toggle to trigger end of turn
        players[0].active = false
        setTurnToggle(!turnToggle)
      }
      return
    }
    else if (result.destination.droppableId.split("-").shift() === "cards"){
      const items = Array.from(playerHand)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)
      reorderHand(items)
      return
    }
    else if (result.destination.droppableId.substring(0, 4) === "grid"){
      // if user is active and it's their turn
      if(players[0].id === playerID){
        const cardBeingPickedUp = playerHand[result.source.index]
        const row = result.destination.droppableId.substring(5,6)
        const col = result.destination.droppableId.substring(7)
        if (legalMove(cardBeingPickedUp, row, col, Object.assign([], gridState)) === true){
          let tempArr = Object.assign([], gridState)
          tempArr[row].splice([col], 1, playerHand[result.source.index])
          tempArr = flipEndCard(cardBeingPickedUp, row, col, tempArr)
          setGridState(tempArr)
          //Discard from hand
          const items = Array.from(playerHand)
          items.splice(result.source.index, 1)
          reorderHand(items)
          // player places card on the grid -> toggle to trigger end of turn
          players[0].active = false
          setTurnToggle(!turnToggle)
        } 
      } 
      return
    }
  }

  const handleOnClickInvert = (indexInHand) => {
    const tempArr = playerHand
    let card = tempArr[indexInHand]
    card.inverted = !card.inverted
    tempArr.splice(indexInHand, 1, card)
    setPlayerHand(tempArr)
    setClickToggle(!clickToggle);
  }

  if(Object.keys(data).length === 0){
    return <Loading/>
  } else {
    return (
      <div className= "game-container">

        <DragDropContext onDragEnd= {handleOnDragEnd}>

          <GameGrid  gridState={gridState}/>   
          <HandList player={player} cards={playerHand} char={playerChar} reorderHand = {reorderHand} handleOnClickInvert = {handleOnClickInvert}/> 
          <SideBar deck={deck} charDeck={charDeck} backs={data.cards.card_backs} startClick={buttonToggle ? handleEndClick : handleStartClick} buttonToggle={buttonToggle} players={players} playerTurn= {players[0]}/>

        </DragDropContext>
        
      </div>
    )
  }
  
}

export default GameContainer;

