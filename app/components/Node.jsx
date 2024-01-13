"use client";
import { useRef } from "react";
import { useUpdateNodeInternals } from "reactflow";
import { Handle, Position } from "reactflow";
import { useNodeId } from "reactflow";

function Node({ data, isConnectable }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const nodeId = useNodeId();
  let myRef = useRef();

  const inlets = data.def.inlets.map((e, i) => {
    return (
      <Handle
        className="!w-[8px] !h-[8px] !bg-neutral-600 !border-0"
        key={e.id}
        id={e.id}
        type="target"
        position={Position.Left}
        style={{ top: 35 + i * 10 }}
        isConnectable={isConnectable}
      />
    );
  });

  const outlets = data.def.outlets.map((e, i) => {
    return (
      <Handle
        className="!w-[8px] !h-[8px] !bg-neutral-600 !border-0"
        key={e.id}
        id={e.id}
        type="source"
        position={Position.Right}
        style={{ top: 35 + i * 10 }}
        isConnectable={isConnectable}
      />
    );
  });

  const handleChange = (e) => {
    data.data_callback(e, nodeId);
  };

  if (myRef.current) {
    myRef.current.setAttribute("data", JSON.stringify(data.def.context));
  }

  return (
    <div
      className="min-w-[120px] min-h-[80px] bg-slate-50 rounded border-neutral-600 border-2 shadow-md shadow-slate-500"
      style={{
        MinHeight:
          Math.max(data.def.inlets.length, data.def.outlets.length) < 3
            ? 60
            : 80 +
              (Math.max(data.def.inlets.length, data.def.outlets.length) - 3) *
                10,
      }}
    >
      {inlets}
      {outlets}
      <div>
        <div
          className="!border-neutral-600 border-b-2 px-2 font-mono text-base text-neutral-800"
          style={{ backgroundColor: data.def.color }}
        >
          {data.def.name.toUpperCase()}
        </div>
        <div className="nodrag m-3">
          <data.Wrapper ref={myRef} data_callback={handleChange}></data.Wrapper>
        </div>
      </div>
    </div>
  );
}

export default Node;
