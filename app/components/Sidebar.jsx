"use client";
import { React, useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { v4 as uuidv4 } from "uuid";
const new_uuid = () => uuidv4();

export default function SideBar() {
  const [nodes, setNodes] = useState(null);

  const onDragStart = (event, nodeType, def) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ nodeType: nodeType, def: def })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  useEffect(() => {
    invoke("get_all_nodes_defs")
      .then((nodes) => {
        nodes = JSON.parse(nodes);
        setNodes(
          nodes.node_defs.map((node) => {
            return (
              <div
                key={node.name}
                className="dndnode input"
                onDragStart={(event) =>
                  onDragStart(event, "custom", {
                    ...node,
                    inlets: node.inlets.map((inlet) => {
                      return { ...inlet, id: new_uuid() };
                    }),
                    outlets: node.outlets.map((outlet) => {
                      return { ...outlet, id: new_uuid() };
                    }),
                  })
                }
                draggable
              >
                {node.name}
              </div>
            );
          })
        );
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <aside>
        <div className="description">Nodes</div>
        {nodes ? nodes : "loading..."}
      </aside>
    </>
  );
}
