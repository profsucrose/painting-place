use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct EventBroadcast {
    pub sender: String,
    pub data: String
}