use crate::utils::timeout_request;

const BROKER_ADDRESS: &str = "tcp://localhost:5556";

pub fn put(topic_arg: Option<String>, message_arg: Option<String>) {
    if topic_arg == None || message_arg == None {
        eprintln!("Invalid format for command PUT <TOPIC> <MESSAGE>");
        return;
    }
    let topic: String = topic_arg.unwrap();
    let message: String = message_arg.unwrap();

    let msg = format!("PUT;{};{}", topic, message);

    let mut response = "".to_string();
    if timeout_request(&msg, BROKER_ADDRESS, &mut response) != 0 {
        eprintln!("Error PUT message.");
        return;
    }

    if !response.is_empty() {
        println!("Couldn't PUT message: {}", response);
        return;
    }

    println!("Success {}", response);
}
