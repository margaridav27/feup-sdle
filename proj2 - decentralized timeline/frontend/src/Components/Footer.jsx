import React from "react";

export default function Footer({ port }) {
  return (
    <>
      {port && (
        <div className="container-fluid">
          <span
            className="position-fixed start-0 bottom-0 mb-3 ms-3"
            style={{ fontWeight: "lighter" }}
          >
            Port: {port}
          </span>
        </div>
      )}
    </>
  );
}
