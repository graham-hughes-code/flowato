use extism_pdk::*;
use serde::{Serialize, Deserialize};
use markdown::to_html;

#[derive(Serialize, Deserialize)]
struct Input {
    pub a: String,
    pub context: serde_json::Value
}

#[derive(Serialize)]
struct Output {
    pub c: String
}

#[plugin_fn]
pub fn markdown_to_html(input: String) -> FnResult<Json<Output>> {

    let input_data: Input;

    match serde_json::from_str(&input) {
        Ok(data) => {
            input_data = data;
        },
        Err(err) => return Err(WithReturnCode::from(err))
    }

    Ok(Json(Output { c: to_html(&input_data.a) }))
}


#[plugin_fn]
pub fn describe_node(_: ()) -> FnResult<String>
{
    let dis: String = r##"{"name": "markdown_to_html",
                        "source": "std/markdown_to_html.wasm",
                        "context": {},
                        "color": "#eab308",
                        "inlets": [{"name": "a", "type": "string", "required": true}],
                        "outlets": [{"name": "c", "type": "string"}]
                        }"##.to_string();

    Ok(dis)
}
