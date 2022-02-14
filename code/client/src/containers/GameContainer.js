import React,{useEffect, useState} from 'react';
import GameGrid from '../components/GameGrid'
import HandList from '../components/HandList';
import SideBar from '../components/SideBar';
import Loading from '../components/Loading'
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd'

import {getData} from '../services/FetchService'
import {setUpPlayers, passTurn, checkForWin, winner, addScore, legalMove, flipEndCard, generateTurnDelay} from '../services/GameService'
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
    for (let step = 0; step < 9; step++){
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
          setTimeout
          (function() {
            players.push(players.shift())
            return setTurnToggle(!turnToggle)
          }, 100);
          // CPU turn
          if(players[0].type === "CPU"){
            // play turn
            setTimeout
            (function() {
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
              return setTurnToggle(!turnToggle)
            }, generateTurnDelay(750, 2200));
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
            setTurnToggle(!turnToggle)
          }
          
        }, [gameState, turnToggle])

  const reorderHand = (hand) => {
    setPlayerHand(hand)
  }

<<<<<<< HEAD
  const gridNeighbours = (row, col) => {
    let neighbours = []
    row = Number(row)
    col = Number(col)
    if (gridState[row - 1] !== undefined) {
      gridState[row - 1][col] !== undefined ? neighbours.push(Object.assign({}, gridState[row - 1][col])) : neighbours.push({})
    } else {
      neighbours.push({})
    }
    gridState[row][col + 1] !== undefined ? neighbours.push(Object.assign({}, gridState[row][col + 1])) : neighbours.push({})
    if (gridState[row + 1] !== undefined) {
      gridState[row + 1][col] !== undefined ? neighbours.push(Object.assign({}, gridState[row + 1][col])) : neighbours.push({})
    } else {
      neighbours.push({})
    }
    gridState[row][col- 1] !== undefined ? neighbours.push(Object.assign({}, gridState[row][col - 1])) : neighbours.push({})
    // [top, right, bottom, left]
    // console.log(neighbours)
    return neighbours
  }


  const neighboursEntries = (neighbours) => {
     //connects open or closed (true or false)
    let neighboursEntries = []
    // console.log(neighbours[0])
    // console.log(neighbours[1])
    // console.log(neighbours[2])
    // console.log(neighbours[3])
    if (Object.keys(neighbours[0]).length !== 0){
    neighbours[0].inverted ? neighboursEntries.push(neighbours[0].entries.top) : neighboursEntries.push(neighbours[0].entries.bottom)
    }else{neighboursEntries.push(null)}

    if (Object.keys(neighbours[1]).length !== 0){
    neighbours[1].inverted ? neighboursEntries.push(neighbours[1].entries.right) : neighboursEntries.push(neighbours[1].entries.left)
    }else{neighboursEntries.push(null)}

    if (Object.keys(neighbours[2]).length !== 0){
    neighbours[2].inverted ? neighboursEntries.push(neighbours[2].entries.bottom) : neighboursEntries.push(neighbours[2].entries.top)
    }else{neighboursEntries.push(null)}

    if (Object.keys(neighbours[3]).length !== 0){
    neighbours[3].inverted ? neighboursEntries.push(neighbours[3].entries.left) : neighboursEntries.push(neighbours[3].entries.right)
    }else{neighboursEntries.push(null)}

    // [top, right, bottom, left]
    // null for empty or boarder tiles
    // console.log(neighboursEntries)
    return neighboursEntries
  }

  // helper function for comparing arrays
  function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
  }

  const cardFitsNeighbours = (card, neighbours) => {
    let cardEntries = []
    if (card.inverted){
      cardEntries = [card.entries.bottom, card.entries.left, card.entries.top, card.entries.right]
    } else {
      cardEntries = [card.entries.top, card.entries.right, card.entries.bottom, card.entries.left ]
    }
    let resultNeighboursEntries = neighboursEntries(neighbours)

    // console.log(resultNeighboursEntries)
    // console.log(cardEntries)

    let results = []
    let i = 0
    for (let result of resultNeighboursEntries) {
      (result === null) ? results.push(true) : results.push(result === cardEntries[i])
      i += 1
    }
    // console.log(results)
    // console.log(arrayEquals(cardEntries, resultNeighboursEntries))

    return !results.includes(false)
  } 

  const boarderTileCard = (gridRow, gridCol) => {
    for (let neighbour of gridNeighbours(gridRow, gridCol)){
      if (Object.keys(neighbour).length !== 0){
        if (neighbour["name"].substring(0, 4) === "path" || neighbour["name"].substring(0, 5) === "start") return true
      }
    }
    return false
  }

  const checkIfMakesPath = (card, gridRow, gridCol) => {
    let tempNeighbours = []
    for (let neighbour of gridNeighbours(gridRow, gridCol)){
      if (Object.keys(neighbour).length === 0){
        tempNeighbours.push({})
      }
      else if (neighbour.name.substring(0, 4) !== "path" && neighbour.name.substring(0, 5) !== "start"){
        tempNeighbours.push({})
      }
      else {
        tempNeighbours.push(neighbour)
      }
      }
    let resultNeighboursEntries = neighboursEntries(tempNeighbours)
    let cardEntries = []
    if (card.inverted){
      cardEntries = [card.entries.bottom, card.entries.left, card.entries.top, card.entries.right]
    } else {
      cardEntries = [card.entries.top, card.entries.right, card.entries.bottom, card.entries.left ]
    }
    let results = []
    var i = 0
    for (let result of resultNeighboursEntries) {
      (result === true && cardEntries[i] === true ) ? results.push(true) : results.push(false)
      i += 1
    }
    return results.includes(true)
  }


  const checkFlipEndCard = (gridRow, gridCol) => {
    let row = Number(gridRow)
    let col = Number(gridCol)
    let tempGrid = Object.assign({}, gridState)
    let tempNeighbours = gridNeighbours(row, col)

      if (Object.keys(tempNeighbours[0]).length !== 0) {
        if (tempNeighbours[0].name.substring(0, 4) === "coal" || tempNeighbours[0].name.substring(0, 4) === "gold"){
          tempGrid[row - 1][col].flipped = false
        }
      }

      if (Object.keys(tempNeighbours[1]).length !== 0) {
        if (tempNeighbours[1].name.substring(0, 4) === "coal" || tempNeighbours[1].name.substring(0, 4) === "gold"){
          tempGrid[row][col + 1].flipped = false
        }
      }

      if (Object.keys(tempNeighbours[2]).length !== 0) {
        if (tempNeighbours[2].name.substring(0, 4) === "coal" || tempNeighbours[2].name.substring(0, 4) === "gold"){
          tempGrid[row + 1][col].flipped = false
        }
      }

      if (Object.keys(tempNeighbours[3]).length !== 0) {
        if (tempNeighbours[3].name.substring(0, 4) === "coal" || tempNeighbours[3].name.substring(0, 4) === "gold"){
          tempGrid[row][col - 1].flipped = false
        }
      }
    setGridState(tempGrid)
  }



=======
>>>>>>> 8160976
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

