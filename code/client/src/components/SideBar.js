import React from 'react';
import Player from './Player';

const SideBar = ({deck, charDeck, backs, startClick, buttonToggle, players, playerTurn}) => {

    //order players by index
    let tempPLayers = Object.assign([], players)
    tempPLayers = tempPLayers.sort(function(a, b) {
        var keyA = (a.index),
        keyB = (b.index);
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });

    const playerNodes = tempPLayers.map((player, index) => {
        return <Player playerName={player.name} score={player.score} key={index} playerTurn={playerTurn} index ={player.index}/>
    })

    const handleClick = () => {
        startClick();
    }

    return (
        <div className='menu-container'>
            <div className='deck-container'>
                <div id='deck' style={{backgroundImage: `url(${backs.deck_back.image_url})`, backgroundSize: 'cover'}}>{deck.length} </div> 
                <div id='deck' style={{backgroundImage: `url(${backs.character_back.image_url})`, backgroundSize: 'cover'}}>{charDeck.length} </div> 
                <div id='deck' style={{backgroundImage: `url(${backs.nugget_back.image_url})`, backgroundSize: 'cover'}}>28</div> 
            </div>
            <div className='player-container'>
                {playerNodes}
            </div>
            <div className='button-container'>
                <button className='start' onClick={handleClick}>{buttonToggle ? "Leave Game" : "Start Game"}</button> 
            </div>
        </div>
    );
};

export default SideBar;