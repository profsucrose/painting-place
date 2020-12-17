use serde::Deserialize;
use serde_json::Result;

#[derive(Deserialize, Debug)]
#[serde(tag = "type")]
pub enum Message {
    Movement { x: f64, y: f64, z: f64 },
    MakeStroke { x: f64, y: f64, z: f64, size: f64, color: u64 }
}

pub fn parse_socket_message(msg: &String) ->  Result<Message> {
    serde_json::from_str(msg)
}