import "./App.css";

const generateClick = (name: string) => () => console.log(name);

const generateButton = (name: string) => (
  <button onClick={generateClick(name)}>{name}</button>
);

const App = () => (
  <div id="container">
    <h1>Hello</h1>
    {["hi", "nothing"].map(generateButton)}
  </div>
);

export default App;
