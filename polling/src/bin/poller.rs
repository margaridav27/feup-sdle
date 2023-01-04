//  Reading from multiple sockets
//  This version uses zmq::poll()

fn main() {
    let context = zmq::Context::new();

    // Connect to task ventilator
    let subscriber_pt = context.socket(zmq::SUB).unwrap();
    assert!(subscriber_pt.connect("tcp://localhost:5557").is_ok());
    let filter_pt = b"5100";
    assert!(subscriber_pt.set_subscribe(filter_pt).is_ok());

    // Connect to weather server
    let subscriber_us = context.socket(zmq::SUB).unwrap();
    assert!(subscriber_us.connect("tcp://localhost:5556").is_ok());
    let filter_us = b"10001";
    assert!(subscriber_us.set_subscribe(filter_us).is_ok());

    // Process messages from both sockets
    let mut msg = zmq::Message::new();
    loop {
        let mut items = [
            subscriber_pt.as_poll_item(zmq::POLLIN),
            subscriber_us.as_poll_item(zmq::POLLIN),
        ];
        zmq::poll(&mut items, -1).unwrap();
        if items[0].is_readable() && subscriber_pt.recv(&mut msg, 0).is_ok() {
            //  Process task
            print!("++ {}\n", msg.as_str().unwrap())
        }
        if items[1].is_readable() && subscriber_us.recv(&mut msg, 0).is_ok() {
            // Process weather update
            print!("** {}\n", msg.as_str().unwrap())
        }
    }
}