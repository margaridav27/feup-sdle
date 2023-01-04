import React, { useEffect } from "react";
import PropTypes from "prop-types";

MessageBox.propTypes = {
  messages: PropTypes.array.isRequired,
};

export default function MessageBox(props) {
  const messages = props.messages;

  const buildMessages = () => {
    const messageAlerts = [];

    for (const [i, m] of messages.entries()) {
      messageAlerts.push(
        <div
          key={i}
          className={`alert alert-dismissible alert-${
            m.status ? "success" : "danger"
          }`}
          role="alert"
        >
          <button
            type="button"
            className="btn-close"
            onClick={() => {
              props.messages.splice(i, 1);
              props.setMessages([...props.messages]);
            }}
            aria-label="Close"
          ></button>
          <strong>{m.message}</strong>
        </div>
      );
    }

    return messageAlerts;
  };

  useEffect(() => {}, [props.messages]);

  return (
    <div className="messageBoxContainer mt-3 w-100">{buildMessages()}</div>
  );
}
