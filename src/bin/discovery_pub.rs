//  Weather update server
//  Binds PUB socket to tcp://*:5556
//  Publishes random weather updates

use rand::Rng;
use std::time::Duration;

fn main() {
    // Prepare context and publisher
    let context = zmq::Context::new();
    let publisher = context.socket(zmq::PUB).unwrap();

    assert!(publisher.bind("tcp://*:5562").is_ok());

    // Initialize random generator
    let mut rng = rand::thread_rng();

    loop {

        let zipcode = rng.gen_range(0..20000);
        let temperature = rng.gen_range(0..215) - 80;
        let relhumidity = rng.gen_range(0..50) + 10;

        let data = format!("{:05} {} {}", zipcode, temperature, relhumidity);

        // Send message to all subscribers
        publisher.send(&data, 0);
    }

    publisher.disconnect("tcp://*:5562");
    context.destroy();
}