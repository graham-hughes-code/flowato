// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod flow_engine;
use std::fs;
use std::path::PathBuf;
use serde_json::Value;
use serde::{Deserialize, Serialize};
use flow_engine::engine::{get_node_frontend, run_flow, get_node_def, state::State};
use std::sync::Mutex;
use tauri::State as TauriState;

struct ExecutionRun {
  run: Mutex<i32>
}

fn main() {
  tauri::Builder::default()
    .manage(ExecutionRun {run: 0.into()} )
    .invoke_handler(tauri::generate_handler![node_frontend, run_flow_tauri, get_all_nodes_defs])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
async fn node_frontend(source: &str, handle: tauri::AppHandle) -> Result<String, String> {
  let mut full_path = PathBuf::new();

  let resource_path = handle.path_resolver()
    .resolve_resource("../")
    .expect("failed to resolve resource");
  let compatible_path = dunce::canonicalize(&resource_path).unwrap(); // FIXME: used because windows paths are dumb

  full_path.push(compatible_path);
  full_path.push(source);

  let res = get_node_frontend(&full_path).unwrap_or("".to_string());

  Ok(res)
}

#[derive(Serialize, Deserialize, Debug)]
struct Info {
  state: State,
  triggered_by: String
}

#[tauri::command]
async fn run_flow_tauri(info: String, handle: tauri::AppHandle, execution_run: TauriState<'_, ExecutionRun>) -> Result<String, String> {

  let info: Result<Info, String> = match serde_json::from_str(&info) {
                    Ok(info) => Ok(info),
                    Err(e) => return Err(format!("Error malformed state json {:?}", e))
                };

  let mut execution_run: std::sync::MutexGuard<'_, i32> = execution_run.run.lock().unwrap();

  *execution_run += 1;

  let resource_path = handle.path_resolver()
    .resolve_resource("../")
    .expect("failed to resolve resource");
  let compatible_path = dunce::canonicalize(&resource_path).unwrap();


  let info = info.unwrap();
  let triggered_by = info.triggered_by.clone();
  let mut state = info.state;

  run_flow(&mut state, &triggered_by, &compatible_path);

  state.execution = *execution_run;

  return Ok(serde_json::to_string(&state).unwrap());
}

#[derive(Serialize, Deserialize, Debug)]
struct NodesDefsOut {
  node_defs: Vec<Value>
}

#[tauri::command]
async fn get_all_nodes_defs(handle: tauri::AppHandle) -> String {
  let resource_path = handle.path_resolver()
    .resolve_resource("../")
    .expect("failed to resolve resource");
  let mut compatible_path: PathBuf = dunce::canonicalize(&resource_path).unwrap();
  compatible_path.push("std");

  let mut result_strings: Vec<String> = Vec::new();
  for file in fs::read_dir(compatible_path).unwrap() {
      result_strings.push(get_node_def(&mut file.unwrap().path()).unwrap());
  }

  let mut result_values: Vec<Value> = vec![];
  for res in result_strings {
    result_values.push(serde_json::from_str(&res).unwrap());
  }

  serde_json::to_string( &NodesDefsOut {node_defs: result_values} ).unwrap()
}
