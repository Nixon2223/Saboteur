import React from 'react';
import Card from './Card';
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd'
import CharCard from './CharCard';

function HandList({player, cards, char, handleOnClickInvert}) {

  const cardNodes =  cards.map((card, index) => {
    
        return (<Card key={index} card={card} index={index} handleOnClickInvert = {handleOnClickInvert}/>)
    })
  
  return (
    
    <div className = "hand-container">
    <div id='hand-wrapper'>
    <Droppable droppableId={"cards-" + `${player}`} direction="horizontal">
      {(provided) => (
        <div id="hand-list" {...provided.droppableProps} ref={provided.innerRef}>
            {cardNodes}
            {provided.placeholder}
        </div>
      )}
    </Droppable>
    </div>
    <div id='bin-wrapper'>
    <Droppable droppableId="discard">
      {(provided) => (
          <div id="discard" {...provided.droppableProps} ref={provided.innerRef} index = "7">
            <img className='delete' src={require('../img/delete.png')}/>
            {provided.placeholder} 
          </div>
      )}
    </Droppable>
    </div>
    <div id='char-wrapper'>
      <CharCard char={char}/>
    </div>
    
  </div>

  )
}

export default HandList;
