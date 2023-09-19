"use client"
import { useCallback, useMemo, useEffect, useState } from 'react';
import { useUpdateNodeInternals } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { useNodeId } from 'reactflow';
import { wrapWc } from 'wc-react';

import { invoke } from '@tauri-apps/api/tauri'

import './Node.css';


function Node({data, isConnectable}) {
  const updateNodeInternals = useUpdateNodeInternals();
  const nodeId = useNodeId();
  const [NodeWP, setNodeWP] = useState(<div></div>)

  const def = data.def;

  useEffect(() => {
    invoke('node_frontend', {source: def.source})
      .then((s) => {
        if( s !== "") {
          import(/* webpackIgnore: true */ `data:text/javascript;charset=utf-8,${encodeURIComponent(s)}`).then((node) =>{
          console.log(`node-${def.name}`);
          if (!customElements.get(`node-${def.name}`)) {
            customElements.define(`node-${def.name}`, node.NodeFrontEnd);
          };
          const Wrapper = wrapWc(`node-${def.name}`);
          setNodeWP(<Wrapper data={''} data_callback={handleChange}></Wrapper>);
        })
        }
      })
      .catch(console.error)
  }, [])

  const inlets =  def.inlets.map((e, i) => {
    return <Handle key={e.id} id={e.id} type="target" position={Position.Left} style={{ top: 25 + i * 10}} isConnectable={isConnectable} className='custom-node-handle'/>;
  });

  const outlets = def.outlets.map((e, i) => {
    return <Handle key={e.id} id={e.id} type="source" position={Position.Right} style={{ top: 25 + i * 10}} isConnectable={isConnectable} className='custom-node-handle'/>;
  });

  const handleChange = (e) => {data.data_callback(e, nodeId)};

  return (
    <div className="custom-node" style={{minHeight: Math.max(data.def.inlets.length, data.def.outlets.length) < 3 ? 50 : 50 + (Math.max(data.def.inlets.length, data.def.outlets.length) - 3) * 10}}>
      {inlets}
      {outlets}
      <div>
        <div className='custom-node-tittle'>{data.def.name.toUpperCase()}</div>
        <div className='nodrag' style={{margin: 6, fontSize: ".5rem", color: 'black'}}>
          {NodeWP}
        </div>
      </div>
    </div>
  );
}

export default Node;
