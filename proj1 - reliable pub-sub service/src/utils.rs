use std::io::Write;
use std::fs::File;
use std::fs;
use std::io::BufReader;
use std::io::prelude::*;
use std::io::ErrorKind;
use std::time::{SystemTime, UNIX_EPOCH};
use std::path::Path;

const DEFAULT_TIMEOUT: i64 = 2500;
const DEFAULT_RETRIES: i32 = 3;
const ACKNOWLEDGE: &str = "ACK";

pub fn timeout_request(msg: &str, address: &str, response: &mut String) -> i32{
    let mut retries = DEFAULT_RETRIES;

    let context = zmq::Context::new();
    let mut requester = context.socket(zmq::REQ).unwrap();
    requester.set_linger(0).unwrap();
    
    requester
        .connect(address)
        .expect("Failed connecting to broker");

    requester.send(msg, 0).unwrap();

    while retries > 0 {
        if requester.poll(zmq::POLLIN, DEFAULT_TIMEOUT).unwrap() != 0 {
            let res = requester.recv_string(0).unwrap().unwrap();
            let split = res.split(';');
            let res: Vec<&str> = split.collect();
            if res[0] == ACKNOWLEDGE {
                if res.len() > 1 {
                    let info = &res[1..];
                    *response = info.join(";");
                }
                break;
            } else {
                println!("Invalid {} received: {}", ACKNOWLEDGE, res[0]);
            }
        }

        retries -= 1;
        requester.disconnect(address).unwrap();
        println!("No response from server.");
        if retries == 0 {
            println!("Leaving...");
            return -1;
        }

        println!("Reconnecting...");
        requester = context.socket(zmq::REQ).unwrap();
        requester.set_linger(0).unwrap();

        requester
            .connect(address)
            .expect("Failed reconnecting to broker");
        requester.send(msg, 0).unwrap();
    }

    0
}

pub fn create_directory(path: &str) -> std::io::Result<()> {
    fs::create_dir(path).unwrap_or_else(|error| {
        if error.kind() != ErrorKind::AlreadyExists {
            panic!("Problem creating the directory: {:?}", error);
        }
    });
    Ok(())
}

pub fn create_file(path: &str, content: &str) -> std::io::Result<()> {
    let mut file = std::fs::File::create(path)?;
    file.write_all(content.as_bytes())?;
    Ok(())
}

pub fn remove_directory(path: &str) -> std::io::Result<()> {
    if file_exist(path){
        std::fs::remove_dir_all(path)?;
    }
    Ok(())
}

pub fn remove_file(path: &str) -> std::io::Result<()> {
    if file_exist(path){
        fs::remove_file(path)?;
    }
    Ok(())
}

pub fn read_file(path: &str) -> String {
    let file = File::open(path).expect("[READ] File does not exist.");
    let mut buf_reader = BufReader::new(file);

    let mut contents = String::new();
    buf_reader.read_to_string(&mut contents).unwrap();

    contents
}

pub fn file_exist(path: &str) -> bool {
    Path::new(path).exists()
}

pub fn get_timestamp() -> u128 {
    let start = SystemTime::now();
    start.duration_since(UNIX_EPOCH).unwrap().as_millis()
}
