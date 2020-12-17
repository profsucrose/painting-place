/// Toyed around with the ws-rs chat example
extern crate ws;
use std::{collections::HashMap, sync::{Arc, Mutex}};

use uuid::Uuid;
use ws::{CloseCode, Handler, Handshake, Message, Request, Response, Result, Sender, listen};
use painting_place::{events::parse_socket_message, player::Player, stroke::Stroke};

type Players = Arc<Mutex<HashMap<String, Player>>>;
type Strokes = Arc<Mutex<Vec<Stroke>>>;
type Senders = Arc<Mutex<Vec<Sender>>>;

// ConnectionHandler web application handler
#[derive(Clone)]
struct ConnectionHandler {
    out: Sender,
    id: String,
    players: Players,
    strokes: Strokes,
    senders: Senders
}

impl<'a> Handler for ConnectionHandler {
    fn on_close(&mut self, _: CloseCode, reason: &str) {
        println!("{} disconnected (Reason: {})", self.id, reason);
        self.players.lock().as_mut().unwrap().remove(&self.id);
    }

    fn on_open(&mut self, _: Handshake) -> Result<()> {
        println!("{} connected!", self.id);
        self.players.lock().as_mut().unwrap().insert(self.id.clone(), Player::new());
        Ok(())
    }

    fn on_request(&mut self, req: &Request) -> Result<Response> {
        match req.resource() {
            // The default trait implementation
            "/ws" => Response::from_request(req),
            _ => Ok(Response::new(404, "Not Found", b"404 - Not Found".to_vec())),
        }
    }

    // Handle messages recieved in the websocket (in this case, only on /ws)
    fn on_message(&mut self, msg: Message) -> Result<()> {
        // Broadcast to all connections
        let message = parse_socket_message(&msg.to_string());
        println!("MSG: {}", msg);
        if let Err(_) = message {
            // return Ok so event loop doesn't halt if JSON is invalid
            println!("Invalid JSON: {:?}", message);
            return Ok(())
        }

        let message = message.unwrap();
        println!("{:?}", message);
        match message {
            painting_place::events::Message::Movement { x, y, z } => {
                let mut players = self.players.lock();
                let player = players.as_mut().unwrap().get_mut(&self.id).unwrap();
                player.make_movement(x, y, z);
            }
            painting_place::events::Message::MakeStroke { x, y, z, size, color } => {
                // handle brush strokes
                self.strokes.lock().as_mut().unwrap().push(Stroke {
                    x, y, z, size, color
                })
            }
        }

        println!("Players: {:?}", self.players.lock());
        println!("Strokes: {:?}", self.strokes.lock());

        for sender in self.senders.lock().unwrap().iter() {
            if sender.token() == self.out.token() {
                continue;
            }
            
            if let Err(err) = sender.send(format!("{{ \"sender\": \"{}\", \"data\": {} }}", self.id, msg.to_string())) {
                println!("Error in broadcasting to socket peer: {:?}", err);
            }
        };
        Ok(())
    }
}

fn main() {
    let players = Players::new(Mutex::new(HashMap::new()));
    let strokes = Strokes::new(Mutex::new(vec![]));
    let senders = Senders::new(Mutex::new(vec![]));
    // create connection handler for each new websocket
    listen("127.0.0.1:8000", |out| {
        senders.lock().unwrap().push(out.clone());
        ConnectionHandler { 
            out, 
            id: Uuid::new_v4().to_string(),
            players: players.clone(),
            strokes: strokes.clone(),
            senders: senders.clone()
        }
    }).unwrap()
}