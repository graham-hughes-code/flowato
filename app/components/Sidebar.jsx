"use client"
import React from 'react';
import {v4 as uuidv4} from 'uuid';
const new_uuid = () => uuidv4();

export default function SideBar() {
  const onDragStart = (event, nodeType, def) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({nodeType: nodeType, def: def}));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <>
      <aside>
        <div className="description">Nodes</div>
        <div className="dndnode input" onDragStart={(event) => onDragStart(event, 'custom',
          {"name": "add", "source": "std/add.wasm",
           "context": "{}",
           "inlets": [
             {"id": new_uuid(), "name": "a", "type": "number", "required": true},
             {"id": new_uuid(), "name": "b", "type": "number", "required": true}],
           "outlets": [
            {"id": new_uuid(), "name": "c", "type": "number"}]})}
        draggable>
          ADD
        </div>
        <div className="dndnode input" onDragStart={(event) => onDragStart(event, 'custom',
          {"name": "div", "source": "std/add.wasm",
           "context": "{}",
           "inlets": [
             {"id": new_uuid(), "name": "a", "type": "number", "required": true},
             {"id": new_uuid(), "name": "b", "type": "number", "required": true}],
           "outlets": [
            {"id": new_uuid(), "name": "c", "type": "number"}]})}
        draggable>
          DIV
        </div>
         <div className="dndnode input" onDragStart={(event) => onDragStart(event, 'custom',
          {"name": "constant", "source": "std/constant.wasm",
           "context": "{\"value\": 3}",
           "inlets": [],
           "outlets": [
             {"id": new_uuid(), "name": "a", "type": "number"}
           ]})}
        draggable>
          CONSTANT
        </div>
      </aside>
    </>
  );
};
