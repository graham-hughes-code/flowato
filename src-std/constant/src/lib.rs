use extism_pdk::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Input {
    pub context: Context
}

#[derive(Serialize, Deserialize)]
struct Context {
    pub value: ConstantValue
}

#[derive(Serialize, Deserialize)]
#[serde(untagged)]
enum ConstantValue {
    S(String),
    N(f64)
}

#[derive(Serialize)]
struct Output {
    pub a: ConstantValue
}

#[plugin_fn]
pub fn constant(input: String) -> FnResult<Json<Output>> {
    let input_data: Input;

    match serde_json::from_str(&input) {
        Ok(data) => {
            input_data = data;
        },
        Err(err) => return Err(WithReturnCode::from(err))
    }

    Ok(Json(Output { a: input_data.context.value }))
}


#[plugin_fn]
pub fn describe_node(_: ()) -> FnResult<String>
{
    let dis: String = r##"{"name": "constant",
                          "source": "std/constant.wasm",
                          "context": {"value": ""},
                          "color": "#0284c7",
                          "inlets": [],
                          "outlets": [{"name": "a", "type": "number/string"}]
                          }"##.to_string();

    Ok(dis)
}

#[plugin_fn]
pub fn node_frontend(_: ()) -> FnResult<&'static str>
{
    let web_comp: &'static str = include_str!("const.js");
    Ok(web_comp)
}