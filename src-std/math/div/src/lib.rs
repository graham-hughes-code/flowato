use extism_pdk::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Input {
    pub a: f64,
    pub b: f64,
    pub context: serde_json::Value
}

#[derive(Serialize)]
struct Output {
    pub c: f64
}

#[plugin_fn]
pub fn div(input: String) -> FnResult<Json<Output>> {

    let input_data: Input;

    match serde_json::from_str(&input) {
        Ok(data) => {
            input_data = data;
        },
        Err(err) => return Err(WithReturnCode::from(err))
    }

    Ok(Json(Output { c: input_data.a / input_data.b }))
}


#[plugin_fn]
pub fn describe_node(_: ()) -> FnResult<String>
{
    let dis: String =
        r#"{"inputs": {
                "a": {
                    "type": "Number"
                },
                "b": {
                    "type": "Number"
                }
            }, 
            "Output": {
                "c": {
                    "type": "Number"
                }
            }
        }"#.to_string();

    Ok(dis)
}
