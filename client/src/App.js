import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { config } from "./constants.js";

const App = () => {
  const [form, setForm] = useState({
    text: "",
  });
  const [body, setBody] = useState([]);

  const navigate = useNavigate();

  const updateForm = (e) => {
    setForm({
      name: e.target.value,
    });
  };

  useEffect(() => {
    async function getRecords() {
      const response = await fetch(config.server);

      if (!response.ok) {
        const message = `An error occurred: ${response.statusText}`;
        window.alert(message);
        return;
      }

      const records = await response.json();
      setBody(records);
    }

    getRecords();

    return;
  }, [body.length]);

  async function onSubmit(e) {
    e.preventDefault();

    await fetch(config.server, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    }).catch((error) => {
      alert(error);
      return;
    });

    setForm({ text: "" });
    navigate("/");
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <input type="text" value={form.text} onChange={updateForm} />
        <input type="submit" value="add" />
      </form>
      {body.map((item) => (
        <div>{item.name}</div>
      ))}
    </div>
  );
};

export default App;
