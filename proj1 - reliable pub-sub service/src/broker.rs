use crate::storage::Storage;

const CLIENTS_ADDRESS: &str = "tcp://*:5555";
const SERVERS_ADDRESS: &str = "tcp://*:5556";

pub fn start() {
    let mut storage: Storage = Storage::new();

    let context = zmq::Context::new();
    let clients = context.socket(zmq::REP).unwrap();
    let servers = context.socket(zmq::REP).unwrap();

    clients
        .bind(CLIENTS_ADDRESS)
        .expect("failed to bind clients router");
    servers
        .bind(SERVERS_ADDRESS)
        .expect("failed to bind servers dealer");
    
        loop {
            let mut items = [
                clients.as_poll_item(zmq::POLLIN),
                servers.as_poll_item(zmq::POLLIN),
            ];
            zmq::poll(&mut items, -1).unwrap();
    
            if items[0].is_readable() {
                let message = clients.recv_string(0).unwrap().unwrap();
                let response = parse_message(&message, &mut storage);
                clients.send(&response, 0).unwrap();
            }
            if items[1].is_readable() {
                let message = servers.recv_string(0).unwrap().unwrap();
                let response = parse_message(&message, &mut storage);
                servers.send(&response, 0).unwrap();
            }  
        }
}

fn parse_message(msg: &str, storage: &mut Storage) -> String {

    let split = msg.split(';');
    let vec: Vec<&str> = split.collect();

    let response = match vec[0] {
        "PUT" => {
            println!("[PUT] Message '{}' in topic '{}'", vec[1], vec[2]);
            storage.put(vec[1], vec[2])
        },
        "SUB" => {
            println!("[SUB] Client '{}' to topic '{}'", vec[1], vec[2]);
            storage.sub(vec[1], vec[2])
        },
        "GET" => {
            println!("[GET] Get message from topic '{}' to client '{}' index '{}'", vec[2], vec[1], vec[3]);
            storage.get(vec[1], vec[2], vec[3])
        },
        "UNSUB" => {
            println!("[UNSUB] Client {} unsubscribed topic {}", vec[1], vec[2]);
            storage.unsub(vec[1], vec[2])
        },
        _ => "Unknown request".to_string(),
    };

    println!("Sent '{}' as a response", response);
    response
}
