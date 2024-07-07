import { useState, useEffect } from "react";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import LoginForm from "./components/LoginForm";
import { useApolloClient } from "@apollo/client";

const App = () => {
  const [page, setPage] = useState("authors");
  const [token, setToken] = useState(null);
  const client = useApolloClient();
  
  useEffect(() => {
    const token = localStorage.getItem("user-token");
    if (token) {
      setToken(token);
    }
  }, []);

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  };

  if (!token) {
    return (
      <div>
        <h2>Login</h2>
        <LoginForm
          setToken={setToken}
        />
      </div>
    )
  };

  return (
    <div>
        <div>
          <button onClick={() => setPage("authors")}>Authors</button>
          <button onClick={() => setPage("books")}>Books</button>
          <button onClick={() => setPage("add")}>Add book</button>
          <button onClick={logout}>logout</button>
        </div>

        <Authors show={page === "authors"} />
        <Books show={page === "books"} />
        <NewBook show={page === "add"} />
    </div>
  );
};

export default App;