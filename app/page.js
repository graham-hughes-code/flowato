"use client"
import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  updateEdge,
  addEdge,
  MarkerType,
  ReactFlowProvider,
} from 'reactflow';
import {v4 as uuidv4} from 'uuid';

import 'reactflow/dist/style.css';

import Node from './components/Node.jsx';

import example from './example.json'

import SideBar from './components/Sidebar';

const onUpdateContext = (data, node_id) => {
  example.graph.nodes.forEach((element, index) => {
    if (element.id == node_id ){
      example.graph.nodes[index].context = data;
    }
  });
};

const initialNodes = [];

example.graph.nodes.map((node, i) => {
  initialNodes.push(
    { id: node.id, type: 'custom', position: { x: node.pos.x, y: node.pos.y }, data: {def: node, data_callback: onUpdateContext}}
  )
});

const initialEdges = [];

example.graph.edges.map((edge, i) => {
  initialEdges.push({ id: edge.id, source: edge.start, target: edge.end, sourceHandle: edge.start_let, targetHandle: edge.end_let, markerEnd: {type: MarkerType.ArrowClosed}});
});

// we define the nodeTypes outside of the component to prevent re-renderings
// you could also use useMemo inside the component
const nodeTypes = { custom: Node };

const new_uuid = () => uuidv4();

const delkeys = ['Backspace', 'Delete']

export default function App() {
  const reactFlowWrapper = useRef(null);
  const edgeUpdateSuccessful = useRef(true);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onConnect = useCallback((params) => {
    
    const id = new_uuid();
    example.graph.edges.push({'id': id,
                              'start': params.source, 'start_let': params.sourceHandle,
                              'end': params.target, 'end_let': params.targetHandle});
    setEdges((eds) =>
      addEdge({...params, id: id, markerEnd: {type: MarkerType.ArrowClosed}}, eds));
  }, [setEdges]);

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
    edgeUpdateSuccessful.current = true;
    newConnection.id = oldEdge.id;
    setEdges((els) => updateEdge(oldEdge, newConnection, els));
  }, []);

  const onEdgeUpdateEnd = useCallback((_, edge) => {
    if (!edgeUpdateSuccessful.current) {
      example.graph.edges = example.graph.edges.filter((e) => e.id !== edge.id);
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }

    edgeUpdateSuccessful.current = true;
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const dataString = event.dataTransfer.getData('application/reactflow');
      const data = JSON.parse(dataString)

      // check if the dropped element is valid
      if (typeof data.nodeType === 'undefined' || !data.nodeType) {
        return;
      }

      const newId = new_uuid();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const newNode = {
        id: newId,
        type: data.nodeType,
        position,
        data: { def: data.def},
      };

      setNodes((nds) => nds.concat(newNode));
      example.graph.nodes.push({id: newId, pos: position, ...data.def});
    },
    [reactFlowInstance]
  );

  const onNodesDelete = useCallback((event) => {
    event.forEach(nd => {
      example.graph.nodes = example.graph.nodes.filter((e) => e.id !== nd.id);
      example.graph.edges = example.graph.edges.filter((e) => (e.start !== nd.id && e.end !== nd.id));
    });
  }, []);

  return (
    <div className="dndflow">
      <ReactFlowProvider>
        <SideBar />
        <div className="reactflow-wrapper" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onInit={setReactFlowInstance}
            onNodesChange={onNodesChange}
            nodeTypes={nodeTypes}
            onEdgesChange={onEdgesChange}
            onEdgeUpdate={onEdgeUpdate}
            onNodesDelete={onNodesDelete}
            onEdgeUpdateStart={onEdgeUpdateStart}
            onEdgeUpdateEnd={onEdgeUpdateEnd}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            maxZoom={5}
            deleteKeyCode={delkeys}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} style={{backgroundColor: '#03011f'}}/>
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
}
