"use client"
import { useCallback, useMemo, useEffect } from 'react';
import { useUpdateNodeInternals } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { useNodeId } from 'reactflow';
import { wrapWc } from 'wc-react';

import './Node.css';


function Node({data, isConnectable}) {
  const updateNodeInternals = useUpdateNodeInternals();
  const nodeId = useNodeId();

  const def = data.def;

  // import("data:text/javascript,export function doSomething(str) { return str + '-done'; }").then((moduleData) => {
  //   console.log(moduleData.doSomething('test'));
  // })

  useEffect(() => {import("../components/testWebCom.js"); console.log('afjadjf')}, []);
  const HelloWorld = wrapWc('hello-world');

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
          <HelloWorld data={''} data_callback={handleChange}></HelloWorld>
        </div>
      </div>
    </div>
  );
}

export default Node;
