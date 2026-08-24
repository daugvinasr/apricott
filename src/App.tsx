import * as stylex from "@stylexjs/stylex";

const colorStyles = stylex.create({
  App: {
    backgroundColor: "red",
    width: "400px",
    height: "400px",
  },
});

function App() {
  return <div {...stylex.props(colorStyles.App)}>123</div>;
}

export default App;
