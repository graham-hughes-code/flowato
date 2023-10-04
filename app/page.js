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
  onNodeDragStop,
} from 'reactflow';
import {v4 as uuidv4} from 'uuid';

import 'reactflow/dist/style.css';

import { invoke } from '@tauri-apps/api/tauri'

import { wrapWc } from 'wc-react';

import Node from './components/Node.jsx';

import example from './example.json'

import SideBar from './components/Sidebar';


const sources = [...new Set(example.graph.nodes.map((n) => {return {"name": n.name, "source": n.source}}))];

sources.forEach((source) => {
  "use client"
  invoke('node_frontend', {source: source.source})
    .then((s) => {
      if( s !== "") {
        import(/* webpackIgnore: true */ `data:text/javascript;charset=utf-8,${encodeURIComponent(s)}`).then((node) =>{
        if (!customElements.get(`node-${source.name}`)) {
          customElements.define(`node-${source.name}`, node.NodeFrontEnd);
        };
      })
      }
    })
    .catch(console.error)
});

const initialNodes = [];

example.graph.nodes.map((node, i) => {
  initialNodes.push(
    { id: node.id, type: 'custom', position: { x: node.pos.x, y: node.pos.y }, data: {def: node, Wrapper: wrapWc(`node-${node.name}`)}}
  )
});

const initialEdges = [];

example.graph.edges.map((edge, i) => {
  initialEdges.push({ id: edge.id, source: edge.start, target: edge.end, sourceHandle: edge.start_let, targetHandle: edge.end_let, markerEnd: {type: MarkerType.ArrowClosed, color: "#525252", width: 15, height: 15}, style: {stroke: "#525252"} });
});

// we define the nodeTypes outside of the component to prevent re-renderings
// you could also use useMemo inside the component
const nodeTypes = { custom: Node };

const new_uuid = () => uuidv4();

const delkeys = ['Backspace', 'Delete']

export default function App() {
  const reactFlowWrapper = useRef(null);
  const edgeUpdateSuccessful = useRef(true);

  const onUpdateContext = (data, node_id) => {
    example.graph.nodes.forEach((element, index) => {
      if (element.id == node_id ) {
        example.graph.nodes[index].context = data;
      }
    });
    invoke('run_flow_tauri', {info: JSON.stringify({state: example, triggered_by: node_id})})
      .then((state) => {
        state = JSON.parse(state);
        setNodes((nds) =>
          nds.map((node) => {
            const new_node = state.graph.nodes.find((n) => {return n.id == node.id});
            if (new_node.context && (JSON.stringify(new_node.context) !== JSON.stringify(node.data.def.context))) {
              node.data = {...node.data, def: {...node.data.def, context: new_node.context}};
            }
            return node;
          })
        );
      })
      .catch(console.error);
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes.map((n) => { n.data = {...n.data, data_callback: onUpdateContext}; return n; }));
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onConnect = useCallback((params) => {
    
    const id = new_uuid();
    example.graph.edges.push({'id': id,
                              'start': params.source, 'start_let': params.sourceHandle,
                              'end': params.target, 'end_let': params.targetHandle});
    setEdges((eds) =>
      addEdge({...params, id: id, markerEnd: {type: MarkerType.ArrowClosed, color: "#525252", width: 15, height: 15}, style: {stroke: "#525252"}}, eds));
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
        data: {def: data.def,
               data_callback: onUpdateContext,
               Wrapper: wrapWc(`node-${data.def.name}`)},
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

  const onNodeDragStop = useCallback((_, node) => {
    example.graph.nodes.forEach((n) => {
      if (n.id == node.id) {
        n.pos = {x: node.position.x, y: node.position.y};
      }
    });
  });

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
            onNodeDragStop={onNodeDragStop}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            maxZoom={5}
            minZoom={.1}
            deleteKeyCode={delkeys}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} style={{backgroundColor: '#cfd8dc'}}/>
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
}
