//  Weather update server
//  Binds PUB socket to tcp://*:5556
//  Publishes random weather updates

use rand::Rng;
use std::thread;
use std::time::Duration;

fn main() {
    let context = zmq::Context::new();
    let publisher = context.socket(zmq::PUB).unwrap();

    assert!(publisher.bind("tcp://*:5557").is_ok());

    let mut rng = rand::thread_rng();

    loop {

        let zipcode = rng.gen_range(0..9999);
        let temperature = rng.gen_range(0..215) - 80;
        let relhumidity = rng.gen_range(0..50) + 10;

        let data = format!("{:04} {} {}", zipcode, temperature, relhumidity);
        publisher.send(&data, 0);
    }

    publisher.disconnect("tcp://*:5557");
    context.destroy();
}