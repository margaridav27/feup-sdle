use crate::utils::{self, file_exist};
extern crate base64;
use base64::encode;
use std::{thread, time};

const BROKER_ADDRESS: &str = "tcp://localhost:5555";
const ERROR: &str = "ERROR";
const MESSAGE: &str = "MSG";
const WAIT: &str = "WAIT";
const CLIENTS_FOLDER: &str = "./clients";

pub fn get(id_arg: Option<String>, topic_arg: Option<String>) {
    if id_arg == None || topic_arg == None {
        eprintln!("Invalid format for command GET <ID> <TOPIC>");
        return;
    }

    let client_id: String = id_arg.unwrap();
    let topic: String = topic_arg.unwrap();
    let idx = get_curr_index(&client_id, &topic);

    if idx < 0 {
        println!("Topic not subscribed by the client.");
        return;
    }
    let msg = format!("GET;{};{};{}", client_id, topic, &idx.to_string());

    loop {
        let mut response: String = "".to_string(); 
        if utils::timeout_request(&msg, BROKER_ADDRESS, &mut response) != 0 {
            eprintln!("Error GET message.");
            return;
        }
    
        let split = response.split(';');
        let res: Vec<&str> = split.collect();
        let info = &res[1..].join(";");
        if res[0] == ERROR {
            println!("Couldn't retrive message: {}", info);
            return;
        } else if res[0] == WAIT {
            thread::sleep(time::Duration::from_millis(500));
        } else if res[0] == MESSAGE {
            update_curr_index(&client_id, &topic, idx + 1);
            println!("Message retrived: {}", info);
            return;
        }
    }

}

pub fn sub(id_arg: Option<String>, topic_arg: Option<String>) {
    if id_arg == None || topic_arg == None {
        eprintln!("Invalid format for command SUB <ID> <TOPIC>");
        return;
    }

    let client_id: String = id_arg.unwrap();
    let topic: String = topic_arg.unwrap();

    let file_path = build_file_path(&client_id, &topic);
    if file_exist(&file_path) {
        println!("Client already subscribed.");
        return;
    }


    let msg = format!("SUB;{};{}", client_id, topic);
    let mut response = "".to_string();
    if utils::timeout_request(&msg, BROKER_ADDRESS, &mut response) != 0 {
        eprintln!("Error SUB topic.");
        return;
    }

    let split = response.split(';');
    let res: Vec<&str> = split.collect();
    if res[0] == ERROR {
        let info = &res[1..].join(";");
        println!("Couldn't SUB topic: {}", info);
        return;
    }
    update_curr_index(&client_id, &topic, res[0].parse().unwrap());
    println!("Success, idx: {}", res[0]);
}

pub fn unsub(id_arg: Option<String>, topic_arg: Option<String>) {
    if id_arg == None || topic_arg == None {
        eprintln!("Invalid format for command SUB <ID> <TOPIC>");
        return;
    }

    let client_id: String = id_arg.unwrap();
    let topic: String = topic_arg.unwrap();

    let file_path = build_file_path(&client_id, &topic);
    if !file_exist(&file_path) {
        println!("Client is not subscribed.");
        return;
    }

    let msg = format!("UNSUB;{};{}", client_id, topic);
    let mut response = "".to_string();
    if utils::timeout_request(&msg, BROKER_ADDRESS, &mut response) != 0 {
        eprintln!("Error UNSUB topic.");
        return;
    }

    if !response.is_empty() {
        println!("Couldn't UNSUB topic: {}", response);
        return;
    }
    println!("Success {}", response);
    remove_curr_index(&client_id, &topic);
}

fn get_curr_index(client_id: &str, topic: &str) -> i32 {
    let file_path = build_file_path(client_id, topic);
    if !utils::file_exist(&file_path) {
        return -1;
    }
    utils::read_file(&file_path).parse().unwrap()
}

fn update_curr_index(client_id: &str, topic: &str, idx: i32) {
    utils::create_directory(CLIENTS_FOLDER).unwrap();
    let client_path = format!("{}/{}",CLIENTS_FOLDER, encode(client_id));
    utils::create_directory(&client_path).unwrap();
    let file_path = build_file_path(client_id, topic);
    utils::create_file(&file_path, &idx.to_string()).unwrap();
}

fn remove_curr_index(client_id: &str, topic: &str) {
    let file_path = build_file_path(client_id, topic);
    utils::remove_file(&file_path).unwrap();
}

fn build_file_path(client_id: &str, topic: &str) -> String {
    format!("{}/{}/{}",CLIENTS_FOLDER, encode(client_id), encode(topic))
}
