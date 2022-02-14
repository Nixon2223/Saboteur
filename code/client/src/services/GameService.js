
export const setUpCPUPlayers = (playerNames) => {
    const players = playerNames.map((playerName, index) => {
        const player = playerName.replace(/\s/g, '');
        if(index ===0) return{index: index, id: player, name: playerName, type : "human", score: 0, active: true}
        else return {index: index, id: player, name: playerName, type : "CPU", hand : [], score: 0}
    })
    return players
}

export const getCPUPlayers = playerName => {
    const players = [playerName, "Myrlyl Blackfinger", "Grilthrum Smeltfoot", "Malnus Merryshatter", "Brytnyss Icebraid"]
    return players
}

export const passTurn = (turn, turns) => {

    turns.push(turn);
    const nextTurn = turns.shift();

    return [nextTurn, turns]
}
 
export const checkForWin = (gridState, goldCardRef) => {
    return !gridState[goldCardRef[0]][goldCardRef[1]].flipped
}

export const winner = (player) => {
    window.alert(`${player.name} is the winner!`)
}

export const addScore = (players, name) => {
    let tempPlayers = players;
    for(const tempPlayer of tempPlayers){
        if(tempPlayer.name == name){
            tempPlayer.score = 5
        }
    }
    return tempPlayers
}







const gridNeighbours = (row, col, gridState) => {
    let neighbours = []
    row = Number(row)
    col = Number(col)
    if (gridState[row - 1] !== undefined) {
      gridState[row - 1][col] !== undefined ? neighbours.push(gridState[row - 1][col]) : neighbours.push({})
    } else {
      neighbours.push({})
    }
    gridState[row][col + 1] !== undefined ? neighbours.push(gridState[row][col + 1]) : neighbours.push({})
    if (gridState[row + 1] !== undefined) {
      gridState[row + 1][col] !== undefined ? neighbours.push(gridState[row + 1][col]) : neighbours.push({})
    } else {
      neighbours.push({})
    }
    gridState[row][col- 1] !== undefined ? neighbours.push(gridState[row][col - 1]) : neighbours.push({})

    // [top, right, bottom, left]
    return neighbours
  }


  const neighboursEntries = (neighbours) => {
    let neighboursEntries = []
    if (Object.keys(neighbours[0]).length !== 0){
        if(neighbours[0].flipped !== true){
            neighbours[0].inverted ? neighboursEntries.push(neighbours[0].entries.top) : neighboursEntries.push(neighbours[0].entries.bottom)
        }else{neighboursEntries.push(null)}
    }else{neighboursEntries.push(null)}

    if (Object.keys(neighbours[1]).length !== 0){
        if(neighbours[1].flipped !== true){
            neighbours[1].inverted ? neighboursEntries.push(neighbours[1].entries.right) : neighboursEntries.push(neighbours[1].entries.left)
        }else{neighboursEntries.push(null)}
    }else{neighboursEntries.push(null)}

    if (Object.keys(neighbours[2]).length !== 0){
        if(neighbours[2].flipped !== true){
            neighbours[2].inverted ? neighboursEntries.push(neighbours[2].entries.bottom) : neighboursEntries.push(neighbours[2].entries.top)
        }else{neighboursEntries.push(null)}
    }else{neighboursEntries.push(null)}

    if (Object.keys(neighbours[3]).length !== 0){
        if(neighbours[3].flipped !== true){
            neighbours[3].inverted ? neighboursEntries.push(neighbours[3].entries.left) : neighboursEntries.push(neighbours[3].entries.right)
        }else{neighboursEntries.push(null)}
    }else{neighboursEntries.push(null)}

    // [top, right, bottom, left]
    // null for empty or boarder tiles
    return neighboursEntries
  }

  const cardFitsNeighbours = (card, neighbours) => {
    let cardEntries = []
    if (card.inverted){
      cardEntries = [card.entries.bottom, card.entries.left, card.entries.top, card.entries.right]
    } else {
      cardEntries = [card.entries.top, card.entries.right, card.entries.bottom, card.entries.left ]
    }
    let resultNeighboursEntries = neighboursEntries(neighbours)
    let results = []
    let i = 0
    for (let result of resultNeighboursEntries) {
      (result === null) ? results.push(true) : results.push(result === cardEntries[i])
      i += 1
    }
    return !results.includes(false)
  } 

  const boarderFlippedCard = (gridRow, gridCol, gridState) => {
    for (let neighbour of gridNeighbours(gridRow, gridCol, gridState)){
      if (Object.keys(neighbour).length !== 0){
        if (neighbour.flipped == false) return true
      }
    }
    return false
  }

  const connectionWithTile = (card, gridRow, gridCol, gridState) => {
    let resultNeighboursEntries = neighboursEntries(gridNeighbours(gridRow, gridCol, gridState))
    let resultGridNeighbours = gridNeighbours(gridRow, gridCol, gridState)
    let cardEntries = []
    if (card.inverted){
      cardEntries = [card.entries.bottom, card.entries.left, card.entries.top, card.entries.right]
    } else {
      cardEntries = [card.entries.top, card.entries.right, card.entries.bottom, card.entries.left ]
    }
    let results = []
    var i = 0
    for (let result of resultNeighboursEntries) {
      if (Object.keys(resultGridNeighbours[i]).length !== 0){
        (result === true && cardEntries[i] === true && resultGridNeighbours[i].name.substring(0,7) !== "blocker") ? results.push(true) : results.push(false)
      }else results.push(false)
      i += 1
    }
    //connects [top, right, bottom, left]
    return results.includes(true)
  }


export const flipEndCard = (card, gridRow, gridCol, gridState) => {
    let row = Number(gridRow)
    let col = Number(gridCol)
    let tempGrid = Object.assign([], gridState)
    let neighbours = gridNeighbours(row, col, tempGrid)

    let cardEntries = []
    if (card.inverted){
      cardEntries = [card.entries.bottom, card.entries.left, card.entries.top, card.entries.right]
    } else {
      cardEntries = [card.entries.top, card.entries.right, card.entries.bottom, card.entries.left ]
    }

    let i = 0
    for (let neighbour of neighbours){
        if (Object.keys(neighbour).length !== 0 && neighbour.flipped == true && cardEntries[i] == true) {
                if (card.name.substring(0,7) !== "blocker"){
                  neighbour.flipped = false
                  if (i === 0 && neighbour.entries.bottom !== true) neighbour.inverted = !neighbour.inverted
                  if (i === 1 && neighbour.entries.left !== true) neighbour.inverted = !neighbour.inverted
                  if (i === 2 && neighbour.entries.top !== true) neighbour.inverted = !neighbour.inverted
                  if (i === 3 && neighbour.entries.right !== true) neighbour.inverted = !neighbour.inverted
                }
        }
        i += 1
    }

    return tempGrid
  }


export const legalMove = (cardSelected, gridRow, gridCol, gridState) => {
    // check that card being placed boarders a tile card
    if (!boarderFlippedCard(gridRow, gridCol, gridState)) return
    // check if card makes path with at least one bordering card
    if (!connectionWithTile(cardSelected, gridRow, gridCol, gridState)) return 
    // check if card is already placed in grid location
    if (Object.keys(gridState[gridRow][gridCol]).length !== 0) return
    // check if card fits in grid position with neighbours
    else if (cardFitsNeighbours(cardSelected, gridNeighbours(gridRow, gridCol, gridState))){
      // check for end card
      return true
    } 
    else return false
  }

  export const generateTurnDelay = (min, max) => {
    console.log(Math.floor((Math.random() * max) + min))
    return Math.floor((Math.random() * max) + min)
  }