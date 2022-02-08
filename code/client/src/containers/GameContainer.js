import React,{useEffect, useState} from 'react';
import GameGrid from '../components/GameGrid'
import HandList from '../components/HandList';
import SideBar from '../components/SideBar';
import Loading from '../components/Loading'
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd'
import { io } from 'socket.io-client'

import {getData} from '../services/FetchService'
import {setUpPlayers, passTurn, checkForWin, winner, addScore, legalMove, flipNeighbours} from '../services/GameService'
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
  const [playerTurns, setPlayerTurns] = useState([])
  const [playerTurn, setPlayerTurn] = useState({})
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

  const socket = io('http://localhost:5000', {
    transports: ["websocket", "polling"],
    rememberUpgrade: true,
    maxHttpBufferSize: 1e8,

  });

  useEffect(() => {
    socket.on('connect', ()=>console.log(socket.id))
    socket.on('connect_error', ()=>{
      setTimeout(()=>socket.connect(),5000)
    })
    return () => socket.off('connect')
}, [])

  useEffect (() => {
    getData()
    .then(data => setData(data[0]));

    setPlayerTurns(playerObjects);
  }, [])
  
  useEffect (() => {
    socket.on('receive-grid-state', gridState => {
      setGridState(gridState)
    })
    socket.on('receive-deck', deck => {
      setDeck(deck)
    })
    return () => {
      socket.off("receive-grid-state");
      socket.off("receive-deck")
    };
  }, [])

  
  useEffect(() => {
    if(Object.keys(data).length !== 0){
      setPlayers(Object.assign([], playerTurns));
      // shift out first object to set the player to start the game
      const playerTurn = playerTurns.shift();
      setPlayerTurn(playerTurn);
      buildDeck();
      buildCharDeck();
      placeStartCards();
      
    }
  }, [data])

  const buildDeck = () => {
    const deck = []
    const tile_cardData = Object.values(data.cards.tile_cards)
    // Might need to custimise this to reflect true numbers of individual cards!
    // 5x each tile card
    for (let step = 0; step < 7; step++){
      for (let card of tile_cardData)
        deck.push(Object.assign({}, card))
    }
    // const blockerCardData = Object.values(data.cards["blocker-cards"])
    // // 1x each blocker
    // for (let card of blockerCardData){
    //   deck.push(Object.assign({}, card))
    // }
    //randomize inverted
    for (let card of deck){
      card.inverted = Boolean(Math.round(Math.random()))
    }
    // Shuffle deck
    shuffleArray(deck);
    setDeck(deck);
    socket.emit('update-deck', deck);
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
    socket.emit('chart-deck', charDeck)
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
    let tempCoal = Object.assign({}, data.cards.coal_card)
    tempCoal.inverted = false
    startCardsArray.push(tempCoal)
    startCardsArray.push(Object.assign({}, data.cards.gold_card))
    startCardsArray.push(tempCoal)
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
    socket.emit('update-grid-state', gridState)
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
    let cpuHands = []
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

      const result = dealCPUhands(playerTurns, deck);
      setPlayerTurns(result[1]);
      setDeck(result[0]);
    }
    setButtonToggle(!buttonToggle)
    socket.emit('update-deck', deck)
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
    // CPU turn
    if(playerTurn.type === "CPU"){
      // play turn
      const cpuTurnResult = cpuTurn(playerTurn, gridState, deck) 
      setPlayerTurn(cpuTurnResult[0]);
      setGridState(cpuTurnResult[1]);
      setDeck(cpuTurnResult[2]);
      // check for win
      if(checkForWin(gridState, goldCardRef)) {
        winner(playerTurn)
        const result = addScore(players, playerTurn.name)
        setPlayers(result)
        setGameState(false)
      }
      // end turn
      const result = passTurn(playerTurn, playerTurns)
      //pass turn to next player
      setPlayerTurn(result[0]);
      setPlayerTurns(result[1]);
      setTimeout
      (function() {
        return setTurnToggle(!turnToggle)
      }, 100);
    }
    // starts Human turn
    if(playerTurn.active === false){
      const tempObj = Object.assign({}, playerTurn);
      tempObj.active = true;
      setPlayerTurn(tempObj);
      return
    }
    // ends Human turn
    if(playerTurn.active === true && playerHand.length < 5 ){
      // stop human from placing any more cards on grid
      const tempObj = Object.assign({}, playerTurn);
      tempObj.active = false;
      setPlayerTurn(tempObj);
      // check for win
      if(checkForWin(gridState, goldCardRef)) {
        winner(playerTurn)
        const result = addScore(players, playerTurn.name)
        setPlayers(result)
        setGameState(false)
      }
      // pass turn to next player
      const result = passTurn(playerTurn, playerTurns)
      setPlayerTurn(result[0]);
      setPlayerTurns(result[1]);
      // pick up a card
      dealCard();
      return setTurnToggle(!turnToggle)
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
        tempCpu.hand.push(tempDeck[0])
        tempDeck.shift()
        return [tempCpu, grid, tempDeck]
    }

    tempCpu.hand.splice([cpuPlayResult[2]], 1)
    tempCpu.hand.push(tempDeck[0])
    tempDeck.shift()
    const newGrid = cpuPlayResult[1]

    return [tempCpu, newGrid, tempDeck]

}


const cpuPlay = (hand, grid) => {
    let i = 0
    for (let card of hand){
      for (let col = 10; col > 0; col--){
        for (let row = 6; row > 0; row--){
          if (legalMove(card, row, col, gridState) === true){
            grid[row].splice(col, 1, hand[i])
            hand.splice(i, 1)
            grid = flipNeighbours(card, row, col, grid)
            return [hand, grid, i]
          }
        }
      }
    i += 1
    }
    return []
}

  function handleOnDragEnd(result){

    const playerID = result.source.droppableId.split("-").pop();

    if (!result.destination) return
    else if (result.destination.droppableId === "discard"){
      if(playerTurn.id === playerID && playerTurn.active === true){
        const items = Array.from(playerHand)
        items.splice(result.source.index, 1)
        reorderHand(items)
        // player places card on the grid -> toggle to trigger end of turn
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
      if(playerTurn.id === playerID && playerTurn.active === true){
        const cardBeingPickedUp = playerHand[result.source.index]
        const row = result.destination.droppableId.substring(5,6)
        const col = result.destination.droppableId.substring(7)
        if (legalMove(cardBeingPickedUp, row, col, Object.assign([], gridState)) === true){
          let tempArr = Object.assign([], gridState)
          tempArr[row].splice([col], 1, playerHand[result.source.index])
          tempArr = flipNeighbours(cardBeingPickedUp, row, col, tempArr)
          setGridState(tempArr)
          socket.emit('update-grid-state', gridState)
          //Discard from hand
          const items = Array.from(playerHand)
          items.splice(result.source.index, 1)
          reorderHand(items)
          // player places card on the grid -> toggle to trigger end of turn
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
          <SideBar deck={deck} charDeck={charDeck} backs={data.cards.card_backs} startClick={buttonToggle ? handleEndClick : handleStartClick} buttonToggle={buttonToggle} players={players} playerTurn= {playerTurn}/>

        </DragDropContext>
        
      </div>
    )
  }
  
}

export default GameContainer;

