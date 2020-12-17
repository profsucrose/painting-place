#[derive(Debug)]
pub struct Player {
    pub x: f64,
    pub y: f64,
    pub z: f64
}

impl Player {
    pub fn new() -> Player {
        Player {
            x: 0.0,
            y: 0.0,
            z: 0.0
        }
    }

    pub fn make_movement(&mut self, x: f64, y: f64, z: f64) {
        self.x += x;
        self.y += y;
        self.z += z;
    }
}