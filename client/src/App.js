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
    async function fetchData() {
      const response = await fetch(config.server, { method: "GET" });

      if (!response.ok) {
        const message = `An error has occurred: ${response.statusText}`;
        alert(message);
        return;
      }

      const record = await response.json();
      if (!record) {
        alert(`Not found`);
        navigate("/");
        return;
      }

      console.log(record);

      setBody(record);
    }

    fetchData();

    return;
  }, [navigate]);

  async function onSubmit(e) {
    e.preventDefault();

    // // When a post request is sent to the create url, we'll add a new record to the database.
    // const newPerson = { ...form };

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
