// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod flow_engine;

use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use flow_engine::engine::{get_node_frontend, run_flow, state::State};

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![node_frontend, run_flow_tauri])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn node_frontend(source: &str, handle: tauri::AppHandle) -> String {
  let mut full_path = PathBuf::new();

  let resource_path = handle.path_resolver()
    .resolve_resource("../")
    .expect("failed to resolve resource");
  let compatible_path = dunce::canonicalize(&resource_path).unwrap(); // FIXME: used because windows paths are dumb

  full_path.push(compatible_path);
  full_path.push(source);

  get_node_frontend(&full_path).unwrap_or("".to_string())
}

#[derive(Serialize, Deserialize, Debug)]
struct Info {
  state: State,
  triggered_by: String
}

#[tauri::command]
async fn run_flow_tauri(info: String, handle: tauri::AppHandle) -> String {

  println!("{:?}", info);
  let info: Result<Info, String> = match serde_json::from_str(&info) {
                    Ok(info) => Ok(info),
                    Err(e) => return format!("Error malformed state json {:?}", e)
                };

  let resource_path = handle.path_resolver()
    .resolve_resource("../")
    .expect("failed to resolve resource");
  let compatible_path = dunce::canonicalize(&resource_path).unwrap();


  let info = info.unwrap();
  let triggered_by = info.triggered_by.clone();
  let mut state = info.state;

  run_flow(&mut state, &triggered_by, &compatible_path);

  return "".to_string();
}
