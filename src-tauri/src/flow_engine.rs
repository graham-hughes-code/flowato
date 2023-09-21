pub mod engine {
    use std::fs::read;
    use std::path::{Path, PathBuf};
    use std::str;
    use extism::{Plugin, Context};
    use serde_json::Value;
    use serde::{Deserialize, Serialize};

    pub mod state {
        use serde::{Deserialize, Serialize};
        use serde_json::Value;
        use std::collections::HashMap;


        #[derive(Serialize, Deserialize, Debug)]
        pub struct State {
            pub version: String,
            pub graph: Graph
        }

        #[derive(Serialize, Deserialize, Debug)]
        pub struct Graph {
            pub nodes: Vec<Node>,
            pub edges: Vec<Edge>
        }

        #[derive(Serialize, Deserialize, Debug)]
        pub struct Pos {
            pub x: f32,
            pub y: f32
        }

        #[derive(Serialize, Deserialize, Debug)]
        pub struct Node {
            pub id: String,
            pub name: String,
            pub source: String,
            pub pos: Pos,
            pub context: Value,
            pub inlets: Vec<Inlet>,
            pub outlets: Vec<Outlet>
        }

        #[derive(Serialize, Deserialize, Debug, PartialEq, Eq, Hash)]
        #[serde(rename(serialize = "ser_name"))]
        pub struct Inlet {
            pub id: String,
            pub name: String,
            #[serde(rename = "type")]
            pub _type: String,
            pub required: bool
        }

        #[derive(Serialize, Deserialize, Debug)]
        pub struct Outlet {
            pub id: String,
            pub name: String,
            #[serde(rename = "type")]
            pub _type: String
        }

        #[derive(Serialize, Deserialize, Debug)]
        pub struct Edge {
            pub id: String,
            pub start: String,
            pub end: String,
            pub start_let: String,
            pub end_let: String,
            pub last_value: Option<String>
        }

        impl State {
            pub fn from_str(s: &str) -> Result<Self, String> {
                match serde_json::from_str(s) {
                    Ok(state) => Ok(state),
                    Err(e) => Err(format!("Error malformed state json {:?}", e))
                }
            }

            pub fn clear_last_values(&mut self) {
                for edge in &mut self.graph.edges{
                    edge.last_value = None;
                }
            }

            pub fn push_values_to_edges(&mut self, node_id: &str, results: &str) {
                let mut outlet_to_result: HashMap<String, Value>  = HashMap::new();

                let current_node: &Node = self.try_find_node(node_id).unwrap();

                for outlet in &current_node.outlets {

                    let results_value: Value = serde_json::from_str(results).unwrap();
                    let value_to_push: &Value = &results_value[&outlet.name];

                    outlet_to_result.insert(
                        outlet.id.clone(),
                        value_to_push.clone()
                    );
                }

                for (outlet_id, value_to_push) in outlet_to_result{
                    for edge in &mut self.graph.edges {
                        if edge.start_let == outlet_id {
                            edge.last_value = Some(serde_json::to_string(&value_to_push).unwrap());
                        }
                    }
                }

            }

            pub fn try_find_node_next_ids(&self, node_id: &str) -> Option<Vec<String>> {
                let mut next_node_ids: Vec<String> = Vec::new();

                let current_node: &Node = self.try_find_node(node_id).unwrap();
                let mut current_node_outlet_id: Vec<&str> = Vec::new();
                for outlet in &current_node.outlets {
                    current_node_outlet_id.push(&outlet.id);
                }

                let mut inlet_ids: Vec<&str> = Vec::new();
                for edge in &self.graph.edges {
                    if current_node_outlet_id.iter().any(|&i| i == edge.start_let) {
                        inlet_ids.push(&edge.end_let);
                    }
                }

                for node in &self.graph.nodes {
                    for inlet in &node.inlets {
                        if inlet_ids.iter().any(|&i| i == inlet.id) {
                            next_node_ids.push(node.id.clone());
                        }
                    }
                }

                if next_node_ids.is_empty() {
                    return None;
                }

                Some(next_node_ids)
            }

            pub fn get_inputs_edges_by_node<'a>(&'a self, node: &'a Node) -> HashMap<&Inlet, Option<&Edge>> {
                let inlet_ids: &Vec<Inlet> = &node.inlets;

                let mut inlet_to_edge: HashMap<&Inlet, Option<&Edge>> = HashMap::new();

                for inlet_id in inlet_ids {
                    let mut edge: Option<&Edge> = None;

                    for e in &self.graph.edges {
                        if e.end_let == inlet_id.id {
                            edge = Some(e);
                        }
                    }

                    inlet_to_edge.insert(inlet_id, edge);

                }

                inlet_to_edge
            }

            pub fn try_find_node(&self, node_id: &str) -> Option<&Node> {
                for ele in &self.graph.nodes {
                    if ele.id == node_id {
                        return Some(&ele);
                    }
                }
                None
            }

            pub fn try_find_node_by_outlet_id(&self, outlet_id: &str) -> Option<&Node> {
                for node in &self.graph.nodes {
                    for outlet in &node.outlets {
                        if outlet.id == outlet_id {
                            return Some(node);
                        }
                    }
                }
                None
            }
        }
    }

    pub fn run_flow(state: &mut state::State, triggered_by: &str, run_path: &Path) {

        state.clear_last_values();

        let mut stack: Vec<String> = Vec::new();
        stack.push(triggered_by.into());

        'stack_flow: while let Some(ptr) = stack.pop() {

            let current_node: &state::Node = state.try_find_node(&ptr).unwrap();
            println!("PTR: {:?} Name {:?}", ptr, current_node.name);

            let mut inputs: Value =  serde_json::json!({});

            let inlet_to_edge = state.get_inputs_edges_by_node(current_node);

            for (inlet, edge) in inlet_to_edge {
                match edge {
                    Some(edge) => {
                        match &edge.last_value {
                            Some(last_value) => {
                                let current_input: Value = serde_json::from_str(&last_value).unwrap();

                                let wrapped_current_input = serde_json::json!(
                                    {
                                        inlet.name.clone(): current_input
                                    }
                                );

                                merge(&mut inputs, &wrapped_current_input);
                            },
                            None => {
                                stack.push(state.try_find_node_by_outlet_id(&edge.start_let).unwrap().id.clone());
                                continue 'stack_flow;
                            }
                        }
                    }
                    None => {
                        if inlet.required == true {
                            panic!("required inlet not filled");
                        }
                    }
                }
            }

            let current_context_json: Value = pull_context(current_node.context.clone());

            merge(&mut inputs, &current_context_json);
            println!("inputs: {:?}", serde_json::to_string(&inputs).unwrap());

            let mut full_path = PathBuf::new();
            full_path.push(run_path);
            full_path.push(Path::new(&current_node.source));

            let data: Vec<u8> = try_load_wasm_file(&full_path).unwrap();
            let results: String = try_run_wasm(
                data,
                &current_node.name,
                &serde_json::to_string(&inputs).unwrap()
            ).unwrap();

            println!("results: {results}");

            state.push_values_to_edges(&ptr, &results);

            match state.try_find_node_next_ids(&ptr) {
                Some(mut next_node_ids) => stack.append(&mut next_node_ids),
                None => continue
            }

        }
    }

    fn try_load_wasm_file(file_path: &Path) -> Result<Vec<u8>, String> {
        match read(file_path) {
            Ok(data) => Ok(data),
            Err(e) => Err(format!("Error trying to load file {} {}", &file_path.display(), e))
        }
    }

    fn try_run_wasm(data: Vec<u8>, name: &str, input: &str) -> Result<String, String> {
        let context: Context = Context::new();
        let mut plugin = Plugin::new(&context, data, [], false).unwrap();
        match plugin.call(&name, &input) {
            Ok(result) => Ok(str::from_utf8(result).unwrap().to_string()),
            Err(err) => {
                println!("Error On Node \"{}\": {:?}", name, err);
                return Err("error".to_string());
            }
        }
    }

    pub fn get_node_frontend(source: &Path) -> Result<String, String> {
        let data: Vec<u8> = try_load_wasm_file(source)?;
        let results: String = try_run_wasm(
            data,
            "node_frontend",
            ""
        )?;
        Ok(results)
    }

    pub fn get_node_def(source: &Path) -> Result<String, String> {
        let data: Vec<u8> = try_load_wasm_file(source)?;
        let results: String = try_run_wasm(
            data,
            "describe_node",
            ""
        )?;
        Ok(results)
    }

    #[derive(Serialize, Deserialize, Debug)]
    struct ContextWrapper {
        pub context: Value
    }

    fn pull_context(con: Value) -> Value {
        serde_json::value::to_value(ContextWrapper {
            context: con
        }).unwrap()
    }

    fn merge(a: &mut Value, b: &Value) {
        match (a, b) {
            (&mut Value::Object(ref mut a), &Value::Object(ref b)) => {
                for (k, v) in b {
                    merge(a.entry(k.clone()).or_insert(Value::Null), v);
                }
            }
            (a, b) => {
                *a = b.clone();
            }
        }
    }

}
